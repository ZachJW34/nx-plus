import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

export const options: ApplicationGeneratorSchema = {
  name: 'my-app',
  unitTestRunner: 'jest',
  e2eTestRunner: 'cypress',
  routing: false,
  style: 'css',
  vueVersion: 2,
  skipFormat: false,
  babel: false,
};

describe('application schematic', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);

    const {
      root,
      sourceRoot,
      targets: { build, serve, test, lint },
    } = readProjectConfiguration(appTree, 'my-app');

    expect(root).toBe('apps/my-app');
    expect(sourceRoot).toBe('apps/my-app/src');
    expect(build.executor).toBe('@nx-plus/vue:browser');
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
    expect(serve.executor).toBe('@nx-plus/vue:dev-server');
    expect(serve.options).toEqual({
      browserTarget: 'my-app:build',
    });
    expect(serve.configurations.production).toEqual({
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
      'apps/my-app/tsconfig.app.json',
      'apps/my-app/jest.config.js',
      'apps/my-app/.eslintrc.json',
      'apps/my-app/tests/unit/example.spec.ts',
      'apps/my-app/src/shims-vue.d.ts',
      'apps/my-app/src/main.ts',
      'apps/my-app/src/App.vue',
      'apps/my-app/src/components/HelloWorld.vue',
      'apps/my-app/src/assets/logo.png',
      'apps/my-app/public/index.html',
    ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

    const tsconfigAppJson = readJson(appTree, 'apps/my-app/tsconfig.app.json');
    expect(tsconfigAppJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = appTree.read('apps/my-app/.eslintrc.json').toString();
    expect(eslintConfig).toContain(`{
  "extends": [
    "../../eslint.json",
    "plugin:vue/essential",
    "@vue/typescript/recommended",
    "prettier"
  ],
  "rules": {},
  "env": {
    "node": true
  },
  "overrides": [
    {
      "files": [
        "**/*.spec.{j,t}s?(x)"
      ],
      "env": {
        "jest": true
      }
    }
  ]
}`);

    expect(
      appTree.read('apps/my-app-e2e/src/integration/app.spec.ts').toString()
    ).toContain("'Welcome to Your Vue.js + TypeScript App'");

    expect(appTree.read('apps/my-app/src/App.vue').toString()).toContain(`
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`);

    expect(appTree.read('apps/my-app/src/components/HelloWorld.vue').toString())
      .toContain(`
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
</style>`);

    const tsConfigJson = readJson(appTree, 'apps/my-app/tsconfig.json');
    expect(tsConfigJson.references[1]).toEqual({
      path: './tsconfig.spec.json',
    });
  });

  it('should add postinstall script', async () => {
    await applicationGenerator(appTree, options);

    expect(readJson(appTree, 'package.json').scripts.postinstall).toBe(
      'node node_modules/@nx-plus/vue/patch-nx-dep-graph.js'
    );
  });

  describe('--style', () => {
    it('should generate a scss style block', async () => {
      await applicationGenerator(appTree, { ...options, style: 'scss' });

      expect(appTree.read('apps/my-app/src/App.vue').toString()).toContain(
        '<style lang="scss">'
      );
      expect(
        appTree.read('apps/my-app/src/components/HelloWorld.vue').toString()
      ).toContain('<style scoped lang="scss">');
    });

    it('should generate a less style block', async () => {
      await applicationGenerator(appTree, { ...options, style: 'less' });

      expect(appTree.read('apps/my-app/src/App.vue').toString()).toContain(
        '<style lang="less">'
      );
      expect(
        appTree.read('apps/my-app/src/components/HelloWorld.vue').toString()
      ).toContain('<style scoped lang="less">');
    });

    it('should generate a stylus style block', async () => {
      await applicationGenerator(appTree, { ...options, style: 'stylus' });

      expect(appTree.read('apps/my-app/src/App.vue').toString()).toContain(`
<style lang="stylus">
#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  margin-top 60px
</style>`);

      expect(
        appTree.read('apps/my-app/src/components/HelloWorld.vue').toString()
      ).toContain(`
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
</style>`);
    });
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

      expect(
        appTree.read('apps/my-app/.eslintrc.json').toString()
      ).not.toContain('"overrides":');

      const tsConfigJson = readJson(appTree, 'apps/my-app/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
    });
  });

  describe('--e2eTestRunner none', () => {
    it('should not generate e2e configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        e2eTestRunner: 'none',
      });
      const workspaceJson = readJson(appTree, 'workspace.json');

      expect(workspaceJson.projects['my-app-e2e']).toBeUndefined();

      const e2eDir = appTree.children('apps/my-app-e2e');
      expect(e2eDir.length).toBe(0);
    });
  });

  describe('--routing', () => {
    it('should generate routing configuration', async () => {
      await applicationGenerator(appTree, { ...options, routing: true });

      const packageJson = readJson(appTree, 'package.json');
      expect(packageJson.dependencies['vue-router']).toBeDefined();

      [
        'apps/my-app/src/views/Home.vue',
        'apps/my-app/src/views/About.vue',
        'apps/my-app/src/router/index.ts',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const main = appTree.read('apps/my-app/src/main.ts').toString();
      expect(main).toContain("import router from './router';");
      expect(main).toContain(`
new Vue({
  router,
  render: h => h(App)
}).$mount('#app');`);

      expect(appTree.read('apps/my-app/src/App.vue').toString()).toContain(`
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />`);

      expect(appTree.read('apps/my-app/src/App.vue').toString()).toContain(`
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
</style>`);
    });
  });

  describe('--babel', () => {
    it('--should generate files', async () => {
      await applicationGenerator(appTree, { ...options, babel: true });

      expect(appTree.exists('apps/my-app/babel.config.js')).toBeTruthy();

      const jestConfig = appTree.read('apps/my-app/jest.config.js').toString();
      expect(jestConfig).toContain(`
    'vue-jest': {
      tsConfig: 'apps/my-app/tsconfig.spec.json',
      babelConfig: 'apps/my-app/babel.config.js',
    },`);
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json', async () => {
      await applicationGenerator(appTree, { ...options, directory: 'subdir' });

      const {
        root,
        sourceRoot,
        targets: { build, serve },
      } = readProjectConfiguration(appTree, 'subdir-my-app');

      expect(root).toBe('apps/subdir/my-app');
      expect(sourceRoot).toBe('apps/subdir/my-app/src');
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
      await applicationGenerator(appTree, { ...options, directory: 'subdir' });

      [
        'apps/subdir/my-app/tsconfig.spec.json',
        'apps/subdir/my-app/tsconfig.json',
        'apps/subdir/my-app/tsconfig.app.json',
        'apps/subdir/my-app/jest.config.js',
        'apps/subdir/my-app/.eslintrc.json',
        'apps/subdir/my-app/tests/unit/example.spec.ts',
        'apps/subdir/my-app/src/shims-vue.d.ts',
        'apps/subdir/my-app/src/main.ts',
        'apps/subdir/my-app/src/App.vue',
        'apps/subdir/my-app/src/components/HelloWorld.vue',
        'apps/subdir/my-app/src/assets/logo.png',
        'apps/subdir/my-app/public/index.html',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const tsconfigAppJson = readJson(
        appTree,
        'apps/subdir/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = appTree
        .read('apps/subdir/my-app/.eslintrc.json')
        .toString();
      expect(eslintConfig).toContain(`{
  "extends": [
    "../../../eslint.json",
    "plugin:vue/essential",
    "@vue/typescript/recommended",
    "prettier"
  ],
  "rules": {},
  "env": {
    "node": true
  },
  "overrides": [
    {
      "files": [
        "**/*.spec.{j,t}s?(x)"
      ],
      "env": {
        "jest": true
      }
    }
  ]
}`);

      expect(
        appTree
          .read('apps/subdir/my-app-e2e/src/integration/app.spec.ts')
          .toString()
      ).toContain("'Welcome to Your Vue.js + TypeScript App'");

      const tsConfigJson = readJson(
        appTree,
        'apps/subdir/my-app/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
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
        sourceRoot,
        targets: { build, serve },
      } = readProjectConfiguration(appTree, 'my-app');

      expect(root).toBe('custom-apps-dir/my-app');
      expect(sourceRoot).toBe('custom-apps-dir/my-app/src');
      expect(build.options).toEqual({
        dest: 'dist/custom-apps-dir/my-app',
        index: 'custom-apps-dir/my-app/public/index.html',
        main: 'custom-apps-dir/my-app/src/main.ts',
        tsConfig: 'custom-apps-dir/my-app/tsconfig.app.json',
      });
      expect(serve.options).toEqual({
        browserTarget: 'my-app:build',
      });
      expect(serve.configurations.production).toEqual({
        browserTarget: 'my-app:build:production',
      });
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, options);

      [
        'custom-apps-dir/my-app/tsconfig.spec.json',
        'custom-apps-dir/my-app/tsconfig.json',
        'custom-apps-dir/my-app/tsconfig.app.json',
        'custom-apps-dir/my-app/jest.config.js',
        'custom-apps-dir/my-app/.eslintrc.json',
        'custom-apps-dir/my-app/tests/unit/example.spec.ts',
        'custom-apps-dir/my-app/src/shims-vue.d.ts',
        'custom-apps-dir/my-app/src/main.ts',
        'custom-apps-dir/my-app/src/App.vue',
        'custom-apps-dir/my-app/src/components/HelloWorld.vue',
        'custom-apps-dir/my-app/src/assets/logo.png',
        'custom-apps-dir/my-app/public/index.html',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const tsconfigAppJson = readJson(
        appTree,
        'custom-apps-dir/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = appTree
        .read('custom-apps-dir/my-app/.eslintrc.json')
        .toString();
      expect(eslintConfig).toContain(`{
  "extends": [
    "../../eslint.json",
    "plugin:vue/essential",
    "@vue/typescript/recommended",
    "prettier"
  ],
  "rules": {},
  "env": {
    "node": true
  },
  "overrides": [
    {
      "files": [
        "**/*.spec.{j,t}s?(x)"
      ],
      "env": {
        "jest": true
      }
    }
  ]
}`);

      expect(
        appTree
          .read('custom-apps-dir/my-app-e2e/src/integration/app.spec.ts')
          .toString()
      ).toContain("'Welcome to Your Vue.js + TypeScript App'");

      const tsConfigJson = readJson(
        appTree,
        'custom-apps-dir/my-app/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });
});
