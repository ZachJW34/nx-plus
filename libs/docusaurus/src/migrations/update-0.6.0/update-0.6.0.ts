import { tags } from '@angular-devkit/core';
import { chain, Rule } from '@angular-devkit/schematics';
import { updatePackagesInPackageJson, readWorkspace } from '@nrwl/workspace';
import * as path from 'path';

export default function update(): Rule {
  return chain([
    updatePackagesInPackageJson(
      path.join(__dirname, '../../../', 'migrations.json'),
      '0.6.0'
    ),
    (tree) => {
      const { projects } = readWorkspace(tree);
      for (const key in projects) {
        const project = projects[key];
        if (
          project.projectType === 'application' &&
          project.architect &&
          project.architect.build &&
          project.architect.build.builder === '@nx-plus/docusaurus:browser' &&
          !tree.exists(`${project.root}/babel.config.js`)
        ) {
          tree.create(
            `${project.root}/babel.config.js`,
            tags.stripIndent`
              module.exports = {
                presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
              };`
          );
        }
      }
    },
  ]);
}
