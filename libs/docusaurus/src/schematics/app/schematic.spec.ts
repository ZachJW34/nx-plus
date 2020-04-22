import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';

import { AppSchematicSchema } from './schema';

describe('docusaurus schematic', () => {
  let appTree: Tree;
  const options: AppSchematicSchema = { name: 'test' };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/docusaurus',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should run successfully', async () => {
    await expect(
      testRunner.runSchematicAsync('app', options, appTree).toPromise()
    ).resolves.not.toThrowError();
  });
});
