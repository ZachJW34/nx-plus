import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';
import { addPropertyToJestConfig } from '@nrwl/jest';
import { readWorkspace, updateJsonInTree, findNodes } from '@nrwl/workspace';
import * as ts from 'typescript';

function updateJestConfig(projectRoot: string) {
  return (tree: Tree) => {
    const jestConfig = 'jest.config.js';
    const content = tree.read(`${projectRoot}/${jestConfig}`).toString();
    const sourceFile = ts.createSourceFile(
      jestConfig,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const hasGlobals = findNodes(
      sourceFile,
      ts.SyntaxKind.PropertyAssignment
    ).some(
      (node: ts.PropertyAssignment) =>
        ts.isIdentifier(node.name) && node.name.text === 'globals'
    );
    const vueJestConfig = { tsConfig: `${projectRoot}/tsconfig.spec.json` };

    if (!hasGlobals) {
      return addPropertyToJestConfig(
        tree,
        `${projectRoot}/${jestConfig}`,
        'globals',
        { 'vue-jest': vueJestConfig }
      );
    } else {
      return addPropertyToJestConfig(
        tree,
        `${projectRoot}/${jestConfig}`,
        'globals.vue-jest',
        vueJestConfig
      );
    }
  };
}

function updateTestConfigs(projectRoot: string) {
  return chain([
    updateJsonInTree(projectRoot + '/tsconfig.spec.json', (json) => {
      json.compilerOptions = {
        ...json.compilerOptions,
        jsx: 'preserve',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      };
      return json;
    }),
    updateJestConfig(projectRoot),
  ]);
}

export default function update(): Rule {
  return chain([
    (tree: Tree) => {
      const workspace = readWorkspace(tree);
      return chain(
        Object.keys(workspace.projects).map((key) => {
          const project = workspace.projects[key];
          if (
            project.architect &&
            project.architect.test &&
            project.architect.test.builder === '@nrwl/jest:jest' &&
            tree
              .read(project.architect.test.options.jestConfig)
              .toString('utf-8')
              .includes('vue-jest')
          ) {
            return updateTestConfigs(project.root);
          }
          return noop();
        })
      );
    },
  ]);
}
