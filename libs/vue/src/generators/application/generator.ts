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
  stripIndents,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import { checkPeerDeps } from '../../utils';
import { ApplicationGeneratorSchema } from './schema';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  isVue3: boolean;
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
  const isVue3 = schema.vueVersion === 3;

  return {
    ...schema,
    name,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    isVue3,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    dot: '.',
    baseUrl: '<%= BASE_URL %>',
    htmlWebpackPluginTitle: '<%= htmlWebpackPlugin.options.title %>',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );

  const fileChanges = tree.listChanges();
  if (options.unitTestRunner === 'none') {
    const { path } = fileChanges.find(({ path }) =>
      path.includes('example.spec.ts')
    );
    tree.delete(path);
  }

  if (!options.routing) {
    const routerFiles = [
      '/src/router/index.ts',
      '/src/views/About.vue',
      '/src/views/Home.vue',
    ];
    fileChanges
      .filter(({ path }) => routerFiles.some((file) => path.includes(file)))
      .forEach(({ path }) => tree.delete(path));
  }

  if (options.isVue3) {
    const { path } = fileChanges.find(({ path }) =>
      path.includes('/src/shims-tsx.d.ts')
    );
    tree.delete(path);
  }
}

function getEslintConfig(options: NormalizedSchema) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eslintConfig: any = {
    extends: [
      `plugin:vue/${options.isVue3 ? 'vue3-' : ''}essential`,
      '@vue/typescript/recommended',
      'prettier',
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

async function addEsLint(tree: Tree, options: NormalizedSchema) {
  const { lintProjectGenerator, Linter } = await import('@nrwl/linter');
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
    '^.+\\.vue$': 'vue3-jest',
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
      tsconfig: '${options.projectRoot}/tsconfig.spec.json',
    },
    'vue-jest': {
      tsConfig: '${options.projectRoot}/tsconfig.spec.json',
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
      'vue3-jest': '^27.0.0-alpha.1',
    }
  );
  return [jestInitTask, jestTask, installTask];
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  const { cypressInitGenerator, cypressProjectGenerator } = await import(
    '@nrwl/cypress'
  );
  const { Linter } = await import('@nrwl/linter');
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
        'Welcome to Your Vue.js + TypeScript App'
      )
  );

  return [cypressInitTask, cypressTask];
}

function addPostInstall(tree: Tree) {
  updateJson(tree, 'package.json', (json) => {
    const vuePostInstall =
      'node node_modules/@nx-plus/vue/patch-nx-dep-graph.js';
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

async function addBabel(tree: Tree, options: NormalizedSchema) {
  const babelConfigPath = `${options.projectRoot}/babel.config.js`;
  tree.write(
    babelConfigPath,
    stripIndents`
      module.exports = {
        presets: ["@vue/cli-plugin-babel/preset"]
      };`
  );

  const installTask = addDependenciesToPackageJson(
    tree,
    { 'core-js': '^3.6.5' },
    { '@vue/cli-plugin-babel': '~4.5.0' }
  );

  return [installTask];
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
        executor: '@nx-plus/vue:browser',
        options: {
          dest: `dist/${options.projectRoot}`,
          index: `${options.projectRoot}/public/index.html`,
          main: `${options.projectRoot}/src/main.ts`,
          tsConfig: `${options.projectRoot}/tsconfig.app.json`,
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
      },
      serve: {
        executor: '@nx-plus/vue:dev-server',
        options: {
          browserTarget: `${options.projectName}:build`,
        },
        configurations: {
          production: {
            browserTarget: `${options.projectName}:build:production`,
          },
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

  const babelTasks = options.babel ? await addBabel(tree, options) : [];

  const installTask = addDependenciesToPackageJson(
    tree,
    {
      vue: options.isVue3 ? '^3.0.0' : '^2.6.11',
      ...(options.routing
        ? { 'vue-router': options.isVue3 ? '^4.0.0-0' : '^3.2.0' }
        : {}),
    },
    {
      '@vue/cli-plugin-typescript': '~4.5.0',
      '@vue/cli-service': '~4.5.0',
      ...(options.isVue3 ? { '@vue/compiler-sfc': '^3.0.0' } : {}),
      '@vue/eslint-config-typescript': '^5.0.2',
      'eslint-plugin-vue': '^7.8.0',
      ...(!options.isVue3 ? { 'vue-template-compiler': '^2.6.11' } : {}),
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
    ...babelTasks,
    installTask
  );
}

export const applicationSchematic = convertNxGenerator(applicationGenerator);
