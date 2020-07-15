import { join, normalize, tags } from '@angular-devkit/core';
import { chain, Rule, Tree } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  findNodes,
  formatFiles,
  getProjectConfig,
  insert,
} from '@nrwl/workspace';
import {
  InsertChange,
  insertImport,
} from '@nrwl/workspace/src/utils/ast-utils';
import * as ts from 'typescript';
import { VuexSchematicSchema } from './schema';

function addStoreConfig(options: VuexSchematicSchema): Rule {
  return (tree: Tree) => {
    const { sourceRoot } = getProjectConfig(tree, options.project);
    const content = tags.stripIndent`
      import Vue from 'vue';
      import Vuex from 'vuex';

      Vue.use(Vuex);

      export default new Vuex.Store({
        state: {},
        mutations: {},
        actions: {},
        modules: {}
      });
    `;
    tree.create(join(normalize(sourceRoot), 'store/index.ts'), content);
    return tree;
  };
}

function getNewVueExpression(
  sourceFile: ts.SourceFile
): ts.NewExpression | null {
  const callExpressions = findNodes(
    sourceFile,
    ts.SyntaxKind.CallExpression
  ) as ts.CallExpression[];

  for (const callExpr of callExpressions) {
    const { expression: innerExpr } = callExpr;
    if (
      ts.isPropertyAccessExpression(innerExpr) &&
      /new Vue/.test(innerExpr.expression.getText())
    ) {
      return innerExpr.expression as ts.NewExpression;
    }
  }

  return null;
}

function addStoreToMain(options: VuexSchematicSchema): Rule {
  return (tree: Tree) => {
    const { sourceRoot } = getProjectConfig(tree, options.project);
    const mainPath = join(normalize(sourceRoot), 'main.ts');

    if (!tree.exists(mainPath)) {
      throw new Error(`Could not find ${mainPath}.`);
    }

    const mainSourceFile = ts.createSourceFile(
      mainPath,
      tree.read(mainPath).toString('utf-8'),
      ts.ScriptTarget.Latest,
      true
    );
    const newVueExpression = getNewVueExpression(mainSourceFile);

    if (!newVueExpression) {
      throw new Error(`Could not find Vue instantiation in ${mainPath}.`);
    }

    const newVueOptionsObject = newVueExpression.arguments[0];

    insert(tree, mainPath, [
      insertImport(mainSourceFile, mainPath, 'store', './store', true),
      new InsertChange(
        mainPath,
        newVueOptionsObject.getStart() + 1,
        '\n  store,'
      ),
    ]);

    return tree;
  };
}

export default function (options: VuexSchematicSchema): Rule {
  return chain([
    addStoreConfig(options),
    addStoreToMain(options),
    addDepsToPackageJson({ vuex: '^3.4.0' }, {}, true),
    formatFiles(options),
  ]);
}
