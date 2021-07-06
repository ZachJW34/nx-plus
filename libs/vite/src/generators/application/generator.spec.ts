import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

describe('application generator', () => {
  let appTree: Tree;
  const options: ApplicationGeneratorSchema = {
    name: 'my-app',
    skipFormat: false,
    unitTestRunner: 'jest',
    e2eTestRunner: 'cypress',
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-app');

    expect(config.root).toBe('apps/my-app');
    expect(config.sourceRoot).toBe('apps/my-app/src');
    expect(config.targets.build.executor).toBe('@nx-plus/vite:build');
    expect(config.targets.build.options).toEqual({
      config: 'apps/my-app/vite.config.ts',
    });
    expect(config.targets.serve.executor).toBe('@nx-plus/vite:server');
    expect(config.targets.serve.options).toEqual({
      config: 'apps/my-app/vite.config.ts',
    });

    expect(config.targets.lint.executor).toBe('@nrwl/linter:eslint');
    expect(config.targets.test.executor).toBe('@nrwl/jest:jest');

    const e2eConfig = readProjectConfiguration(appTree, 'my-app-e2e');
    expect(e2eConfig).toBeDefined();
  });

  it('should generate files', async () => {
    await applicationGenerator(appTree, options);

    [
      'apps/my-app/index.html',
      'apps/my-app/tsconfig.json',
      'apps/my-app/tsconfig.app.json',
      'apps/my-app/vite.config.ts',
      'apps/my-app/public/favicon.ico',
      'apps/my-app/src/assets/logo.png',
      'apps/my-app/src/components/HelloWorld.vue',
      'apps/my-app/src/App.vue',
      'apps/my-app/src/main.ts',
      'apps/my-app/src/shims-vue.d.ts',
      'apps/my-app/tests/unit/example.spec.ts',
    ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());
  });

  it('should add postinstall script', async () => {
    await applicationGenerator(appTree, options);

    expect(readJson(appTree, 'package.json').scripts.postinstall).toBe(
      'node node_modules/@nx-plus/vite/patch-nx-dep-graph.js'
    );
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        unitTestRunner: 'none',
      });
      const config = readProjectConfiguration(appTree, 'my-app');

      expect(config.targets.test).toBeUndefined();

      [
        'apps/my-app/tsconfig.spec.json',
        'apps/my-app/jest.config.js',
        'apps/my-app/tests/unit/example.spec.ts',
      ].forEach((path) => expect(appTree.exists(path)).toBeFalsy());

      const tsconfigAppJson = readJson(
        appTree,
        'apps/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toBeUndefined();

      expect(appTree.read('apps/my-app/.eslintrc.js').toString()).not.toContain(
        'overrides:'
      );

      const tsConfigJson = readJson(appTree, 'apps/my-app/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
    });
  });
});
