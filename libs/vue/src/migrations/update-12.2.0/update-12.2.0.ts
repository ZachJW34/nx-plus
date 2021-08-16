import { formatFiles, findNodes } from '@nrwl/workspace';
import {
  applyChangesToString,
  ChangeType,
  Tree,
  addDependenciesToPackageJson,
  getProjects,
  readJson,
  getPackageManagerCommand,
} from '@nrwl/devkit';
import * as semver from 'semver';
import * as ts from 'typescript';

function updateJestPropertyAssignment(
  tree: Tree,
  fileName: string,
  node: ts.PropertyAssignment,
  value: string
) {
  const newContent = applyChangesToString(tree.read(fileName, 'utf-8'), [
    {
      type: ChangeType.Delete,
      start: node.initializer.pos,
      length: node.initializer.getFullText().length,
    },
    {
      type: ChangeType.Insert,
      index: node.initializer.pos,
      text: value,
    },
  ]);
  tree.write(fileName, newContent);
}

function updateJestConfig(tree: Tree, projectRoot: string, isVue3: boolean) {
  const jestConfig = `${projectRoot}/jest.config.js`;
  const getJestConfigSourceFile = () =>
    ts.createSourceFile(
      'jest.config.js',
      tree.read(jestConfig, 'utf-8'),
      ts.ScriptTarget.Latest,
      true
    );

  const [vueTransform] = findNodes(
    getJestConfigSourceFile(),
    ts.SyntaxKind.PropertyAssignment
  ).filter(
    (node: ts.PropertyAssignment) =>
      ts.isStringLiteral(node.name) &&
      (node.name.text === '.*\\.(vue)$' || node.name.text === '^.+\\.vue$')
  ) as ts.PropertyAssignment[];
  if (!vueTransform) {
    console.log(
      `Could not find 'vue-jest' transform in ${jestConfig}. No changes will be made.`
    );
    return;
  }
  updateJestPropertyAssignment(
    tree,
    jestConfig,
    vueTransform,
    `'${isVue3 ? 'vue3-jest' : '@vue/vue2-jest'}'`
  );

  const [vueJest] = findNodes(
    getJestConfigSourceFile(),
    ts.SyntaxKind.PropertyAssignment
  ).filter(
    (node: ts.PropertyAssignment) =>
      ts.isStringLiteral(node.name) && node.name.text === 'vue-jest'
  ) as ts.PropertyAssignment[];
  if (!vueJest) {
    console.log(
      `Could not find 'vue-jest' global in ${jestConfig}. No changes will be made.`
    );
    return;
  }
  const hasBabel = tree.exists(`${projectRoot}/babel.config.js`);
  updateJestPropertyAssignment(
    tree,
    jestConfig,
    vueJest,
    JSON.stringify({
      tsConfig: `${projectRoot}/tsconfig.spec.json`,
      ...(hasBabel ? { babelConfig: `${projectRoot}/babel.config.js` } : {}),
    })
  );
}

export default async function update(tree: Tree): Promise<void> {
  const packageJson = readJson(tree, 'package.json');
  const vueVersion = packageJson?.dependencies?.vue;
  if (!vueVersion) {
    console.warn('Vue install not found. No changes will be made.');
    return;
  }
  const isVue3 = semver.satisfies(semver.coerce(vueVersion).version, '^3.0.0');
  addDependenciesToPackageJson(
    tree,
    {},
    isVue3
      ? { 'vue3-jest': '^27.0.0-alpha.1' }
      : { '@vue/vue2-jest': '^27.0.0-alpha.1' }
  );

  const projects = getProjects(tree);
  for (const project of projects.values()) {
    if (
      project?.targets?.test?.executor === '@nrwl/jest:jest' &&
      tree
        .read(project.targets.test.options.jestConfig, 'utf-8')
        .includes('vue-jest')
    ) {
      updateJestConfig(tree, project.root, isVue3);
    }
  }
  await formatFiles();
  console.log(
    `The package "vue-jest" is not compatible with Jest v27 and has been replaced with "${
      isVue3 ? 'vue3-jest' : '@vue/vue2-jest'
    }".
You can safely remove "vue-jest" from your "package.json".
Make sure to run "${
      getPackageManagerCommand().install
    }" to install the newly added dependencies.`
  );
}
