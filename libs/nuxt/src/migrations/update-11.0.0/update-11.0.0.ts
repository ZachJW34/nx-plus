import { chain, Rule } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  readWorkspace,
  updatePackagesInPackageJson,
} from '@nrwl/workspace';
import * as path from 'path';

function deleteExtendInEslintConfig(): Rule {
  return (tree) => {
    const { projects } = readWorkspace(tree);
    for (const key in projects) {
      const project = projects[key];
      if (
        (project?.architect?.build?.builder === '@nx-plus/nuxt:browser' ||
          project?.targets?.build?.executor === '@nx-plus/nuxt:browser') &&
        (project?.architect?.lint || project?.targets?.lint)
      ) {
        const eslintConfig = '.eslintrc.js';
        const content = tree
          .read(path.join(project.root, eslintConfig))
          .toString('utf-8')
          .replace(/'prettier\/@typescript-eslint',?/g, '');

        tree.overwrite(path.join(project.root, eslintConfig), content);
      }
    }
  };
}

export default function update(): Rule {
  return chain([
    updatePackagesInPackageJson(
      path.join(__dirname, '../../../', 'migrations.json'),
      '11.0.0'
    ),
    addDepsToPackageJson(
      { 'core-js': '^3.8.3' },
      { 'eslint-config-prettier': '8.1.0' }
    ),
    deleteExtendInEslintConfig(),
    (_, ctx) => {
      ctx.logger.info(
        "The dependencies '@nuxtjs/eslint-config' and 'fork-ts-checker-webpack-plugin' are no longer required by @nx-plus/nuxt. If you have no dependency on these packages, you can remove them."
      );
    },
  ]);
}
