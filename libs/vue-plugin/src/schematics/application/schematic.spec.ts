import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';
import { ApplicationSchematicSchema } from './schema';

describe('application schematic', () => {
  let appTree: Tree;
  const options: ApplicationSchematicSchema = {
    name: 'my-app',
    unitTestRunner: 'jest',
    skipFormat: false
  };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/vue-plugin',
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
    expect(workspaceJson.projects['my-app'].sourceRoot).toBe('apps/my-app/src');
    expect(build.builder).toBe('@nx-plus/vue-plugin:browser');
    expect(build.options).toEqual({
      outputPath: 'dist/apps/my-app',
      index: 'apps/my-app/src/index.html',
      main: 'apps/my-app/src/main.ts',
      tsConfig: 'apps/my-app/tsconfig.app.json',
      assets: ['apps/my-app/src/favicon.ico', 'apps/my-app/src/assets']
    });
    expect(build.configurations.production).toEqual({
      mode: 'production'
    });
    expect(serve.builder).toBe('@nx-plus/vue-plugin:dev-server');
    expect(serve.options).toEqual({
      buildTarget: 'my-app:build'
    });
    expect(serve.configurations.production).toEqual({
      buildTarget: 'my-app:build:production'
    });
    expect(lint.builder).toBe('@nrwl/linter:lint');
    expect(test.builder).toBe('@nrwl/jest:jest');
  });

  it('should generate files', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();

    [
      'apps/my-app/tsconfig.spec.json',
      'apps/my-app/tsconfig.json',
      'apps/my-app/tsconfig.app.json',
      'apps/my-app/jest.config.js',
      'apps/my-app/.eslintrc',
      'apps/my-app/src/shims-vue.d.ts',
      'apps/my-app/src/main.ts',
      'apps/my-app/src/index.html',
      'apps/my-app/src/assets/logo.png',
      'apps/my-app/src/assets/.gitkeep',
      'apps/my-app/src/app/app.vue',
      'apps/my-app/src/app/app.spec.ts'
    ].forEach(path => expect(tree.exists(path)).toBeTruthy());

    const tsconfigAppJson = readJsonInTree(
      tree,
      'apps/my-app/tsconfig.app.json'
    );
    expect(tsconfigAppJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = readJsonInTree(tree, 'apps/my-app/.eslintrc');
    expect(eslintConfig.extends[0]).toBe('../../.eslintrc');
    expect(eslintConfig.overrides).toEqual([
      {
        files: ['**/*.spec.{j,t}s?(x)'],
        env: {
          jest: true
        }
      }
    ]);
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
        'apps/my-app/src/app/app.spec.ts'
      ].forEach(path => expect(tree.exists(path)).toBeFalsy());

      const tsconfigAppJson = readJsonInTree(
        tree,
        'apps/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toBeUndefined();

      const eslintConfig = readJsonInTree(tree, 'apps/my-app/.eslintrc');
      expect(eslintConfig.overrides).toBeUndefined();
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
      expect(workspaceJson.projects['subdir-my-app'].sourceRoot).toBe(
        'apps/subdir/my-app/src'
      );
      expect(build.options).toEqual({
        outputPath: 'dist/apps/subdir/my-app',
        index: 'apps/subdir/my-app/src/index.html',
        main: 'apps/subdir/my-app/src/main.ts',
        tsConfig: 'apps/subdir/my-app/tsconfig.app.json',
        assets: [
          'apps/subdir/my-app/src/favicon.ico',
          'apps/subdir/my-app/src/assets'
        ]
      });
      expect(serve.options).toEqual({
        buildTarget: 'subdir-my-app:build'
      });
      expect(serve.configurations.production).toEqual({
        buildTarget: 'subdir-my-app:build:production'
      });
    });

    it('should generate files', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, directory: 'subdir' }, appTree)
        .toPromise();

      [
        'apps/subdir/my-app/tsconfig.spec.json',
        'apps/subdir/my-app/tsconfig.json',
        'apps/subdir/my-app/tsconfig.app.json',
        'apps/subdir/my-app/jest.config.js',
        'apps/subdir/my-app/.eslintrc',
        'apps/subdir/my-app/src/shims-vue.d.ts',
        'apps/subdir/my-app/src/main.ts',
        'apps/subdir/my-app/src/index.html',
        'apps/subdir/my-app/src/assets/logo.png',
        'apps/subdir/my-app/src/assets/.gitkeep',
        'apps/subdir/my-app/src/app/app.vue',
        'apps/subdir/my-app/src/app/app.spec.ts'
      ].forEach(path => expect(tree.exists(path)).toBeTruthy());

      const tsconfigAppJson = readJsonInTree(
        tree,
        'apps/subdir/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx'
      ]);

      const eslintConfig = readJsonInTree(tree, 'apps/subdir/my-app/.eslintrc');
      expect(eslintConfig.extends[0]).toBe('../../../.eslintrc');
      expect(eslintConfig.overrides).toEqual([
        {
          files: ['**/*.spec.{j,t}s?(x)'],
          env: {
            jest: true
          }
        }
      ]);
    });
  });
});
