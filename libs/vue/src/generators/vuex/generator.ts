import {
  addDependenciesToPackageJson,
  applyChangesToString,
  ChangeType,
  convertNxGenerator,
  formatFiles,
  readProjectConfiguration,
  Tree as DevkitTree,
} from '@nx/devkit';
import { findNodes } from '@nx/workspace';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import * as semver from 'semver';
import * as ts from 'typescript';
import { VuexGeneratorSchema } from './schema';

interface NormalizedSchema extends VuexGeneratorSchema {
  isVue3: boolean;
}

function normalizeOptions(tree: DevkitTree, schema: VuexGeneratorSchema) {
  const packageJson = JSON.parse(tree.read('package.json', 'utf-8') || '');
  const isVue3 =
    semver.major(semver.coerce(packageJson?.dependencies['vue']) || '') === 3;

  return { ...schema, isVue3 };
}

function addStoreConfig(tree: DevkitTree, options: NormalizedSchema) {
  const { sourceRoot } = readProjectConfiguration(tree, options.project);
  const vue2Content = `
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
  const vue3Content = `
import { createStore } from 'vuex';

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {}
});
`;
  tree.write(
    path.join(sourceRoot || '', 'store/index.ts'),
    options.isVue3 ? vue3Content : vue2Content
  );
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
): ts.CallExpression | undefined {
  const callExpressions = findNodes(
    sourceFile,
    ts.SyntaxKind.CallExpression
  ) as ts.CallExpression[];

  return callExpressions.find(
    (callExpr) => callExpr.expression.getText() === 'createApp'
  );
}

function addStoreToMain(tree: DevkitTree, options: NormalizedSchema) {
  const { sourceRoot } = readProjectConfiguration(tree, options.project);
  const mainPath = path.join(sourceRoot || '', 'main.ts');
  const mainContent = tree.read(mainPath, 'utf-8') || '';

  if (!tree.exists(mainPath)) {
    throw new Error(`Could not find ${mainPath}.`);
  }

  const mainSourceFile = ts.createSourceFile(
    mainPath,
    mainContent,
    ts.ScriptTarget.Latest,
    true
  );

  let position: number;
  let content: string;

  if (options.isVue3) {
    const createAppCallExpression = getCreateAppCallExpression(mainSourceFile);

    if (!createAppCallExpression) {
      throw new Error(`Could not find 'createApp' call in ${mainPath}.`);
    }

    position = createAppCallExpression.end;
    content = '.use(store)';
  } else {
    const newVueExpression = getNewVueExpression(mainSourceFile);

    if (!newVueExpression || !newVueExpression.arguments?.[0]) {
      throw new Error(`Could not find Vue instantiation in ${mainPath}.`);
    }

    position = newVueExpression.arguments[0].getStart() + 1;
    content = '\n  store,';
  }

  const updatedMainContent = applyChangesToString(mainContent, [
    {
      type: ChangeType.Insert,
      index: 0,
      text: "import store from './store';\n",
    },
    {
      type: ChangeType.Insert,
      index: position,
      text: content,
    },
  ]);

  tree.write(mainPath, updatedMainContent);
}

export async function vuexGenerator(
  tree: DevkitTree,
  schema: VuexGeneratorSchema
) {
  const options = normalizeOptions(tree, schema);

  addStoreConfig(tree, options);
  addStoreToMain(tree, options);

  const installTask = addDependenciesToPackageJson(
    tree,
    {
      vuex: options.isVue3 ? '^4.0.0-0' : '^3.4.0',
    },
    {}
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(installTask);
}

export const vuexSchematic = convertNxGenerator(vuexGenerator);
