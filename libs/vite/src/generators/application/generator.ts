import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
  addDependenciesToPackageJson,
  updateJson,
  convertNxGenerator,
  logger,
} from '@nrwl/devkit';
import { lintProjectGenerator, Linter } from '@nrwl/linter';
import { jestProjectGenerator, jestInitGenerator } from '@nrwl/jest';
import { cypressProjectGenerator, cypressInitGenerator } from '@nrwl/cypress';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import { ApplicationGeneratorSchema } from './schema';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  host: Tree,
  options: ApplicationGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`;
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

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    host,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
  if (options.unitTestRunner === 'none') {
    const { path } = host
      .listChanges()
      .find(({ path }) => path.includes('example.spec.ts'));
    host.delete(path);
  }
}

function getEslintConfig(options: NormalizedSchema) {
  const eslintConfig = {
    extends: [
      `${offsetFromRoot(options.projectRoot)}.eslintrc.json`,
      `plugin:vue/vue3-essential`,
      '@vue/typescript/recommended',
      'prettier',
    ],
    rules: {},
    ignorePatterns: ['!**/*'],
    env: {
      node: true,
    },
  } as any;

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

async function addEsLint(tree: Tree, options: NormalizedSchema) {
  const lintTask = await lintProjectGenerator(tree, {
    linter: Linter.EsLint,
    project: options.projectName,
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,vue}`],
    skipFormat: true,
  });

  updateJson(tree, `${options.projectRoot}/.eslintrc.json`, (json) => {
    json.extends.unshift(json.extends.pop());
    return json;
  });

  const content = JSON.stringify(getEslintConfig(options));
  const configPath = `${options.projectRoot}/.eslintrc.json`;
  const newConfigPath = configPath.slice(0, -2);
  tree.rename(configPath, newConfigPath);
  tree.write(newConfigPath, `module.exports = ${content};`);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@vue/eslint-config-prettier': '6.0.0',
      '@vue/eslint-config-typescript': '^5.0.2',
      'eslint-plugin-prettier': '^3.1.3',
      'eslint-plugin-vue': '^7.0.0-0',
    }
  );

  return [lintTask, installTask];
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  const cypressInitTask = await cypressInitGenerator(tree);
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
    tree
      .read(appSpecPath)
      .toString('utf-8')
      .replace(
        `Welcome to ${options.projectName}!`,
        'Hello Vue 3 + TypeScript + Vite'
      )
  );

  return [cypressInitTask, cypressTask];
}

async function addJest(tree: Tree, options: NormalizedSchema) {
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
    json.include = json.include.filter((pattern) => !/\.jsx?$/.test(pattern));
    json.compilerOptions = {
      ...json.compilerOptions,
      jsx: 'preserve',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    };
    return json;
  });
  const content = `module.exports = {
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
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
    'vue-jest': {
      tsConfig: '<rootDir>/tsconfig.spec.json',
    }
  },
};
`;
  tree.write(`${options.projectRoot}/jest.config.js`, content);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@vue/test-utils': '^2.0.0-0',
      'jest-serializer-vue': '^2.0.2',
      'jest-transform-stub': '^2.0.0',
      'vue-jest': '5.0.0-alpha.7',
    }
  );
  return [jestInitTask, jestTask, installTask];
}

function addPostInstall(host: Tree) {
  return updateJson(host, 'package.json', (json) => {
    const vuePostInstall =
      'node node_modules/@nx-plus/vite/patch-nx-dep-graph.js';
    const { postinstall } = json.scripts || {};
    if (postinstall) {
      if (postinstall !== vuePostInstall) {
        logger.warn(
          "We couldn't add our postinstall script. Without it Nx's dependency graph won't support Vue files. For more information see https://github.com/ZachJW34/nx-plus/tree/master/libs/vite#nx-dependency-graph-support"
        );
      }
      return json;
    }
    json.scripts = { ...json.scripts, postinstall: vuePostInstall };
    return json;
  });
}

export async function applicationGenerator(
  host: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(host, options);
  addProjectConfiguration(host, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx-plus/vite:build',
        options: {
          config: `${normalizedOptions.projectRoot}/vite.config.ts`,
        },
      },
      serve: {
        executor: '@nx-plus/vite:server',
        options: {
          config: `${normalizedOptions.projectRoot}/vite.config.ts`,
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(host, normalizedOptions);
  const lintTasks = await addEsLint(host, normalizedOptions);
  const cypressTasks =
    options.e2eTestRunner === 'cypress'
      ? await addCypress(host, normalizedOptions)
      : [];
  const jestTasks =
    options.unitTestRunner === 'jest'
      ? await addJest(host, normalizedOptions)
      : [];
  const installTask = addDependenciesToPackageJson(
    host,
    { vue: '^3.0.5' },
    {
      '@vitejs/plugin-vue': '^1.2.3',
      '@vue/compiler-sfc': '^3.0.5',
      typescript: '^4.3.2',
      vite: '^2.3.7',
    }
  );
  addPostInstall(host);
  if (!normalizedOptions.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(
    ...lintTasks,
    ...cypressTasks,
    ...jestTasks,
    installTask
  );
}

export const applicationSchematic = convertNxGenerator(applicationGenerator);
