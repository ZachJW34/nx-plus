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
import * as semver from 'semver';
import { ApplicationSchematicSchema } from './schema';
import { appRootPath } from '../../app-root';
import { loadModule } from '../../utils';

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

  return {
    ...options,
    name,
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

function checkPeerDeps(
  context: SchematicContext,
  options: ApplicationSchematicSchema
): void {
  const expectedVersion = '^12.0.0';
  const unmetPeerDeps = [
    ...(options.e2eTestRunner === 'cypress' ? ['@nrwl/cypress'] : []),
    ...(options.unitTestRunner === 'jest' ? ['@nrwl/jest'] : []),
    '@nrwl/linter',
    '@nrwl/workspace',
  ].filter((dep) => {
    try {
      const { version } = loadModule(`${dep}/package.json`, appRootPath, true);
      return !semver.satisfies(version, expectedVersion);
    } catch (err) {
      return true;
    }
  });

  if (unmetPeerDeps.length) {
    context.logger.warn(`
You have the following unmet peer dependencies:

${unmetPeerDeps
  .map((dep) => `${dep}@${expectedVersion}\n`)
  .join()
  .split(',')
  .join('')}
@nx-plus/nuxt may not work as expected.
    `);
  }
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
    ],
    parserOptions: {
      extraFileExtensions: ['.vue'],
    },
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
          Linter.EsLint,
          [`${options.projectRoot}/**/*.{ts,js,vue}`]
        ),
      });
    }),
    addLintFiles(options.projectRoot, Linter.EsLint, {
      localConfig: eslintConfig,
    }),
    updateJsonInTree(`${options.projectRoot}/.eslintrc.json`, (json) => {
      // Extending the root ESLint config should be the first value in the
      // app's local ESLint config extends array.
      json.extends.unshift(json.extends.pop());
      json.ignorePatterns = [...(json.ignorePatterns || []), '.eslintrc.js'];
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
          displayName: '${options.projectName}',
          preset: '${offsetFromRoot(options.projectRoot)}jest.preset.js',
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
            'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
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
  return (host: Tree, context: SchematicContext) => {
    checkPeerDeps(context, options);
    const normalizedOptions = normalizeOptions(host, options);
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
          '@nuxt/typescript-runtime': '^2.0.1',
          'core-js': '^3.8.3',
          nuxt: '2.14.12',
        },
        {
          '@nuxtjs/eslint-config-typescript': '^5.0.0',
          '@nuxt/types': '2.14.12',
          '@nuxt/typescript-build': '^2.0.4',
          'eslint-plugin-nuxt': '^2.0.0',
        },
        true
      ),
      formatFiles(options),
    ]);
  };
}
