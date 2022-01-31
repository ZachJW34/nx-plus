import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { libraryGenerator } from './generator';
import { LibraryGeneratorSchema } from './schema';

export const options: LibraryGeneratorSchema = {
  name: 'my-lib',
  unitTestRunner: 'jest',
  skipFormat: false,
  publishable: false,
  vueVersion: 2,
  skipTsConfig: false,
  babel: false,
};

describe('library schematic', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json and tsconfig.base.json', async () => {
    await libraryGenerator(appTree, options);

    const {
      root,
      sourceRoot,
      targets: { test, lint },
    } = readProjectConfiguration(appTree, 'my-lib');

    expect(root).toBe('libs/my-lib');
    expect(sourceRoot).toBe('libs/my-lib/src');
    expect(lint.executor).toBe('@nrwl/linter:eslint');
    expect(test.executor).toBe('@nrwl/jest:jest');

    const tsConfigBaseJson = readJson(appTree, 'tsconfig.base.json');
    expect(tsConfigBaseJson.compilerOptions.paths['@proj/my-lib']).toEqual([
      'libs/my-lib/src/index.ts',
    ]);
  });

  it('should generate files', async () => {
    await libraryGenerator(appTree, options);

    [
      'libs/my-lib/tsconfig.spec.json',
      'libs/my-lib/tsconfig.json',
      'libs/my-lib/tsconfig.lib.json',
      'libs/my-lib/jest.config.js',
      'libs/my-lib/.eslintrc.json',
      'libs/my-lib/tests/unit/example.spec.ts',
      'libs/my-lib/src/shims-tsx.d.ts',
      'libs/my-lib/src/shims-vue.d.ts',
      'libs/my-lib/src/index.ts',
      'libs/my-lib/src/lib/HelloWorld.vue',
    ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

    const tsconfigLibJson = readJson(appTree, 'libs/my-lib/tsconfig.lib.json');
    expect(tsconfigLibJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = appTree.read('libs/my-lib/.eslintrc.json').toString();
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

    const tsConfigJson = readJson(appTree, 'libs/my-lib/tsconfig.json');
    expect(tsConfigJson.references[1]).toEqual({
      path: './tsconfig.spec.json',
    });
  });

  describe('--publishable', () => {
    it('should generate publishable configuration', async () => {
      await libraryGenerator(appTree, { ...options, publishable: true });

      const workspaceJson = readJson(appTree, 'workspace.json');
      const { build } = workspaceJson.projects['my-lib'].architect;

      expect(build.builder).toBe('@nx-plus/vue:library');
      expect(build.options).toEqual({
        dest: `dist/libs/my-lib`,
        entry: `libs/my-lib/src/index.ts`,
        tsConfig: `libs/my-lib/tsconfig.lib.json`,
      });

      expect(
        JSON.parse(appTree.read('libs/my-lib/package.json').toString())
      ).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });
    });
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      await libraryGenerator(appTree, { ...options, unitTestRunner: 'none' });

      const workspaceJson = readJson(appTree, 'workspace.json');

      expect(workspaceJson.projects['my-lib'].architect.test).toBeUndefined();

      [
        'libs/my-lib/tsconfig.spec.json',
        'libs/my-lib/jest.config.js',
        'libs/my-lib/tests/unit/example.spec.ts',
      ].forEach((path) => expect(appTree.exists(path)).toBeFalsy());

      const tsconfigLibJson = readJson(
        appTree,
        'libs/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toBeUndefined();

      expect(
        appTree.read('libs/my-lib/.eslintrc.json').toString()
      ).not.toContain('"overrides":');

      const tsConfigJson = readJson(appTree, 'libs/my-lib/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
    });
  });

  describe('--babel', () => {
    it('--should generate files', async () => {
      await libraryGenerator(appTree, { ...options, babel: true });

      expect(appTree.exists('libs/my-lib/babel.config.js')).toBeTruthy();

      const jestConfig = appTree.read('libs/my-lib/jest.config.js').toString();
      expect(jestConfig).toContain(`
    'vue-jest': {
      tsConfig: 'libs/my-lib/tsconfig.spec.json',
      babelConfig: 'libs/my-lib/babel.config.js',
    },`);
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json and tsconfig.base.json', async () => {
      await libraryGenerator(appTree, {
        ...options,
        directory: 'subdir',
        publishable: true,
      });

      const {
        root,
        sourceRoot,
        targets: { build },
      } = readProjectConfiguration(appTree, 'subdir-my-lib');
      expect(build.options).toEqual({
        dest: `dist/libs/subdir/my-lib`,
        entry: `libs/subdir/my-lib/src/index.ts`,
        tsConfig: `libs/subdir/my-lib/tsconfig.lib.json`,
      });

      expect(root).toBe('libs/subdir/my-lib');
      expect(sourceRoot).toBe('libs/subdir/my-lib/src');

      const tsConfigBaseJson = readJson(appTree, 'tsconfig.base.json');
      expect(
        tsConfigBaseJson.compilerOptions.paths['@proj/subdir/my-lib']
      ).toEqual(['libs/subdir/my-lib/src/index.ts']);
    });

    it('should generate files', async () => {
      await libraryGenerator(appTree, {
        ...options,
        directory: 'subdir',
        publishable: true,
      });

      [
        'libs/subdir/my-lib/tsconfig.spec.json',
        'libs/subdir/my-lib/tsconfig.json',
        'libs/subdir/my-lib/tsconfig.lib.json',
        'libs/subdir/my-lib/jest.config.js',
        'libs/subdir/my-lib/.eslintrc.json',
        'libs/subdir/my-lib/tests/unit/example.spec.ts',
        'libs/subdir/my-lib/src/shims-tsx.d.ts',
        'libs/subdir/my-lib/src/shims-vue.d.ts',
        'libs/subdir/my-lib/src/index.ts',
        'libs/subdir/my-lib/src/lib/HelloWorld.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const tsconfigLibJson = readJson(
        appTree,
        'libs/subdir/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = appTree
        .read('libs/subdir/my-lib/.eslintrc.json')
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
        JSON.parse(appTree.read('libs/subdir/my-lib/package.json').toString())
      ).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });

      const tsConfigJson = readJson(
        appTree,
        'libs/subdir/my-lib/tsconfig.json'
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
        workspaceLayout: { libsDir: 'custom-libs-dir' },
      };
      appTree.write('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json and tsconfig.base.json', async () => {
      await libraryGenerator(appTree, { ...options, publishable: true });

      const workspaceJson = readJson(appTree, 'workspace.json');
      const { build } = workspaceJson.projects['my-lib'].architect;
      expect(build.options).toEqual({
        dest: `dist/custom-libs-dir/my-lib`,
        entry: `custom-libs-dir/my-lib/src/index.ts`,
        tsConfig: `custom-libs-dir/my-lib/tsconfig.lib.json`,
      });

      expect(workspaceJson.projects['my-lib'].root).toBe(
        'custom-libs-dir/my-lib'
      );
      expect(workspaceJson.projects['my-lib'].sourceRoot).toBe(
        'custom-libs-dir/my-lib/src'
      );

      const tsConfigBaseJson = readJson(appTree, 'tsconfig.base.json');
      expect(tsConfigBaseJson.compilerOptions.paths['@proj/my-lib']).toEqual([
        'custom-libs-dir/my-lib/src/index.ts',
      ]);
    });

    it('should generate files', async () => {
      await libraryGenerator(appTree, { ...options, publishable: true });

      [
        'custom-libs-dir/my-lib/tsconfig.spec.json',
        'custom-libs-dir/my-lib/tsconfig.json',
        'custom-libs-dir/my-lib/tsconfig.lib.json',
        'custom-libs-dir/my-lib/jest.config.js',
        'custom-libs-dir/my-lib/.eslintrc.json',
        'custom-libs-dir/my-lib/tests/unit/example.spec.ts',
        'custom-libs-dir/my-lib/src/shims-tsx.d.ts',
        'custom-libs-dir/my-lib/src/shims-vue.d.ts',
        'custom-libs-dir/my-lib/src/index.ts',
        'custom-libs-dir/my-lib/src/lib/HelloWorld.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const tsconfigLibJson = readJson(
        appTree,
        'custom-libs-dir/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = appTree
        .read('custom-libs-dir/my-lib/.eslintrc.json')
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

      expect(readJson(appTree, 'custom-libs-dir/my-lib/package.json')).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });

      const tsConfigJson = readJson(
        appTree,
        'custom-libs-dir/my-lib/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });
});
