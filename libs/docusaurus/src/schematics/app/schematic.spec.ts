import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';
import { AppSchematicSchema } from './schema';

describe('docusaurus schematic', () => {
  let appTree: Tree;
  const options: AppSchematicSchema = { name: 'test', skipFormat: false };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/docusaurus',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
    appTree.create('.gitignore', '');
    appTree.create('.prettierignore', '');
  });

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, directory: 'subdir' }, appTree)
        .toPromise();
      expect(tree.exists('apps/subdir/test/docusaurus.config.js')).toBeTruthy();
    });
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, tags: 'tag1,tag2' }, appTree)
        .toPromise();
      const nxJson = JSON.parse(tree.readContent('nx.json'));
      expect(nxJson.projects['test'].tags).toEqual(['tag1', 'tag2']);
    });
  });
});
