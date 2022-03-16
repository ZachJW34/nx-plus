import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

describe('nuxt schematic', () => {
  let appTree: Tree;
  const options: ApplicationGeneratorSchema = {
    name: 'my-app',
    unitTestRunner: 'jest',
    e2eTestRunner: 'cypress',
    skipFormat: false,
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);
    const {
      root,
      targets: { build, serve, test, lint, static: staticGenerate },
    } = readProjectConfiguration(appTree, 'my-app');

    expect(root).toBe('apps/my-app');
    expect(build.executor).toBe('@nx-plus/nuxt:browser');
    expect(build.options).toEqual({ buildDir: 'dist/apps/my-app' });
    expect(build.configurations.production).toEqual({});
    expect(serve.executor).toBe('@nx-plus/nuxt:server');
    expect(serve.options).toEqual({
      browserTarget: 'my-app:build',
      dev: true,
    });
    expect(serve.configurations.production).toEqual({
      browserTarget: 'my-app:build:production',
      dev: false,
    });
    expect(staticGenerate.executor).toBe('@nx-plus/nuxt:static');
    expect(staticGenerate.options).toEqual({
      browserTarget: 'my-app:build:production',
    });
    expect(lint.executor).toBe('@nrwl/linter:eslint');
    expect(test.executor).toBe('@nrwl/jest:jest');

    expect(readProjectConfiguration(appTree, 'my-app-e2e')).toBeDefined();
  });

  it('should generate files', async () => {
    await applicationGenerator(appTree, options);

    [
      'apps/my-app/tsconfig.spec.json',
      'apps/my-app/tsconfig.json',
      'apps/my-app/nuxt.config.js',
      'apps/my-app/jest.config.js',
      'apps/my-app/.eslintrc.json',
      'apps/my-app/test/Logo.spec.js',
      'apps/my-app/static/favicon.ico',
      'apps/my-app/pages/index.vue',
      'apps/my-app/layouts/default.vue',
      'apps/my-app/components/Logo.vue',
    ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

    const eslintConfig = JSON.parse(
      appTree.read('apps/my-app/.eslintrc.json').toString()
    );
    expect(eslintConfig.extends).toEqual([
      '../../.eslintrc.json',
      '@nuxtjs/eslint-config-typescript',
      'plugin:nuxt/recommended',
      'prettier',
    ]);

    expect(
      appTree.read('apps/my-app-e2e/src/integration/app.spec.ts').toString()
    ).toContain("'my-app'");
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        unitTestRunner: 'none',
      });

      const {
        targets: { test },
      } = readProjectConfiguration(appTree, 'my-app');

      expect(test).toBeUndefined();

      [
        'apps/my-app/tsconfig.spec.json',
        'apps/my-app/jest.config.js',
        'apps/my-app/test/Logo.spec.js',
      ].forEach((path) => expect(appTree.exists(path)).toBeFalsy());
    });
  });

  describe('--e2eTestRunner none', () => {
    it('should not generate e2e configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        e2eTestRunner: 'none',
      });

      expect(() => readProjectConfiguration(appTree, 'my-app-e2e')).toThrow();

      const e2eDir = appTree.children('apps/my-app-e2e');
      expect(e2eDir.length).toBe(0);
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json', async () => {
      await applicationGenerator(appTree, { ...options, directory: 'subdir' });

      const {
        root,
        targets: { build, serve, test, lint, static: staticGenerate },
      } = readProjectConfiguration(appTree, 'subdir-my-app');

      expect(root).toBe('apps/subdir/my-app');
      expect(build.executor).toBe('@nx-plus/nuxt:browser');
      expect(build.options).toEqual({ buildDir: 'dist/apps/subdir/my-app' });
      expect(build.configurations.production).toEqual({});
      expect(serve.executor).toBe('@nx-plus/nuxt:server');
      expect(serve.options).toEqual({
        browserTarget: 'subdir-my-app:build',
        dev: true,
      });
      expect(serve.configurations.production).toEqual({
        browserTarget: 'subdir-my-app:build:production',
        dev: false,
      });
      expect(staticGenerate.executor).toBe('@nx-plus/nuxt:static');
      expect(staticGenerate.options).toEqual({
        browserTarget: 'subdir-my-app:build:production',
      });
      expect(lint.executor).toBe('@nrwl/linter:eslint');
      expect(test.executor).toBe('@nrwl/jest:jest');

      expect(
        readProjectConfiguration(appTree, 'subdir-my-app-e2e')
      ).toBeDefined();
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, {
        ...options,
        directory: 'subdir',
      });

      [
        'apps/subdir/my-app/tsconfig.spec.json',
        'apps/subdir/my-app/tsconfig.json',
        'apps/subdir/my-app/nuxt.config.js',
        'apps/subdir/my-app/jest.config.js',
        'apps/subdir/my-app/.eslintrc.json',
        'apps/subdir/my-app/test/Logo.spec.js',
        'apps/subdir/my-app/static/favicon.ico',
        'apps/subdir/my-app/pages/index.vue',
        'apps/subdir/my-app/layouts/default.vue',
        'apps/subdir/my-app/components/Logo.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const eslintConfig = JSON.parse(
        appTree.read('apps/subdir/my-app/.eslintrc.json').toString()
      );
      expect(eslintConfig.extends).toEqual([
        '../../../.eslintrc.json',
        '@nuxtjs/eslint-config-typescript',
        'plugin:nuxt/recommended',
        'prettier',
      ]);

      expect(
        appTree
          .read('apps/subdir/my-app-e2e/src/integration/app.spec.ts')
          .toString()
      ).toContain("'subdir-my-app'");
    });
  });

  describe('workspaceLayout', () => {
    beforeEach(() => {
      const nxJson = JSON.parse(appTree.read('nx.json').toString());
      const updateNxJson = {
        ...nxJson,
        workspaceLayout: { appsDir: 'custom-apps-dir' },
      };
      appTree.write('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json', async () => {
      await applicationGenerator(appTree, options);
      const {
        root,
        targets: { build, serve, test, lint, static: staticGenerate },
      } = readProjectConfiguration(appTree, 'my-app');

      expect(root).toBe('custom-apps-dir/my-app');
      expect(build.options).toEqual({
        buildDir: 'dist/custom-apps-dir/my-app',
      });
      expect(serve.options).toEqual({
        browserTarget: 'my-app:build',
        dev: true,
      });
      expect(serve.configurations.production).toEqual({
        browserTarget: 'my-app:build:production',
        dev: false,
      });
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, options);

      [
        'custom-apps-dir/my-app/tsconfig.spec.json',
        'custom-apps-dir/my-app/tsconfig.json',
        'custom-apps-dir/my-app/nuxt.config.js',
        'custom-apps-dir/my-app/jest.config.js',
        'custom-apps-dir/my-app/.eslintrc.json',
        'custom-apps-dir/my-app/test/Logo.spec.js',
        'custom-apps-dir/my-app/static/favicon.ico',
        'custom-apps-dir/my-app/pages/index.vue',
        'custom-apps-dir/my-app/layouts/default.vue',
        'custom-apps-dir/my-app/components/Logo.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const eslintConfig = JSON.parse(
        appTree.read('custom-apps-dir/my-app/.eslintrc.json').toString()
      );
      expect(eslintConfig.extends).toEqual([
        '../../.eslintrc.json',
        '@nuxtjs/eslint-config-typescript',
        'plugin:nuxt/recommended',
        'prettier',
      ]);

      expect(
        appTree
          .read('custom-apps-dir/my-app-e2e/src/integration/app.spec.ts')
          .toString()
      ).toContain("'my-app'");
    });
  });
});
