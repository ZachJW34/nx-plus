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
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  addLintFiles,
  addPackageWithInit,
  addProjectToNxJsonInTree,
  formatFiles,
  generateProjectLint,
  Linter,
  names,
  offsetFromRoot,
  ProjectType,
  toFileName,
  updateJsonInTree,
  updateWorkspace,
} from '@nrwl/workspace';
import { appsDir } from '@nrwl/workspace/src/utils/ast-utils';
import { ApplicationSchematicSchema } from './schema';
import { checkPeerDeps } from '../../utils';

/**
 * Depending on your needs, you can change this to either `Library` or `Application`
 */
const projectType = ProjectType.Application;

interface NormalizedSchema extends ApplicationSchematicSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  isVue3: boolean;
}

function normalizeOptions(
  host: Tree,
  options: ApplicationSchematicSchema
): NormalizedSchema {
  const name = toFileName(options.name);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = normalize(`${appsDir(host)}/${projectDirectory}`);
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
        dot: '.',
        baseUrl: '<%= BASE_URL %>',
        htmlWebpackPluginTitle: '<%= htmlWebpackPlugin.options.title %>',
      }),
      options.unitTestRunner === 'none'
        ? filter((file) => file !== '/tests/unit/example.spec.ts')
        : noop(),
      options.routing
        ? noop()
        : filter(
            (file) =>
              ![
                '/src/router/index.ts',
                '/src/views/About.vue',
                '/src/views/Home.vue',
              ].includes(file)
          ),
      options.isVue3
        ? filter((file) => file !== '/src/shims-tsx.d.ts')
        : noop(),
      move(options.projectRoot),
    ])
  );
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
          `${options.projectRoot}/tsconfig.app.json`,
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
        options.isVue3 ? `'<rootDir>/${file}'` : `\`\${__dirname}/${file}\``;
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

function addCypress(options: NormalizedSchema): Rule {
  return chain([
    addPackageWithInit('@nrwl/cypress'),
    externalSchematic('@nrwl/cypress', 'cypress-project', {
      project: options.projectName,
      name: options.name + '-e2e',
      directory: options.directory,
      linter: Linter.EsLint,
      js: false,
    }),
    (tree) => {
      const appSpecPath =
        options.projectRoot + '-e2e/src/integration/app.spec.ts';
      tree.overwrite(
        appSpecPath,
        tree
          .read(appSpecPath)
          .toString('utf-8')
          .replace(
            `Welcome to ${options.projectName}!`,
            'Welcome to Your Vue.js + TypeScript App'
          )
      );
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

export default function (options: ApplicationSchematicSchema): Rule {
  return (host: Tree, context: SchematicContext) => {
    checkPeerDeps(context, options);
    const normalizedOptions = normalizeOptions(host, options);
    return chain([
      updateWorkspace((workspace) => {
        const { targets } = workspace.projects.add({
          name: normalizedOptions.projectName,
          root: normalizedOptions.projectRoot,
          sourceRoot: `${normalizedOptions.projectRoot}/src`,
          projectType,
        });
        targets.add({
          name: 'build',
          builder: '@nx-plus/vue:browser',
          options: {
            dest: `dist/${normalizedOptions.projectRoot}`,
            index: `${normalizedOptions.projectRoot}/public/index.html`,
            main: `${normalizedOptions.projectRoot}/src/main.ts`,
            tsConfig: `${normalizedOptions.projectRoot}/tsconfig.app.json`,
          },
          configurations: {
            production: {
              mode: 'production',
              filenameHashing: true,
              productionSourceMap: true,
              css: {
                extract: true,
                sourceMap: false,
              },
            },
          },
        });
        targets.add({
          name: 'serve',
          builder: '@nx-plus/vue:dev-server',
          options: {
            browserTarget: `${normalizedOptions.projectName}:build`,
          },
          configurations: {
            production: {
              browserTarget: `${normalizedOptions.projectName}:build:production`,
            },
          },
        });
      }),
      addProjectToNxJsonInTree(normalizedOptions.projectName, {
        tags: normalizedOptions.parsedTags,
      }),
      addFiles(normalizedOptions),
      addEsLint(normalizedOptions),
      options.unitTestRunner === 'jest' ? addJest(normalizedOptions) : noop(),
      options.e2eTestRunner === 'cypress'
        ? addCypress(normalizedOptions)
        : noop(),
      options.babel ? addBabel(normalizedOptions) : noop(),
      addPostInstall(),
      addDepsToPackageJson(
        {
          vue: normalizedOptions.isVue3 ? '^3.0.0' : '^2.6.11',
          ...(options.routing
            ? { 'vue-router': normalizedOptions.isVue3 ? '^4.0.0-0' : '^3.2.0' }
            : {}),
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
