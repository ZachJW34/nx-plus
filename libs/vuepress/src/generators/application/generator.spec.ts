import { Tree, readProjectConfiguration, stripIndents } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

describe('application generator', () => {
  let appTree: Tree;
  const options: ApplicationGeneratorSchema = {
    name: 'my-app',
    vuepressVersion: 1,
    skipFormat: false,
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-app');

    expect(config.root).toBe('apps/my-app');
    expect(config.targets.build.executor).toBe('@nx-plus/vuepress:browser');
    expect(config.targets.build.options).toEqual({ dest: 'dist/apps/my-app' });
    expect(config.targets.serve.executor).toBe('@nx-plus/vuepress:dev-server');
    expect(config.targets.serve.options).toEqual({ port: 8080 });
  });

  describe('--vuepressVersion 1', () => {
    it('should generate files', async () => {
      await applicationGenerator(appTree, options);

      [
        'apps/my-app/index.md',
        'apps/my-app/guide/using-vue.md',
        'apps/my-app/guide/README.md',
        'apps/my-app/config/README.md',
        'apps/my-app/.vuepress/enhanceApp.js',
        'apps/my-app/.vuepress/config.js',
        'apps/my-app/.vuepress/styles/palette.styl',
        'apps/my-app/.vuepress/styles/index.styl',
        'apps/my-app/.vuepress/components/OtherComponent.vue',
        'apps/my-app/.vuepress/components/demo-component.vue',
        'apps/my-app/.vuepress/components/Foo/Bar.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());
    });
  });

  describe('vuepressVersion 2', () => {
    it('should generate files', async () => {
      appTree.write('.gitignore', '');
      appTree.write('.prettierignore', '');

      await applicationGenerator(appTree, { ...options, vuepressVersion: 2 });

      [
        'apps/my-app/index.md',
        'apps/my-app/guide/using-vue.md',
        'apps/my-app/guide/README.md',
        'apps/my-app/config/README.md',
        'apps/my-app/.vuepress/clientAppEnhance.js',
        'apps/my-app/.vuepress/config.js',
        'apps/my-app/.vuepress/styles/palette.scss',
        'apps/my-app/.vuepress/styles/index.scss',
        'apps/my-app/.vuepress/components/OtherComponent.vue',
        'apps/my-app/.vuepress/components/demo-component.vue',
        'apps/my-app/.vuepress/components/Foo/Bar.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      expect(appTree.read('.gitignore').toString()).toContain(stripIndents`
        # Generated VuePress files
        .cache/
        .temp/
      `);

      expect(appTree.read('.prettierignore').toString()).toContain('.temp/');
    });
  });
});
