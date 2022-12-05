import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  readWorkspaceConfiguration,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import {
  addBabel,
  addEsLint,
  addJest,
  addPostInstall,
  NormalizedVueSchema,
  normalizeVueOptions,
} from '../shared';
import { LibraryGeneratorSchema } from './schema';
import path = require('path');

export type NormalizedSchema = NormalizedVueSchema<LibraryGeneratorSchema>;

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

  const fileChanges = tree.listChanges();

  fileChanges.forEach(({ path }) => {
    const shouldDelete =
      (options.unitTestRunner === 'none' &&
        path.includes('/tests/unit/example.spec.ts')) ||
      (!options.publishable && path.includes('/configure-webpack.js')) ||
      (options.isVue3 && path.includes('/src/shims-tsx.d.ts'));

    if (shouldDelete) {
      tree.delete(path);
    }
  });
}

function addPublishable(tree: Tree, options: NormalizedSchema) {
  const npmScope = readWorkspaceConfiguration(tree)?.npmScope;

  tree.write(
    `${options.projectRoot}/package.json`,
    JSON.stringify({
      name: `@${npmScope}/${options.name}`,
      version: '0.0.0',
    })
  );
}

function updateTsConfig(tree: Tree, options: NormalizedSchema) {
  const nxJson = readWorkspaceConfiguration(tree);

  updateJson(tree, 'tsconfig.base.json', (json) => {
    const c = json.compilerOptions;
    c.paths = c.paths || {};
    delete c.paths[options.name];
    c.paths[`@${nxJson?.npmScope}/${options.projectDirectory}`] = [
      `${options.projectRoot}/src/index.ts`,
    ];
    return json;
  });
}

export async function libraryGenerator(
  tree: Tree,
  schema: LibraryGeneratorSchema
) {
  const options = normalizeVueOptions(tree, schema, 'library');
  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    projectType: 'library',
    sourceRoot: `${options.projectRoot}/src`,
    targets: options.publishable
      ? {
          build: {
            executor: '@nx-plus/vue:library',
            options: {
              dest: `dist/${options.projectRoot}`,
              entry: `${options.projectRoot}/src/index.ts`,
              tsConfig: `${options.projectRoot}/tsconfig.lib.json`,
            },
          },
        }
      : {},
    tags: options.parsedTags,
  });

  addFiles(tree, options);
  addPostInstall(tree);

  if (!options.skipTsConfig) {
    updateTsConfig(tree, options);
  }

  if (options.publishable) {
    addPublishable(tree, options);
  }

  const lintTasks = await addEsLint(tree, options);
  const jestTasks =
    options.unitTestRunner === 'jest' ? await addJest(tree, options) : [];
  const babelTasks = options.babel ? await addBabel(tree, options) : [];
  const installTask = addDependenciesToPackageJson(
    tree,
    {
      vue: options.isVue3 ? '^3.0.0' : '^2.6.11',
    },
    {
      '@vue/cli-plugin-typescript': '~5.0.8',
      '@vue/cli-service': '~5.0.8',
      ...(options.isVue3 ? { '@vue/compiler-sfc': '^3.0.0' } : {}),
      '@vue/eslint-config-typescript': '^5.0.2',
      'eslint-plugin-vue': '^7.8.0',
      ...(!options.isVue3 ? { 'vue-template-compiler': '^2.6.11' } : {}),
    }
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(
    ...lintTasks,
    ...jestTasks,
    ...babelTasks,
    installTask
  );
}

export const librarySchematic = convertNxGenerator(libraryGenerator);
