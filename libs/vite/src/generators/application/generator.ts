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
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import { checkPeerDeps } from '../../utils';
import { ApplicationGeneratorSchema } from './schema';

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
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
  if (options.unitTestRunner === 'none') {
    const { path } =
      tree.listChanges().find(({ path }) => path.includes('example.spec.ts')) ||
      {};

    if (path) {
      tree.delete(path);
    }
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
      '@vue/eslint-config-prettier': '7.0.0',
      '@vue/eslint-config-typescript': '^11.0.0',
      'eslint-plugin-prettier': '^4.2.0',
      'eslint-plugin-vue': '^9.8.0',
    }
  );

  return [lintTask, installTask];
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

  const appSpecPath = options.projectRoot + '-e2e/src/e2e/app.cy.ts';
  tree.write(
    appSpecPath,
    `describe('${options.projectName}', () => {
  it('should display welcome message', () => {
    cy.visit('/')
    cy.contains('h1', 'Hello Vue 3 + TypeScript + Vite')
  });
});
`
  );

  return [cypressInitTask, cypressTask];
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
    json.include = json.include.filter(
      (pattern: string) => !/\.jsx?$/.test(pattern)
    );
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
    '^.+\\.vue$': '@vue/vue3-jest',
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
  tree.write(`${options.projectRoot}/jest.config.ts`, content);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@vue/test-utils': '^2.2.0',
      'jest-serializer-vue': '^3.0.0',
      'jest-transform-stub': '^2.0.0',
      '@vue/vue3-jest': '^28.1.0',
    }
  );
  return [jestInitTask, jestTask, installTask];
}

function addPostInstall(tree: Tree) {
  return updateJson(tree, 'package.json', (json) => {
    const vuePostInstall = 'patch-nx-dep-graph';
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
        executor: '@nx-plus/vite:build',
        options: {
          config: `${options.projectRoot}/vite.config.ts`,
        },
      },
      serve: {
        executor: '@nx-plus/vite:server',
        options: {
          config: `${options.projectRoot}/vite.config.ts`,
        },
      },
    },
    tags: options.parsedTags,
  });
  addFiles(tree, options);
  const lintTasks = await addEsLint(tree, options);
  const cypressTasks =
    schema.e2eTestRunner === 'cypress' ? await addCypress(tree, options) : [];
  const jestTasks =
    schema.unitTestRunner === 'jest' ? await addJest(tree, options) : [];
  const installTask = addDependenciesToPackageJson(
    tree,
    { vue: '^3.2.0' },
    {
      '@vitejs/plugin-vue': '^3.2.0',
      typescript: '^4.7.4',
      vite: '^3.2.0',
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
