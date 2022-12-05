import { Tree, readProjectConfiguration, stripIndents } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

const generatedFiles = [
  'docs/tutorial-basics/create-a-document.md',
  'docs/tutorial-basics/create-a-page.md',
  'docs/tutorial-basics/deploy-your-site.md',
  'docs/tutorial-basics/markdown-features.mdx',
  'docs/tutorial-basics/_category_.json',
  'docs/tutorial-basics/congratulations.md',
  'docs/tutorial-basics/create-a-blog-post.md',
  'docs/intro.md',
  'docs/tutorial-extras/translate-your-site.md',
  'docs/tutorial-extras/_category_.json',
  'docs/tutorial-extras/manage-docs-versions.md',
  'blog/2021-08-01-mdx-blog-post.mdx',
  'blog/2019-05-29-long-blog-post.md',
  'blog/2021-08-26-welcome/docusaurus-plushie-banner.jpeg',
  'blog/2021-08-26-welcome/index.md',
  'blog/authors.yml',
  'blog/2019-05-28-first-blog-post.md',
  'babel.config.js',
  'static/img/undraw_docusaurus_mountain.svg',
  'static/img/favicon.ico',
  'static/img/undraw_docusaurus_react.svg',
  'static/img/docusaurus.png',
  'static/img/undraw_docusaurus_tree.svg',
  'static/img/logo.svg',
  'docusaurus.config.js',
  'tsconfig.json',
  'sidebars.js',
  'src/css/custom.css',
  'src/components/HomepageFeatures/styles.module.css',
  'src/components/HomepageFeatures/index.tsx',
  'src/pages/index.tsx',
  'src/pages/index.module.css',
  'src/pages/markdown-page.md',
];

describe('docusaurus schematic', () => {
  let appTree: Tree;
  const options: ApplicationGeneratorSchema = {
    name: 'my-app',
    skipFormat: false,
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
    appTree.write('.gitignore', '');
    appTree.write('.prettierignore', '');
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-app');
    const { build, serve } = config.targets || {};

    expect(config.root).toBe('apps/my-app');
    expect(build.executor).toBe('@nx-plus/docusaurus:browser');
    expect(build.options).toEqual({ outputPath: 'dist/apps/my-app' });
    expect(serve.executor).toBe('@nx-plus/docusaurus:dev-server');
    expect(serve.options).toEqual({
      port: 3000,
    });
  });

  it('should generate files', async () => {
    await applicationGenerator(appTree, options);

    generatedFiles
      .map((file) => `apps/my-app/${file}`)
      .forEach((path) => expect(appTree.exists(path)).toBeTruthy());

    expect(appTree.read('.gitignore', 'utf-8')).toContain(stripIndents`
      # Generated Docusaurus files
      .docusaurus/
      .cache-loader/
    `);

    expect(appTree.read('.prettierignore', 'utf-8')).toContain('.docusaurus/');
  });

  describe('--directory', () => {
    it('should update workspace.json and generate files', async () => {
      await applicationGenerator(appTree, { ...options, directory: 'subdir' });

      const config = readProjectConfiguration(appTree, 'subdir-my-app');
      const { build } = config.targets || {};

      expect(config.root).toBe('apps/subdir/my-app');
      expect(build.options).toEqual({ outputPath: 'dist/apps/subdir/my-app' });

      generatedFiles
        .map((file) => `apps/subdir/my-app/${file}`)
        .forEach((path) => expect(appTree.exists(path)).toBeTruthy());
    });
  });

  describe('workspaceLayout', () => {
    beforeEach(() => {
      const nxJson = JSON.parse(appTree.read('nx.json', 'utf-8') || '');
      const updateNxJson = {
        ...nxJson,
        workspaceLayout: { appsDir: 'custom-apps-dir' },
      };
      appTree.write('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json and generate files', async () => {
      await applicationGenerator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-app');
      const { build } = config.targets || {};

      expect(config.root).toBe('custom-apps-dir/my-app');
      expect(build.options).toEqual({
        outputPath: 'dist/custom-apps-dir/my-app',
      });

      generatedFiles
        .map((file) => `custom-apps-dir/my-app/${file}`)
        .forEach((path) => expect(appTree.exists(path)).toBeTruthy());
    });
  });
});
