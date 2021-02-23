import { chain, Rule } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  updatePackagesInPackageJson,
} from '@nrwl/workspace';
import * as path from 'path';

export default function update(): Rule {
  return chain([
    updatePackagesInPackageJson(
      path.join(__dirname, '../../../', 'migrations.json'),
      '11.0.0'
    ),
    addDepsToPackageJson({ '@mdx-js/react': '^1.6.21' }, {}),
  ]);
}
