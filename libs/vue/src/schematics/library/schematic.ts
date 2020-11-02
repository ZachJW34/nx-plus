import { normalize, tags } from '@angular-devkit/core';
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
  ProjectType,
  toFileName,
  updateJsonInTree,
  updateWorkspace,
  readJsonInTree,
  NxJson,
} from '@nrwl/workspace';
import { libsDir } from '@nrwl/workspace/src/utils/ast-utils';
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
  isVue3: boolean;
}

function normalizeOptions(
  host: Tree,
  options: LibrarySchematicSchema
): NormalizedSchema {
  const name = toFileName(options.name);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = normalize(`${libsDir(host)}/${projectDirectory}`);
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];
  const isVue3 = options.vueVersion === 3;

  return {
    ...options,
    name,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    isVue3,
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
      options.publishable
        ? noop()
        : filter((file) => file !== '/configure-webpack.js'),
      options.isVue3
        ? filter((file) => file !== '/src/shims-tsx.d.ts')
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
      if (!options.isVue3) {
        json.compilerOptions = {
          ...json.compilerOptions,
          jsx: 'preserve',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        };
      }
      return json;
    }),
    (tree: Tree) => {
      const getVueJestPath = (file: string) =>
        options.isVue3 ? `'<rootDir>/${file}'` : '`${__dirname}/' + file + '`';
      const content = tags.stripIndent`
        module.exports = {
          displayName: '${options.projectName}',
          preset: '${offsetFromRoot(options.projectRoot)}jest.preset.js',
          transform: {
            '^.+\\.vue$': 'vue-jest',
            '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$':
              'jest-transform-stub',
              '^.+\\.tsx?$': 'ts-jest',
          },
          moduleFileExtensions: ["ts", "tsx", "vue", "js", "json"],
          coverageDirectory: '${offsetFromRoot(options.projectRoot)}coverage/${
        options.projectRoot
      }',
          snapshotSerializers: ['jest-serializer-vue'],
          globals: {
            'ts-jest': {
              tsConfig: '<rootDir>/tsconfig.spec.json',
              ${
                options.babel ? `babelConfig: '<rootDir>/babel.config.js',` : ''
              }
            },
            'vue-jest': {
              tsConfig: ${getVueJestPath('tsconfig.spec.json')},
              ${
                options.babel
                  ? `babelConfig: ${getVueJestPath('babel.config.js')},`
                  : ''
              }
            }
          },
        };
      `;
      tree.overwrite(`${options.projectRoot}/jest.config.js`, content);
      return tree;
    },
    addDepsToPackageJson(
      {},
      {
        '@vue/test-utils': options.isVue3 ? '^2.0.0-0' : '^1.0.3',
        'babel-core': '^7.0.0-bridge.0',
        'jest-serializer-vue': '^2.0.2',
        'jest-transform-stub': '^2.0.0',
        'vue-jest': options.isVue3 ? '^5.0.0-0' : '^3.0.5',
      },
      true
    ),
  ]);
}

function getEslintConfig(options: NormalizedSchema) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eslintConfig: any = {
    extends: [
      `plugin:vue/${options.isVue3 ? 'vue3-' : ''}essential`,
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
          Linter.EsLint,
          [`${options.projectRoot}/**/*.{ts,tsx,vue}`]
        ),
      });
    }),
    addLintFiles(options.projectRoot, Linter.EsLint, {
      localConfig: getEslintConfig(options),
    }),
    // Extending the root ESLint config should be the first value in the
    // app's local ESLint config extends array.
    updateJsonInTree(`${options.projectRoot}/.eslintrc.json`, (json) => {
      json.extends.unshift(json.extends.pop());
      return json;
    }),
    (tree: Tree) => {
      const configPath = `${options.projectRoot}/.eslintrc.json`;
      const content = tree.read(configPath).toString('utf-8').trim();
      const newConfigPath = configPath.slice(0, -2);
      tree.rename(configPath, newConfigPath);
      tree.overwrite(newConfigPath, `module.exports = ${content};`);
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

function addBabel(options: NormalizedSchema) {
  const babelConfigPath = `${options.projectRoot}/babel.config.js`;
  return chain([
    (tree: Tree) =>
      tree.create(
        babelConfigPath,
        tags.stripIndent`
          module.exports = {
            presets: ["@vue/cli-plugin-babel/preset"]
          };`
      ),
    addDepsToPackageJson(
      { 'core-js': '^3.6.5' },
      { '@vue/cli-plugin-babel': '~4.5.0' }
    ),
  ]);
}

function updateTsConfig(options: NormalizedSchema): Rule {
  return chain([
    (host: Tree, context: SchematicContext) => {
      const nxJson = readJsonInTree<NxJson>(host, 'nx.json');
      return updateJsonInTree('tsconfig.base.json', (json) => {
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
  return (host: Tree) => {
    const normalizedOptions = normalizeOptions(host, options);
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
      options.babel ? addBabel(normalizedOptions) : noop(),
      addPostInstall(),
      addDepsToPackageJson(
        {
          vue: normalizedOptions.isVue3 ? '^3.0.0' : '^2.6.11',
        },
        {
          '@vue/cli-plugin-typescript': '~4.5.0',
          '@vue/cli-service': '~4.5.0',
          ...(normalizedOptions.isVue3
            ? { '@vue/compiler-sfc': '^3.0.0' }
            : {}),
          '@vue/eslint-config-typescript': '^5.0.2',
          'eslint-plugin-vue': normalizedOptions.isVue3 ? '^7.0.0-0' : '^6.2.2',
          ...(!normalizedOptions.isVue3
            ? { 'vue-template-compiler': '^2.6.11' }
            : {}),
        },
        true
      ),
      formatFiles(options),
    ]);
  };
}
