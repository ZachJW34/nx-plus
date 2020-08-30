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
  updateWorkspace,
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
        ? filter((file) => file !== '/test/Logo.spec.js')
        : noop(),
      move(options.projectRoot),
    ])
  );
}

function addEsLint(options: NormalizedSchema): Rule {
  const eslintConfig = {
    env: {
      browser: true,
      node: true,
    },
    extends: [
      '@nuxtjs/eslint-config-typescript',
      'plugin:nuxt/recommended',
      'prettier',
      'prettier/@typescript-eslint',
    ],
    rules: {},
  };

  return chain([
    updateWorkspace((workspace) => {
      const { targets } = workspace.projects.get(options.projectName);
      targets.add({
        name: 'lint',
        ...generateProjectLint(
          options.projectRoot,
          `${options.projectRoot}/tsconfig.json`,
          Linter.EsLint
        ),
      });
    }),
    addLintFiles(options.projectRoot, Linter.EsLint, {
      localConfig: eslintConfig,
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

function addJest(options: NormalizedSchema): Rule {
  return chain([
    addPackageWithInit('@nrwl/jest'),
    externalSchematic('@nrwl/jest', 'jest-project', {
      project: options.projectName,
      setupFile: 'none',
      skipSerializers: true,
      supportTsx: false,
      testEnvironment: 'jsdom',
      babelJest: false,
    }),
    updateJsonInTree(`${options.projectRoot}/tsconfig.spec.json`, (json) => {
      json.include.push('**/*.spec.js');
      json.compilerOptions = {
        ...json.compilerOptions,
        esModuleInterop: true,
        allowJs: true,
        noEmit: true,
      };
      return json;
    }),
    (tree: Tree) => {
      const content = tags.stripIndent`
        module.exports = {
          name: '${options.projectName}',
          preset: '${offsetFromRoot(options.projectRoot)}jest.config.js',
          transform: {
            '.*\\.(vue)$': 'vue-jest',
            '^.+\\.ts$': 'ts-jest',
          },
          moduleFileExtensions: ['ts', 'js', 'vue', 'json'],
          coverageDirectory: '${offsetFromRoot(options.projectRoot)}coverage/${
        options.projectRoot
      }',
          collectCoverageFrom: [
            '<rootDir>/components/**/*.vue',
            '<rootDir>/pages/**/*.vue',
          ],
          moduleNameMapper: {
            '^vue$': 'vue/dist/vue.common.js',
          },
          globals: {
            'ts-jest': { tsConfig: '<rootDir>/tsconfig.spec.json' },
            'vue-jest': { tsConfig: '${
              options.projectRoot
            }/tsconfig.spec.json' },
          },
        };
      `;
      tree.overwrite(`${options.projectRoot}/jest.config.js`, content);
      return tree;
    },
    addDepsToPackageJson(
      {},
      {
        '@vue/test-utils': '^1.0.3',
        'babel-core': '^7.0.0-bridge.0',
        'vue-jest': '^3.0.5',
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
          .replace(`Welcome to ${options.projectName}!`, options.projectName)
      );
    },
  ]);
}

export default function (options: ApplicationSchematicSchema): Rule {
  const normalizedOptions = normalizeOptions(options);
  return chain([
    updateWorkspace((workspace) => {
      const { targets } = workspace.projects.add({
        name: normalizedOptions.projectName,
        root: normalizedOptions.projectRoot,
        projectType,
      });
      targets.add({
        name: 'build',
        builder: '@nx-plus/nuxt:browser',
        options: {
          buildDir: `dist/${normalizedOptions.projectRoot}`,
        },
        configurations: {
          production: {},
        },
      });
      targets.add({
        name: 'serve',
        builder: '@nx-plus/nuxt:server',
        options: {
          browserTarget: `${normalizedOptions.projectName}:build`,
          dev: true,
        },
        configurations: {
          production: {
            browserTarget: `${normalizedOptions.projectName}:build:production`,
            dev: false,
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
    addDepsToPackageJson(
      {
        '@nuxt/typescript-runtime': '^1.0.0',
        nuxt: '^2.14.0',
      },
      {
        '@nuxtjs/eslint-config': '^3.1.0',
        '@nuxtjs/eslint-config-typescript': '^3.0.0',
        '@nuxt/types': '^2.14.0',
        '@nuxt/typescript-build': '^2.0.2',
        'eslint-plugin-nuxt': '^1.0.0',
        'fork-ts-checker-webpack-plugin': '^5.0.11',
      },
      true
    ),
    formatFiles(options),
  ]);
}
