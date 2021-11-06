import { chain, SchematicContext } from '@angular-devkit/schematics';
import { getPackageManagerCommand } from '@nrwl/devkit';
import { updateJsonInTree, updatePackagesInPackageJson } from '@nrwl/workspace';
import * as path from 'path';

export default function update() {
  return chain([
    updateJsonInTree('package.json', (json) => {
      delete json.dependencies['@nuxt/typescript-runtime'];
      return json;
    }),
    updatePackagesInPackageJson(
      path.join(__dirname, '../../../', 'migrations.json'),
      '12.3.0'
    ),
    (_, context: SchematicContext) => {
      context.logger.warn(
        `Make sure to run ${
          getPackageManagerCommand().install
        } to (un)install dependencies.`
      );
    },
  ]);
}
