import { chain, Rule } from '@angular-devkit/schematics';
import { addDepsToPackageJson, readWorkspace } from '@nrwl/workspace';
import * as path from 'path';

function deleteExtendInEslintConfig(): Rule {
  return (tree) => {
    const { projects } = readWorkspace(tree);
    for (const key in projects) {
      const project = projects[key];
      if (project?.architect?.lint || project?.targets?.lint) {
        const eslintConfig = '.eslintrc.js';
        if (!tree.exists(path.join(project.root, eslintConfig))) {
          continue;
        }
        const content = tree
          .read(path.join(project.root, eslintConfig))
          .toString('utf-8');
        if (content.includes('plugin:vue')) {
          tree.overwrite(
            path.join(project.root, eslintConfig),
            content.replace(/'prettier\/@typescript-eslint',?/g, '')
          );
        }
      }
    }
  };
}

export default function update(): Rule {
  return chain([
    addDepsToPackageJson({}, { 'eslint-config-prettier': '8.1.0' }),
    deleteExtendInEslintConfig(),
  ]);
}
