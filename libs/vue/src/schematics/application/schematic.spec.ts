import { tags } from '@angular-devkit/core';
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
    e2eTestRunner: 'cypress',
    routing: false,
    style: 'css',
    skipFormat: false,
  };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/vue',
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
    expect(build.builder).toBe('@nx-plus/vue:browser');
    expect(build.options).toEqual({
      dest: 'dist/apps/my-app',
      index: 'apps/my-app/public/index.html',
      main: 'apps/my-app/src/main.ts',
      tsConfig: 'apps/my-app/tsconfig.app.json',
    });
    expect(build.configurations.production).toEqual({
      mode: 'production',
      filenameHashing: true,
      productionSourceMap: true,
      css: {
        extract: true,
        sourceMap: false,
      },
    });
    expect(serve.builder).toBe('@nx-plus/vue:dev-server');
    expect(serve.options).toEqual({
      browserTarget: 'my-app:build',
    });
    expect(serve.configurations.production).toEqual({
      browserTarget: 'my-app:build:production',
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
      'apps/my-app/tsconfig.app.json',
      'apps/my-app/jest.config.js',
      'apps/my-app/.eslintrc.js',
      'apps/my-app/tests/unit/example.spec.ts',
      'apps/my-app/src/shims-vue.d.ts',
      'apps/my-app/src/main.ts',
      'apps/my-app/src/App.vue',
      'apps/my-app/src/components/HelloWorld.vue',
      'apps/my-app/src/assets/logo.png',
      'apps/my-app/public/index.html',
    ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

    const tsconfigAppJson = readJsonInTree(
      tree,
      'apps/my-app/tsconfig.app.json'
    );
    expect(tsconfigAppJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = tree.readContent('apps/my-app/.eslintrc.js');
    expect(eslintConfig).toContain(`extends: [
    '../../.eslintrc',
    'plugin:vue/essential',
    '@vue/typescript/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ]`);
    expect(eslintConfig).toContain(`overrides: [
    {
      files: ['**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ]`);

    expect(
      tree.readContent('apps/my-app-e2e/src/integration/app.spec.ts')
    ).toContain("'Welcome to Your Vue.js + TypeScript App'");

    expect(tree.readContent('apps/my-app/src/App.vue'))
      .toContain(tags.stripIndent`
        <style>
        #app {
          font-family: Avenir, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-align: center;
          color: #2c3e50;
          margin-top: 60px;
        }
        </style>
      `);

    expect(tree.readContent('apps/my-app/src/components/HelloWorld.vue'))
      .toContain(tags.stripIndent`
        <style scoped>
        h3 {
          margin: 40px 0 0;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        li {
          display: inline-block;
          margin: 0 10px;
        }
        a {
          color: #42b983;
        }
        </style>
      `);

    const tsConfigJson = readJsonInTree(tree, 'apps/my-app/tsconfig.json');
    expect(tsConfigJson.references[1]).toEqual({
      path: './tsconfig.spec.json',
    });
  });

  it('should add postinstall script', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();

    expect(readJsonInTree(tree, 'package.json').scripts.postinstall).toBe(
      'node node_modules/@nx-plus/vue/patch-nx-dep-graph.js'
    );
  });

  describe('--style', () => {
    it('should generate a scss style block', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, style: 'scss' }, appTree)
        .toPromise();

      expect(tree.readContent('apps/my-app/src/App.vue')).toContain(
        '<style lang="scss">'
      );
      expect(
        tree.readContent('apps/my-app/src/components/HelloWorld.vue')
      ).toContain('<style scoped lang="scss">');
    });

    it('should generate a less style block', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, style: 'less' }, appTree)
        .toPromise();

      expect(tree.readContent('apps/my-app/src/App.vue')).toContain(
        '<style lang="less">'
      );
      expect(
        tree.readContent('apps/my-app/src/components/HelloWorld.vue')
      ).toContain('<style scoped lang="less">');
    });

    it('should generate a stylus style block', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, style: 'stylus' }, appTree)
        .toPromise();

      expect(tree.readContent('apps/my-app/src/App.vue'))
        .toContain(tags.stripIndent`
          <style lang="stylus">
          #app
            font-family Avenir, Helvetica, Arial, sans-serif
            -webkit-font-smoothing antialiased
            -moz-osx-font-smoothing grayscale
            text-align center
            color #2c3e50
            margin-top 60px
          </style>
      `);

      expect(tree.readContent('apps/my-app/src/components/HelloWorld.vue'))
        .toContain(tags.stripIndent`
          <style scoped lang="stylus">
          h3
            margin 40px 0 0

          ul
            list-style-type none
            padding 0

          li
            display inline-block
            margin 0 10px

          a
            color #42b983
          </style>
        `);
    });
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
        'apps/my-app/tests/unit/example.spec.ts',
      ].forEach((path) => expect(tree.exists(path)).toBeFalsy());

      const tsconfigAppJson = readJsonInTree(
        tree,
        'apps/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toBeUndefined();

      expect(tree.readContent('apps/my-app/.eslintrc.js')).not.toContain(
        'overrides:'
      );

      const tsConfigJson = readJsonInTree(tree, 'apps/my-app/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
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

  describe('--routing', () => {
    it('should generate routing configuration', async () => {
      const tree = await testRunner
        .runSchematicAsync('app', { ...options, routing: true }, appTree)
        .toPromise();

      const packageJson = readJsonInTree(tree, 'package.json');
      expect(packageJson.dependencies['vue-router']).toBeDefined();

      [
        'apps/my-app/src/views/Home.vue',
        'apps/my-app/src/views/About.vue',
        'apps/my-app/src/router/index.ts',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

      const main = tree.readContent('apps/my-app/src/main.ts');
      expect(main).toContain("import router from './router';");
      expect(main).toContain(tags.stripIndent`
        new Vue({
          router,
          render: (h) => h(App),
        }).$mount('#app');
      `);

      expect(tree.readContent('apps/my-app/src/App.vue'))
        .toContain(`<div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />`);

      expect(tree.readContent('apps/my-app/src/App.vue'))
        .toContain(tags.stripIndent`
          <style>
          #app {
            font-family: Avenir, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-align: center;
            color: #2c3e50;
          }

          #nav {
            padding: 30px;
          }

          #nav a {
            font-weight: bold;
            color: #2c3e50;
          }

          #nav a.router-link-exact-active {
            color: #42b983;
          }
          </style>
        `);
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
        dest: 'dist/apps/subdir/my-app',
        index: 'apps/subdir/my-app/public/index.html',
        main: 'apps/subdir/my-app/src/main.ts',
        tsConfig: 'apps/subdir/my-app/tsconfig.app.json',
      });
      expect(serve.options).toEqual({
        browserTarget: 'subdir-my-app:build',
      });
      expect(serve.configurations.production).toEqual({
        browserTarget: 'subdir-my-app:build:production',
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
        'apps/subdir/my-app/.eslintrc.js',
        'apps/subdir/my-app/tests/unit/example.spec.ts',
        'apps/subdir/my-app/src/shims-vue.d.ts',
        'apps/subdir/my-app/src/main.ts',
        'apps/subdir/my-app/src/App.vue',
        'apps/subdir/my-app/src/components/HelloWorld.vue',
        'apps/subdir/my-app/src/assets/logo.png',
        'apps/subdir/my-app/public/index.html',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

      const tsconfigAppJson = readJsonInTree(
        tree,
        'apps/subdir/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = tree.readContent('apps/subdir/my-app/.eslintrc.js');
      expect(eslintConfig).toContain(`extends: [
    '../../../.eslintrc',
    'plugin:vue/essential',
    '@vue/typescript/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ]`);
      expect(eslintConfig).toContain(`overrides: [
    {
      files: ['**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ]`);

      expect(
        tree.readContent('apps/subdir/my-app-e2e/src/integration/app.spec.ts')
      ).toContain("'Welcome to Your Vue.js + TypeScript App'");

      const tsConfigJson = readJsonInTree(
        tree,
        'apps/subdir/my-app/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });
});
