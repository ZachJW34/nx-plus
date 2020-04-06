import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';

import { NxDocusaurusSchematicSchema } from './schema';

describe('nx-docusaurus schematic', () => {
  let appTree: Tree;
  const options: NxDocusaurusSchematicSchema = { name: 'test' };

  const testRunner = new SchematicTestRunner(
    '@jsi/nx-docusaurus',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should run successfully', async () => {
    await expect(
      testRunner.runSchematicAsync('nxDocusaurus', options, appTree).toPromise()
    ).resolves.not.toThrowError();
  });
});
