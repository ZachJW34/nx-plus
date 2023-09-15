import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { join } from 'path';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

describe('nuxt schematic', () => {
  let appTree: Tree;

  const treeRead = (path: string) => appTree.read(path, 'utf-8') ?? '';

  const options: ApplicationGeneratorSchema = {
    name: 'my-app',
    unitTestRunner: 'jest',
    e2eTestRunner: 'cypress',
    skipFormat: false,
  };

  const nuxtFiles = [
    'tsconfig.json',
    'nuxt.config.js',
    '.eslintrc.json',
    'static/favicon.ico',
    'pages/index.vue',
    'components/NuxtLogo.vue',
    'components/NuxtTutorial.vue',
  ];

  const testFiles = [
    'tsconfig.spec.json',
    'jest.config.ts',
    'test/NuxtLogo.spec.js',
  ];

  const getGenFiles = (dir = 'apps/my-app') =>
    [...nuxtFiles, ...testFiles].map((file) => join(dir, file));

  const getGenTestFiles = (dir = 'apps/my-app') =>
    testFiles.map((file) => join(dir, file));

  const getEslintConfigWithOffset = (offset: string) => ({
    env: {
      browser: true,
      node: true,
    },
    extends: [
      `${offset}.eslintrc.json`,
      '@nuxtjs/eslint-config-typescript',
      'plugin:nuxt/recommended',
      'prettier',
    ],
    parserOptions: {
      extraFileExtensions: ['.vue'],
    },
    ignorePatterns: ['!**/*'],
    rules: {},
  });

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);
    const config = readProjectConfiguration(appTree, 'my-app');

    expect(config.root).toBe('apps/my-app');
    expect(config.targets?.build.executor).toBe('@nx-plus/nuxt:browser');
    expect(config.targets?.build.options).toEqual({
      buildDir: 'dist/apps/my-app',
    });
    expect(config.targets?.build.configurations?.production).toEqual({});
    expect(config.targets?.serve.executor).toBe('@nx-plus/nuxt:server');
    expect(config.targets?.serve.options).toEqual({
      browserTarget: 'my-app:build',
      dev: true,
    });
    expect(config.targets?.serve.configurations?.production).toEqual({
      browserTarget: 'my-app:build:production',
      dev: false,
    });
    expect(config.targets?.static.executor).toBe('@nx-plus/nuxt:static');
    expect(config.targets?.static.options).toEqual({
      browserTarget: 'my-app:build:production',
    });
    expect(config.targets?.lint.executor).toBe('@nx/linter:eslint');
    expect(config.targets?.test.executor).toBe('@nx/jest:jest');

    expect(readProjectConfiguration(appTree, 'my-app-e2e')).toBeDefined();
  });

  it('should generate files', async () => {
    await applicationGenerator(appTree, options);

    getGenFiles().forEach((path) => expect(appTree.exists(path)).toBeTruthy());

    const eslintConfig = JSON.parse(
      appTree.read('apps/my-app/.eslintrc.json', 'utf-8') ?? ''
    );
    expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../'));

    expect(treeRead('apps/my-app-e2e/src/integration/app.spec.ts')).toContain(
      "'my-app'"
    );
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        unitTestRunner: 'none',
      });

      const config = readProjectConfiguration(appTree, 'my-app');

      expect(config.targets?.test).toBeUndefined();

      getGenTestFiles().forEach((path) =>
        expect(appTree.exists(path)).toBeFalsy()
      );
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

      const config = readProjectConfiguration(appTree, 'subdir-my-app');

      expect(config.root).toBe('apps/subdir/my-app');
      expect(config.targets?.build.executor).toBe('@nx-plus/nuxt:browser');
      expect(config.targets?.build.options).toEqual({
        buildDir: 'dist/apps/subdir/my-app',
      });
      expect(config.targets?.build.configurations?.production).toEqual({});
      expect(config.targets?.serve.executor).toBe('@nx-plus/nuxt:server');
      expect(config.targets?.serve.options).toEqual({
        browserTarget: 'subdir-my-app:build',
        dev: true,
      });
      expect(config.targets?.serve.configurations?.production).toEqual({
        browserTarget: 'subdir-my-app:build:production',
        dev: false,
      });
      expect(config.targets?.static.executor).toBe('@nx-plus/nuxt:static');
      expect(config.targets?.static.options).toEqual({
        browserTarget: 'subdir-my-app:build:production',
      });
      expect(config.targets?.lint.executor).toBe('@nx/linter:eslint');
      expect(config.targets?.test.executor).toBe('@nx/jest:jest');

      expect(
        readProjectConfiguration(appTree, 'subdir-my-app-e2e')
      ).toBeDefined();
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, {
        ...options,
        directory: 'subdir',
      });

      getGenFiles('apps/subdir/my-app').forEach((path) =>
        expect(appTree.exists(path)).toBeTruthy()
      );

      const eslintConfig = JSON.parse(
        treeRead('apps/subdir/my-app/.eslintrc.json')
      );
      expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../../'));

      expect(
        treeRead('apps/subdir/my-app-e2e/src/integration/app.spec.ts')
      ).toContain("'subdir-my-app'");
    });
  });

  describe('workspaceLayout', () => {
    beforeEach(() => {
      const nxJson = JSON.parse(treeRead('nx.json'));
      const updateNxJson = {
        ...nxJson,
        workspaceLayout: { appsDir: 'custom-apps-dir' },
      };
      appTree.write('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json', async () => {
      await applicationGenerator(appTree, options);
      const config = readProjectConfiguration(appTree, 'my-app');

      expect(config.root).toBe('custom-apps-dir/my-app');
      expect(config.targets?.build.options).toEqual({
        buildDir: 'dist/custom-apps-dir/my-app',
      });
      expect(config.targets?.serve.options).toEqual({
        browserTarget: 'my-app:build',
        dev: true,
      });
      expect(config.targets?.serve.configurations?.production).toEqual({
        browserTarget: 'my-app:build:production',
        dev: false,
      });
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, options);

      getGenFiles('custom-apps-dir/my-app').forEach((path) =>
        expect(appTree.exists(path)).toBeTruthy()
      );

      const eslintConfig = JSON.parse(
        treeRead('custom-apps-dir/my-app/.eslintrc.json')
      );
      expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../'));

      expect(
        treeRead('custom-apps-dir/my-app-e2e/src/integration/app.spec.ts')
      ).toContain("'my-app'");
    });
  });
});
