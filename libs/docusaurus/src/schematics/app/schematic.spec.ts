import { tags } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';
import { AppSchematicSchema } from './schema';

describe('docusaurus schematic', () => {
  let appTree: Tree;
  const options: AppSchematicSchema = { name: 'my-app', skipFormat: false };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/docusaurus',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
    appTree.create('.gitignore', '');
    appTree.create('.prettierignore', '');
  });

  it('should update workspace.json', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();

    const workspaceJson = readJsonInTree(tree, 'workspace.json');
    const { build, serve } = workspaceJson.projects['my-app'].architect;

    expect(workspaceJson.projects['my-app'].root).toBe('apps/my-app');
    expect(build.builder).toBe('@nx-plus/docusaurus:browser');
    expect(build.options).toEqual({ outputPath: 'dist/apps/my-app' });
    expect(serve.builder).toBe('@nx-plus/docusaurus:dev-server');
    expect(serve.options).toEqual({
      port: 3000,
    });
  });

  it('should generate files', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();

    [
      'apps/my-app/docusaurus.config.js',
      'apps/my-app/docs/doc3.md',
      'apps/my-app/docs/doc2.md',
      'apps/my-app/docs/doc1.md',
      'apps/my-app/docs/mdx.md',
      'apps/my-app/blog/2019-05-29-hello-world.md',
      'apps/my-app/blog/2019-05-28-hola.md',
      'apps/my-app/blog/2019-05-30-welcome.md',
      'apps/my-app/static/img/undraw_docusaurus_mountain.svg',
      'apps/my-app/static/img/logo.svg',
      'apps/my-app/static/img/favicon.ico',
      'apps/my-app/static/img/undraw_docusaurus_react.svg',
      'apps/my-app/static/img/undraw_docusaurus_tree.svg',
      'apps/my-app/sidebars.js',
      'apps/my-app/babel.config.js',
      'apps/my-app/src/css/custom.css',
      'apps/my-app/src/pages/index.js',
      'apps/my-app/src/pages/styles.module.css',
    ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

    expect(tree.readContent('.gitignore')).toContain(tags.stripIndent`
      # Generated Docusaurus files
      .docusaurus/
      .cache-loader/
    `);

    expect(tree.readContent('.prettierignore')).toContain('.docusaurus/');
  });

  describe('--directory', () => {
    it('should update workspace.json', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, directory: 'subdir' }, appTree)
        .toPromise();

      const workspaceJson = readJsonInTree(tree, 'workspace.json');
      const { build } = workspaceJson.projects['subdir-my-app'].architect;

      expect(workspaceJson.projects['subdir-my-app'].root).toBe(
        'apps/subdir/my-app'
      );
      expect(build.options).toEqual({ outputPath: 'dist/apps/subdir/my-app' });
    });

    it('should generate files', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, directory: 'subdir' }, appTree)
        .toPromise();

      [
        'apps/subdir/my-app/docusaurus.config.js',
        'apps/subdir/my-app/docs/doc3.md',
        'apps/subdir/my-app/docs/doc2.md',
        'apps/subdir/my-app/docs/doc1.md',
        'apps/subdir/my-app/docs/mdx.md',
        'apps/subdir/my-app/blog/2019-05-29-hello-world.md',
        'apps/subdir/my-app/blog/2019-05-28-hola.md',
        'apps/subdir/my-app/blog/2019-05-30-welcome.md',
        'apps/subdir/my-app/static/img/undraw_docusaurus_mountain.svg',
        'apps/subdir/my-app/static/img/logo.svg',
        'apps/subdir/my-app/static/img/favicon.ico',
        'apps/subdir/my-app/static/img/undraw_docusaurus_react.svg',
        'apps/subdir/my-app/static/img/undraw_docusaurus_tree.svg',
        'apps/subdir/my-app/sidebars.js',
        'apps/subdir/my-app/babel.config.js',
        'apps/subdir/my-app/src/css/custom.css',
        'apps/subdir/my-app/src/pages/index.js',
        'apps/subdir/my-app/src/pages/styles.module.css',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());
    });
  });

  describe('workspaceLayout', () => {
    beforeEach(() => {
      const nxJson = JSON.parse(appTree.read('nx.json').toString());
      const updateNxJson = {
        ...nxJson,
        workspaceLayout: { appsDir: 'custom-apps-dir' },
      };
      appTree.overwrite('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', options, appTree)
        .toPromise();

      const workspaceJson = readJsonInTree(tree, 'workspace.json');
      const { build } = workspaceJson.projects['my-app'].architect;

      expect(workspaceJson.projects['my-app'].root).toBe(
        'custom-apps-dir/my-app'
      );
      expect(build.options).toEqual({
        outputPath: 'dist/custom-apps-dir/my-app',
      });
    });

    it('should generate files', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', options, appTree)
        .toPromise();

      [
        'custom-apps-dir/my-app/docusaurus.config.js',
        'custom-apps-dir/my-app/docs/doc3.md',
        'custom-apps-dir/my-app/docs/doc2.md',
        'custom-apps-dir/my-app/docs/doc1.md',
        'custom-apps-dir/my-app/docs/mdx.md',
        'custom-apps-dir/my-app/blog/2019-05-29-hello-world.md',
        'custom-apps-dir/my-app/blog/2019-05-28-hola.md',
        'custom-apps-dir/my-app/blog/2019-05-30-welcome.md',
        'custom-apps-dir/my-app/static/img/undraw_docusaurus_mountain.svg',
        'custom-apps-dir/my-app/static/img/logo.svg',
        'custom-apps-dir/my-app/static/img/favicon.ico',
        'custom-apps-dir/my-app/static/img/undraw_docusaurus_react.svg',
        'custom-apps-dir/my-app/static/img/undraw_docusaurus_tree.svg',
        'custom-apps-dir/my-app/sidebars.js',
        'custom-apps-dir/my-app/babel.config.js',
        'custom-apps-dir/my-app/src/css/custom.css',
        'custom-apps-dir/my-app/src/pages/index.js',
        'custom-apps-dir/my-app/src/pages/styles.module.css',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());
    });
  });
});
