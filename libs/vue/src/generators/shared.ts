import {
  addDependenciesToPackageJson,
  getWorkspaceLayout,
  logger,
  names,
  offsetFromRoot,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { ApplicationGeneratorSchema } from './application/schema';
import { LibraryGeneratorSchema } from './library/schema';

export type NormalizedVueSchema<T> = {
  name: string;
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  isVue3: boolean;
} & T;

export function normalizeVueOptions<
  T extends LibraryGeneratorSchema | ApplicationGeneratorSchema
>(
  tree: Tree,
  schema: T,
  type: 'library' | 'application'
): NormalizedVueSchema<T> {
  const name = names(schema.name).fileName;
  const projectDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${name}`
    : name;
  const dir = type === 'application' ? 'appsDir' : 'libsDir';
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree)[dir]}/${projectDirectory}`;
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

type Options = NormalizedVueSchema<
  ApplicationGeneratorSchema | LibraryGeneratorSchema
>;

export async function addJest(tree: Tree, options: Options) {
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
    '^.+\\.vue$': '${options.isVue3 ? 'vue3-jest' : '@vue/vue2-jest'}',
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
      ${
        options.babel
          ? `babelConfig: '${options.projectRoot}/babel.config.js',`
          : ''
      }
    },
    'vue-jest': {
      tsConfig: '${options.projectRoot}/tsconfig.spec.json',
      ${
        options.babel
          ? `babelConfig: '${options.projectRoot}/babel.config.js',`
          : ''
      }
    },
  },
};
`;
  tree.write(`${options.projectRoot}/jest.config.ts`, content);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      ...(options.isVue3
        ? { '@vue/test-utils': '^2.0.0-0' }
        : { '@vue/test-utils': '^1.1.3' }),
      'jest-serializer-vue': '^2.0.2',
      'jest-transform-stub': '^2.0.0',
      ...(options.isVue3
        ? { 'vue3-jest': '^27.0.0-alpha.1' }
        : { '@vue/vue2-jest': '^27.0.0-alpha.1' }),
    }
  );
  return [jestInitTask, jestTask, installTask];
}

function getEslintConfig(options: Options) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eslintConfig: any = {
    extends: [
      `${offsetFromRoot(options.projectRoot)}.eslintrc.json`,
      `plugin:vue/${options.isVue3 ? 'vue3-' : ''}essential`,
      '@vue/typescript/recommended',
      'prettier',
    ],
    rules: {},
    ignorePatterns: ['!**/*'],
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

export async function addEsLint(tree: Tree, options: Options) {
  const { lintProjectGenerator, Linter } = await import('@nrwl/linter');
  const lintTask = await lintProjectGenerator(tree, {
    linter: Linter.EsLint,
    project: options.projectName,
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,vue}`],
    skipFormat: true,
  });

  const content = JSON.stringify(getEslintConfig(options), null, 2);
  const configPath = `${options.projectRoot}/.eslintrc.json`;
  tree.write(configPath, content);

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

export function addPostInstall(tree: Tree) {
  return updateJson(tree, 'package.json', (json) => {
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

export async function addBabel(tree: Tree, options: Options) {
  const babelConfigPath = `${options.projectRoot}/babel.config.js`;
  tree.write(
    babelConfigPath,
    `module.exports = {
  presets: ["@vue/cli-plugin-babel/preset"]
};`
  );

  const installTask = addDependenciesToPackageJson(
    tree,
    { 'core-js': '^3.6.5' },
    { '@vue/cli-plugin-babel': '~5.0.8' }
  );

  return [installTask];
}
