import { tags } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  filter,
  mergeWith,
  move,
  noop,
  Rule,
  Tree,
  url,
  SchematicContext,
} from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  addLintFiles,
  addPackageWithInit,
  addProjectToNxJsonInTree,
  formatFiles,
  generateProjectLint,
  getNpmScope,
  Linter,
  names,
  offsetFromRoot,
  projectRootDir,
  ProjectType,
  toFileName,
  updateJsonInTree,
  updateWorkspace,
  readJsonInTree,
  NxJson,
} from '@nrwl/workspace';
import { LibrarySchematicSchema } from './schema';

/**
 * Depending on your needs, you can change this to either `Library` or `Application`
 */
const projectType = ProjectType.Library;

interface NormalizedSchema extends LibrarySchematicSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(options: LibrarySchematicSchema): NormalizedSchema {
  const name = toFileName(options.name);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${projectRootDir(projectType)}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(options: NormalizedSchema): Rule {
  return mergeWith(
    apply(url(`./files`), [
      applyTemplates({
        ...options,
        ...names(options.name),
        offsetFromRoot: offsetFromRoot(options.projectRoot),
      }),
      options.unitTestRunner === 'none'
        ? filter((file) => file !== '/tests/unit/example.spec.ts')
        : noop(),
      move(options.projectRoot),
    ])
  );
}

function addJest(options: NormalizedSchema): Rule {
  return chain([
    addPackageWithInit('@nrwl/jest'),
    externalSchematic('@nrwl/jest', 'jest-project', {
      project: options.projectName,
      setupFile: 'none',
      skipSerializers: true,
      supportTsx: true,
      testEnvironment: 'jsdom',
      babelJest: false,
    }),
    updateJsonInTree(`${options.projectRoot}/tsconfig.spec.json`, (json) => {
      json.include = json.include.filter((pattern) => !/\.jsx?$/.test(pattern));
      return json;
    }),
    (tree: Tree) => {
      const content = tags.stripIndent`
        module.exports = {
          name: '${options.projectName}',
          preset: '${offsetFromRoot(options.projectRoot)}jest.config.js',
          transform: {
            '^.+\\.vue$': 'vue-jest',
            '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$':
              'jest-transform-stub',
            '^.+\\.tsx?$': 'ts-jest'
          },
          moduleFileExtensions: ["ts", "tsx", "vue", "js", "json"],
          coverageDirectory: '${offsetFromRoot(options.projectRoot)}coverage/${
        options.projectRoot
      }',
          snapshotSerializers: ['jest-serializer-vue']
        };
      `;
      tree.overwrite(`${options.projectRoot}/jest.config.js`, content);
      return tree;
    },
    addDepsToPackageJson(
      {},
      {
        '@vue/test-utils': '1.0.0-beta.31',
        'babel-core': '^7.0.0-bridge.0',
        'jest-serializer-vue': '^2.0.2',
        'jest-transform-stub': '^2.0.0',
        'vue-jest': '^3.0.5',
      },
      true
    ),
  ]);
}

function getEslintConfig(options: NormalizedSchema) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eslintConfig: any = {
    extends: [
      'plugin:vue/essential',
      '@vue/typescript/recommended',
      'prettier',
      'prettier/@typescript-eslint',
    ],
    rules: {},
    env: {
      node: true,
    },
  };

  if (options.unitTestRunner === 'jest') {
    eslintConfig.overrides = [
      {
        files: ['**/*.spec.{j,t}s?(x)'],
        env: {
          jest: true,
        },
      },
    ];
  }

  return eslintConfig;
}

function addEsLint(options: NormalizedSchema): Rule {
  return chain([
    updateWorkspace((workspace) => {
      const { targets } = workspace.projects.get(options.projectName);
      targets.add({
        name: 'lint',
        ...generateProjectLint(
          options.projectRoot,
          `${options.projectRoot}/tsconfig.lib.json`,
          Linter.EsLint
        ),
      });
    }),
    addLintFiles(options.projectRoot, Linter.EsLint, {
      localConfig: getEslintConfig(options),
    }),
    // Extending the root ESLint config should be the first value in the
    // app's local ESLint config extends array.
    updateJsonInTree(`${options.projectRoot}/.eslintrc`, (json) => {
      json.extends.unshift(json.extends.pop());
      return json;
    }),
    (tree: Tree) => {
      const configPath = `${options.projectRoot}/.eslintrc`;
      const content = tree.read(configPath).toString('utf-8').trim();
      tree.rename(configPath, `${configPath}.js`);
      tree.overwrite(`${configPath}.js`, `module.exports = ${content};`);
    },
  ]);
}

function addPostInstall() {
  return updateJsonInTree('package.json', (json, context) => {
    const vuePostInstall =
      'node node_modules/@nx-plus/vue/patch-nx-dep-graph.js';
    const { postinstall } = json.scripts || {};
    if (postinstall) {
      if (postinstall !== vuePostInstall) {
        context.logger.warn(
          "We couldn't add our postinstall script. Without it Nx's dependency graph won't support Vue files. For more information see https://github.com/ZachJW34/nx-plus/tree/master/libs/vue#nx-dependency-graph-support"
        );
      }
      return json;
    }
    json.scripts = { ...json.scripts, postinstall: vuePostInstall };
    return json;
  });
}

function addPublishable(options: NormalizedSchema) {
  return chain([
    updateWorkspace((workspace) => {
      workspace.projects.get(options.projectName).targets.add({
        name: 'build',
        builder: '@nx-plus/vue:library',
        options: {
          dest: `dist/${options.projectRoot}`,
          entry: `${options.projectRoot}/src/index.ts`,
          tsConfig: `${options.projectRoot}/tsconfig.lib.json`,
        },
      });
    }),
    (tree) =>
      tree.create(
        `${options.projectRoot}/package.json`,
        JSON.stringify({
          name: `@${getNpmScope(tree)}/${options.name}`,
          version: '0.0.0',
        })
      ),
  ]);
}

function updateTsConfig(options: NormalizedSchema): Rule {
  return chain([
    (host: Tree, context: SchematicContext) => {
      const nxJson = readJsonInTree<NxJson>(host, 'nx.json');
      return updateJsonInTree('tsconfig.json', (json) => {
        const c = json.compilerOptions;
        c.paths = c.paths || {};
        delete c.paths[options.name];
        c.paths[`@${nxJson.npmScope}/${options.projectDirectory}`] = [
          `${options.projectRoot}/src/index.ts`,
        ];
        return json;
      })(host, context);
    },
  ]);
}

export default function (options: LibrarySchematicSchema): Rule {
  const normalizedOptions = normalizeOptions(options);
  return chain([
    updateWorkspace((workspace) => {
      workspace.projects.add({
        name: normalizedOptions.projectName,
        root: normalizedOptions.projectRoot,
        sourceRoot: `${normalizedOptions.projectRoot}/src`,
        projectType,
        architect: {},
      });
    }),
    addProjectToNxJsonInTree(normalizedOptions.projectName, {
      tags: normalizedOptions.parsedTags,
    }),
    !options.skipTsConfig ? updateTsConfig(normalizedOptions) : noop(),
    addFiles(normalizedOptions),
    addEsLint(normalizedOptions),
    options.publishable ? addPublishable(normalizedOptions) : noop(),
    options.unitTestRunner === 'jest' ? addJest(normalizedOptions) : noop(),
    addPostInstall(),
    addDepsToPackageJson(
      {
        vue: '^2.6.11',
      },
      {
        '@vue/cli-plugin-typescript': '~4.3.0',
        '@vue/cli-service': '~4.3.0',
        '@vue/eslint-config-typescript': '^5.0.2',
        'eslint-plugin-vue': '^6.2.2',
        'vue-template-compiler': '^2.6.11',
      },
      true
    ),
    formatFiles(options),
  ]);
}
