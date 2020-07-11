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
  url
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
  projectRootDir,
  ProjectType,
  toFileName,
  updateJsonInTree,
  updateWorkspace
} from '@nrwl/workspace';
import { ApplicationSchematicSchema } from './schema';

/**
 * Depending on your needs, you can change this to either `Library` or `Application`
 */
const projectType = ProjectType.Application;

interface NormalizedSchema extends ApplicationSchematicSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  options: ApplicationSchematicSchema
): NormalizedSchema {
  const name = toFileName(options.name);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${projectRootDir(projectType)}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map(s => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags
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
        htmlWebpackPluginTitle: '<%= htmlWebpackPlugin.options.title %>'
      }),
      options.unitTestRunner === 'none'
        ? filter(file => file !== '/src/app/app.spec.ts')
        : noop(),
      options.routing
        ? noop()
        : filter(file => file !== '/src/app/router/index.ts'),
      move(options.projectRoot)
    ])
  );
}

function getEslintConfig(options: NormalizedSchema) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eslintConfig: any = {
    extends: [
      'plugin:vue/essential',
      '@vue/typescript/recommended',
      'prettier',
      'prettier/@typescript-eslint'
    ],
    rules: {},
    env: {
      node: true
    }
  };

  if (options.unitTestRunner === 'jest') {
    eslintConfig.overrides = [
      {
        files: ['**/*.spec.{j,t}s?(x)'],
        env: {
          jest: true
        }
      }
    ];
  }

  return eslintConfig;
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
      babelJest: false
    }),
    updateJsonInTree(`${options.projectRoot}/tsconfig.spec.json`, json => {
      json.include = json.include.filter(pattern => !/\.jsx?$/.test(pattern));
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
        'vue-jest': '^3.0.5'
      },
      true
    )
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
      js: false
    }),
    tree => {
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
    }
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

export default function(options: ApplicationSchematicSchema): Rule {
  const normalizedOptions = normalizeOptions(options);
  return chain([
    updateWorkspace(workspace => {
      const { targets } = workspace.projects.add({
        name: normalizedOptions.projectName,
        root: normalizedOptions.projectRoot,
        sourceRoot: `${normalizedOptions.projectRoot}/src`,
        projectType
      });
      targets.add({
        name: 'build',
        builder: '@nx-plus/vue:browser',
        options: {
          outputPath: `dist/${normalizedOptions.projectRoot}`,
          index: `${normalizedOptions.projectRoot}/src/index.html`,
          main: `${normalizedOptions.projectRoot}/src/main.ts`,
          tsConfig: `${normalizedOptions.projectRoot}/tsconfig.app.json`,
          assets: [
            `${normalizedOptions.projectRoot}/src/favicon.ico`,
            `${normalizedOptions.projectRoot}/src/assets`
          ]
        },
        configurations: {
          production: {
            fileReplacements: [
              {
                replace: `${normalizedOptions.projectRoot}/src/environments/environment.ts`,
                with: `${normalizedOptions.projectRoot}/src/environments/environment.prod.ts`
              }
            ],
            optimization: true,
            outputHashing: 'all',
            extractCss: true
          }
        }
      });
      targets.add({
        name: 'serve',
        builder: '@nx-plus/vue:dev-server',
        options: {
          browserTarget: `${normalizedOptions.projectName}:build`
        },
        configurations: {
          production: {
            browserTarget: `${normalizedOptions.projectName}:build:production`
          }
        }
      });
      targets.add({
        name: 'lint',
        ...generateProjectLint(
          normalizedOptions.projectRoot,
          `${normalizedOptions.projectRoot}/tsconfig.app.json`,
          Linter.EsLint
        )
      });
    }),
    addProjectToNxJsonInTree(normalizedOptions.projectName, {
      tags: normalizedOptions.parsedTags
    }),
    addFiles(normalizedOptions),
    addLintFiles(normalizedOptions.projectRoot, Linter.EsLint, {
      localConfig: getEslintConfig(normalizedOptions)
    }),
    // Extending the root ESLint config should be the first value in the
    // app's local ESLint config extends array.
    updateJsonInTree(`${normalizedOptions.projectRoot}/.eslintrc`, json => {
      json.extends.unshift(json.extends.pop());
      return json;
    }),
    options.unitTestRunner === 'jest' ? addJest(normalizedOptions) : noop(),
    options.e2eTestRunner === 'cypress'
      ? addCypress(normalizedOptions)
      : noop(),
    addPostInstall(),
    addDepsToPackageJson(
      {
        vue: '^2.6.11',
        ...(options.routing ? { 'vue-router': '^3.2.0' } : {})
      },
      {
        '@vue/cli-plugin-typescript': '~4.3.0',
        '@vue/cli-service': '~4.3.0',
        '@vue/eslint-config-typescript': '^5.0.2',
        'eslint-plugin-vue': '^6.2.2',
        'vue-template-compiler': '^2.6.11'
      },
      true
    ),
    formatFiles(options)
  ]);
}
