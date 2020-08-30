import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';
import { ApplicationSchematicSchema } from './schema';

describe('nuxt schematic', () => {
  let appTree: Tree;
  const options: ApplicationSchematicSchema = {
    name: 'my-app',
    unitTestRunner: 'jest',
    e2eTestRunner: 'cypress',
    skipFormat: false,
  };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/nuxt',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should update workspace.json', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();
    const workspaceJson = readJsonInTree(tree, 'workspace.json');
    const { build, serve, lint, test } = workspaceJson.projects[
      'my-app'
    ].architect;

    expect(workspaceJson.projects['my-app'].root).toBe('apps/my-app');
    expect(build.builder).toBe('@nx-plus/nuxt:browser');
    expect(build.options).toEqual({ buildDir: 'dist/apps/my-app' });
    expect(build.configurations.production).toEqual({});
    expect(serve.builder).toBe('@nx-plus/nuxt:server');
    expect(serve.options).toEqual({
      browserTarget: 'my-app:build',
      dev: true,
    });
    expect(serve.configurations.production).toEqual({
      browserTarget: 'my-app:build:production',
      dev: false,
    });
    expect(lint.builder).toBe('@nrwl/linter:lint');
    expect(test.builder).toBe('@nrwl/jest:jest');

    expect(workspaceJson.projects['my-app-e2e']).toBeDefined();
  });

  it('should generate files', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();

    [
      'apps/my-app/tsconfig.spec.json',
      'apps/my-app/tsconfig.json',
      'apps/my-app/nuxt.config.js',
      'apps/my-app/jest.config.js',
      'apps/my-app/.eslintrc.js',
      'apps/my-app/test/Logo.spec.js',
      'apps/my-app/static/favicon.ico',
      'apps/my-app/pages/index.vue',
      'apps/my-app/layouts/default.vue',
      'apps/my-app/components/Logo.vue',
    ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

    const eslintConfig = tree.readContent('apps/my-app/.eslintrc.js');
    expect(eslintConfig).toContain(`extends: [
    '../../.eslintrc',
    '@nuxtjs/eslint-config-typescript',
    'plugin:nuxt/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ]`);

    expect(
      tree.readContent('apps/my-app-e2e/src/integration/app.spec.ts')
    ).toContain("'my-app'");
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      const tree = await testRunner
        .runSchematicAsync(
          'app',
          { ...options, unitTestRunner: 'none' },
          appTree
        )
        .toPromise();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');

      expect(workspaceJson.projects['my-app'].architect.test).toBeUndefined();

      [
        'apps/my-app/tsconfig.spec.json',
        'apps/my-app/jest.config.js',
        'apps/my-app/test/Logo.spec.js',
      ].forEach((path) => expect(tree.exists(path)).toBeFalsy());
    });
  });

  describe('--e2eTestRunner none', () => {
    it('should not generate e2e configuration', async () => {
      const tree = await testRunner
        .runSchematicAsync(
          'app',
          { ...options, e2eTestRunner: 'none' },
          appTree
        )
        .toPromise();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');

      expect(workspaceJson.projects['my-app-e2e']).toBeUndefined();

      const e2eDir = tree.getDir('apps/my-app-e2e');
      expect(e2eDir.subfiles.length).toBe(0);
      expect(e2eDir.subdirs.length).toBe(0);
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, directory: 'subdir' }, appTree)
        .toPromise();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');
      const { build, serve } = workspaceJson.projects[
        'subdir-my-app'
      ].architect;

      expect(workspaceJson.projects['subdir-my-app'].root).toBe(
        'apps/subdir/my-app'
      );
      expect(build.options).toEqual({ buildDir: 'dist/apps/subdir/my-app' });
      expect(serve.options).toEqual({
        browserTarget: 'subdir-my-app:build',
        dev: true,
      });
      expect(serve.configurations.production).toEqual({
        browserTarget: 'subdir-my-app:build:production',
        dev: false,
      });
    });

    it('should generate files', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, directory: 'subdir' }, appTree)
        .toPromise();

      [
        'apps/subdir/my-app/tsconfig.spec.json',
        'apps/subdir/my-app/tsconfig.json',
        'apps/subdir/my-app/nuxt.config.js',
        'apps/subdir/my-app/jest.config.js',
        'apps/subdir/my-app/.eslintrc.js',
        'apps/subdir/my-app/test/Logo.spec.js',
        'apps/subdir/my-app/static/favicon.ico',
        'apps/subdir/my-app/pages/index.vue',
        'apps/subdir/my-app/layouts/default.vue',
        'apps/subdir/my-app/components/Logo.vue',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

      const eslintConfig = tree.readContent('apps/subdir/my-app/.eslintrc.js');
      expect(eslintConfig).toContain(`extends: [
    '../../../.eslintrc',
    '@nuxtjs/eslint-config-typescript',
    'plugin:nuxt/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ]`);

      expect(
        tree.readContent('apps/subdir/my-app-e2e/src/integration/app.spec.ts')
      ).toContain("'subdir-my-app'");
    });
  });
});
