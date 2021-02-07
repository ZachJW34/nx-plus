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
import * as semver from 'semver';
import * as ts from 'typescript';
import { VuexSchematicSchema } from './schema';
import { appRootPath } from '../../app-root';
import { loadModule } from '../../utils';

function addStoreConfig(options: VuexSchematicSchema, isVue3: boolean): Rule {
  return (tree: Tree) => {
    const { sourceRoot } = getProjectConfig(tree, options.project);
    const vue2Content = tags.stripIndent`
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
    const vue3Content = tags.stripIndent`
      import { createStore } from 'vuex';

      export default createStore({
        state: {},
        mutations: {},
        actions: {},
        modules: {}
      });
    `;
    tree.create(
      join(normalize(sourceRoot), 'store/index.ts'),
      isVue3 ? vue3Content : vue2Content
    );
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

function getCreateAppCallExpression(
  sourceFile: ts.SourceFile
): ts.CallExpression {
  const callExpressions = findNodes(
    sourceFile,
    ts.SyntaxKind.CallExpression
  ) as ts.CallExpression[];

  return callExpressions.find(
    (callExpr) => callExpr.expression.getText() === 'createApp'
  );
}

function addStoreToMain(options: VuexSchematicSchema, isVue3: boolean): Rule {
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

    let position: number;
    let content: string;

    if (isVue3) {
      const createAppCallExpression = getCreateAppCallExpression(
        mainSourceFile
      );

      if (!createAppCallExpression) {
        throw new Error(`Could not find 'createApp' call in ${mainPath}.`);
      }

      position = createAppCallExpression.end;
      content = '.use(store)';
    } else {
      const newVueExpression = getNewVueExpression(mainSourceFile);

      if (!newVueExpression) {
        throw new Error(`Could not find Vue instantiation in ${mainPath}.`);
      }

      position = newVueExpression.arguments[0].getStart() + 1;
      content = '\n  store,';
    }

    insert(tree, mainPath, [
      insertImport(mainSourceFile, mainPath, 'store', './store', true),
      new InsertChange(mainPath, position, content),
    ]);

    return tree;
  };
}

export default function (options: VuexSchematicSchema): Rule {
  const vue = loadModule('vue', appRootPath);
  const isVue3 = semver.major(vue.version) === 3;

  return chain([
    addStoreConfig(options, isVue3),
    addStoreToMain(options, isVue3),
    addDepsToPackageJson({ vuex: isVue3 ? '4.0.0' : '3.6.2' }, {}, true),
    formatFiles(options),
  ]);
}
