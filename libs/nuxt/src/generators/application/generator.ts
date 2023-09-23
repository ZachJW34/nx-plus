import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  logger,
  names,
  offsetFromRoot,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { checkPeerDeps } from '../../utils';
import { ApplicationGeneratorSchema } from './schema';
import path = require('path');

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  schema: ApplicationGeneratorSchema
): NormalizedSchema {
  const name = names(schema.name).fileName;
  const projectDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = schema.tags
    ? schema.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...schema,
    name,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
  if (options.unitTestRunner === 'none') {
    const { path } =
      tree
        .listChanges()
        .find(({ path }) => path.includes('test/NuxtLogo.spec.js')) || {};
    if (path) {
      tree.delete(path);
    }
  }
}

async function addEsLint(tree: Tree, options: NormalizedSchema) {
  const eslintConfig = {
    env: {
      browser: true,
      node: true,
    },
    extends: [
      `${offsetFromRoot(options.projectRoot)}.eslintrc.json`,
      '@nuxtjs/eslint-config-typescript',
      'plugin:nuxt/recommended',
      'prettier',
    ],
    parserOptions: {
      extraFileExtensions: ['.vue'],
    },
    ignorePatterns: ['!**/*'],
    rules: {},
  };

  const { lintProjectGenerator, Linter } = await import('@nrwl/linter');
  const lintTask = await lintProjectGenerator(tree, {
    linter: Linter.EsLint,
    project: options.projectName,
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,vue}`],
    skipFormat: true,
  });

  const content = JSON.stringify(eslintConfig, null, 2);
  const configPath = `${options.projectRoot}/.eslintrc.json`;
  tree.write(configPath, content);

  return [lintTask];
}

async function addJest(tree: Tree, options: NormalizedSchema) {
  const { jestProjectGenerator, jestInitGenerator } = await import(
    '@nrwl/jest'
  );
  const jestInitTask = await jestInitGenerator(tree, { babelJest: false });
  const jestTask = await jestProjectGenerator(tree, {
    project: options.projectName,
    setupFile: 'none',
    skipSerializers: true,
    supportTsx: true,
    testEnvironment: 'jsdom',
    babelJest: false,
  });

  updateJson(tree, `${options.projectRoot}/tsconfig.spec.json`, (json) => {
    json.include.push('**/*.spec.js');
    json.compilerOptions = {
      ...json.compilerOptions,
      esModuleInterop: true,
      allowJs: true,
      noEmit: true,
    };
    return json;
  });

  const content = `
module.exports = {
  displayName: '${options.projectName}',
  preset: '${offsetFromRoot(options.projectRoot)}jest.preset.js',
  transform: {
    '.*\\.(vue)$': '@vue/vue2-jest',
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
    'vue-jest': { tsConfig: '${options.projectRoot}/tsconfig.spec.json' },
  },
};
`;
  tree.write(`${options.projectRoot}/jest.config.ts`, content);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@vue/test-utils': '^1.0.3',
      'babel-core': '^7.0.0-bridge.0',
      '@vue/vue2-jest': '^27.0.0-alpha.1',
    }
  );

  return [jestInitTask, jestTask, installTask];
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  const { cypressInitGenerator, cypressProjectGenerator } = await import(
    '@nrwl/cypress'
  );
  const { Linter } = await import('@nrwl/linter');
  const cypressInitTask = await cypressInitGenerator(tree, {});
  const cypressTask = await cypressProjectGenerator(tree, {
    project: options.projectName,
    name: options.name + '-e2e',
    directory: options.directory,
    linter: Linter.EsLint,
    js: false,
  });

  const appSpecPath = options.projectRoot + '-e2e/src/integration/app.spec.ts';
  tree.write(
    appSpecPath,
    `describe('${options.projectName}', () => {
  it('should display welcome message', () => {
    cy.visit('/')
    cy.contains('h2', 'Welcome to your Nuxt Application')
  });
});
`
  );

  return [cypressInitTask, cypressTask];
}

function addPostInstall(tree: Tree) {
  return updateJson(tree, 'package.json', (json) => {
    const vuePostInstall = 'patch-nx-dep-graph';
    const { postinstall } = json.scripts || {};
    if (postinstall) {
      if (postinstall !== vuePostInstall) {
        logger.warn(
          "We couldn't add our postinstall script. Without it Nx's dependency graph won't support Vue files. For more information see https://github.com/ZachJW34/nx-plus/tree/master/libs/vue#nx-dependency-graph-support"
        );
      }
      return json;
    }
    json.scripts = { ...json.scripts, postinstall: vuePostInstall };
    return json;
  });
}

export async function applicationGenerator(
  tree: Tree,
  schema: ApplicationGeneratorSchema
) {
  checkPeerDeps(schema);
  const options = normalizeOptions(tree, schema);
  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    projectType: 'application',
    sourceRoot: `${options.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx-plus/nuxt:browser',
        options: {
          buildDir: `dist/${options.projectRoot}`,
        },
        configurations: {
          production: {},
        },
      },
      serve: {
        executor: '@nx-plus/nuxt:server',
        options: {
          browserTarget: `${options.projectName}:build`,
          dev: true,
        },
        configurations: {
          production: {
            browserTarget: `${options.projectName}:build:production`,
            dev: false,
          },
        },
      },
      static: {
        executor: '@nx-plus/nuxt:static',
        options: {
          browserTarget: `${options.projectName}:build:production`,
        },
      },
    },
    tags: options.parsedTags,
  });

  addFiles(tree, options);

  const lintTasks = await addEsLint(tree, options);

  const cypressTasks =
    options.e2eTestRunner === 'cypress' ? await addCypress(tree, options) : [];

  const jestTasks =
    options.unitTestRunner === 'jest' ? await addJest(tree, options) : [];

  const installTask = addDependenciesToPackageJson(
    tree,
    {
      'core-js': '^3.15.1',
      nuxt: '^2.15.7',
    },
    {
      '@nuxtjs/eslint-config-typescript': '^9.0.0',
      '@nuxt/types': '^2.15.7',
      '@nuxt/typescript-build': '^2.1.0',
      'eslint-plugin-nuxt': '^3.2.0',
      'ts-loader': '^8.3.0',
    }
  );

  addPostInstall(tree);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(
    ...lintTasks,
    ...cypressTasks,
    ...jestTasks,
    installTask
  );
}

export const applicationSchematic = convertNxGenerator(applicationGenerator);
