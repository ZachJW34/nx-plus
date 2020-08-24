import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';
import { LibrarySchematicSchema } from './schema';

describe('library schematic', () => {
  let appTree: Tree;
  const options: LibrarySchematicSchema = {
    name: 'my-lib',
    unitTestRunner: 'jest',
    skipFormat: false,
    publishable: false,
    skipTsConfig: false,
  };

  const testRunner = new SchematicTestRunner(
    '@nx-plus/vue',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should update workspace.json and tsconfig.base.json', async () => {
    const tree = await testRunner
      .runSchematicAsync('lib', options, appTree)
      .toPromise();
    const workspaceJson = readJsonInTree(tree, 'workspace.json');
    const { lint, test } = workspaceJson.projects['my-lib'].architect;

    expect(workspaceJson.projects['my-lib'].root).toBe('libs/my-lib');
    expect(workspaceJson.projects['my-lib'].sourceRoot).toBe('libs/my-lib/src');
    expect(lint.builder).toBe('@nrwl/linter:lint');
    expect(test.builder).toBe('@nrwl/jest:jest');

    const tsConfigBaseJson = readJsonInTree(tree, 'tsconfig.base.json');
    expect(tsConfigBaseJson.compilerOptions.paths['@proj/my-lib']).toEqual([
      'libs/my-lib/src/index.ts',
    ]);
  });

  it('should generate files', async () => {
    const tree = await testRunner
      .runSchematicAsync('lib', options, appTree)
      .toPromise();

    [
      'libs/my-lib/tsconfig.spec.json',
      'libs/my-lib/tsconfig.json',
      'libs/my-lib/tsconfig.lib.json',
      'libs/my-lib/jest.config.js',
      'libs/my-lib/.eslintrc.js',
      'libs/my-lib/tests/unit/example.spec.ts',
      'libs/my-lib/src/shims-tsx.d.ts',
      'libs/my-lib/src/shims-vue.d.ts',
      'libs/my-lib/src/index.ts',
      'libs/my-lib/src/lib/HelloWorld.vue',
    ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

    const tsconfigLibJson = readJsonInTree(
      tree,
      'libs/my-lib/tsconfig.lib.json'
    );
    expect(tsconfigLibJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = tree.readContent('libs/my-lib/.eslintrc.js');
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

    const tsConfigJson = readJsonInTree(tree, 'libs/my-lib/tsconfig.json');
    expect(tsConfigJson.references[1]).toEqual({
      path: './tsconfig.spec.json',
    });
  });

  describe('--publishable', () => {
    it('should generate publishable configuration', async () => {
      const tree = await testRunner
        .runSchematicAsync('lib', { ...options, publishable: true }, appTree)
        .toPromise();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');
      const { build } = workspaceJson.projects['my-lib'].architect;

      expect(build.builder).toBe('@nx-plus/vue:library');
      expect(build.options).toEqual({
        dest: `dist/libs/my-lib`,
        entry: `libs/my-lib/src/index.ts`,
        tsConfig: `libs/my-lib/tsconfig.lib.json`,
      });

      expect(JSON.parse(tree.readContent('libs/my-lib/package.json'))).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });
    });
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      const tree = await testRunner
        .runSchematicAsync(
          'lib',
          { ...options, unitTestRunner: 'none' },
          appTree
        )
        .toPromise();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');

      expect(workspaceJson.projects['my-lib'].architect.test).toBeUndefined();

      [
        'libs/my-lib/tsconfig.spec.json',
        'libs/my-lib/jest.config.js',
        'libs/my-lib/tests/unit/example.spec.ts',
      ].forEach((path) => expect(tree.exists(path)).toBeFalsy());

      const tsconfigLibJson = readJsonInTree(
        tree,
        'libs/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toBeUndefined();

      expect(tree.readContent('libs/my-lib/.eslintrc.js')).not.toContain(
        'overrides:'
      );

      const tsConfigJson = readJsonInTree(tree, 'libs/my-lib/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json and tsconfig.base.json', async () => {
      const tree = await testRunner
        .runSchematicAsync(
          'lib',
          { ...options, directory: 'subdir', publishable: true },
          appTree
        )
        .toPromise();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');
      const { build } = workspaceJson.projects['subdir-my-lib'].architect;
      expect(build.options).toEqual({
        dest: `dist/libs/subdir/my-lib`,
        entry: `libs/subdir/my-lib/src/index.ts`,
        tsConfig: `libs/subdir/my-lib/tsconfig.lib.json`,
      });

      expect(workspaceJson.projects['subdir-my-lib'].root).toBe(
        'libs/subdir/my-lib'
      );
      expect(workspaceJson.projects['subdir-my-lib'].sourceRoot).toBe(
        'libs/subdir/my-lib/src'
      );

      const tsConfigBaseJson = readJsonInTree(tree, 'tsconfig.base.json');
      expect(
        tsConfigBaseJson.compilerOptions.paths['@proj/subdir/my-lib']
      ).toEqual(['libs/subdir/my-lib/src/index.ts']);
    });

    it('should generate files', async () => {
      const tree = await testRunner
        .runSchematicAsync(
          'lib',
          { ...options, directory: 'subdir', publishable: true },
          appTree
        )
        .toPromise();

      [
        'libs/subdir/my-lib/tsconfig.spec.json',
        'libs/subdir/my-lib/tsconfig.json',
        'libs/subdir/my-lib/tsconfig.lib.json',
        'libs/subdir/my-lib/jest.config.js',
        'libs/subdir/my-lib/.eslintrc.js',
        'libs/subdir/my-lib/tests/unit/example.spec.ts',
        'libs/subdir/my-lib/src/shims-tsx.d.ts',
        'libs/subdir/my-lib/src/shims-vue.d.ts',
        'libs/subdir/my-lib/src/index.ts',
        'libs/subdir/my-lib/src/lib/HelloWorld.vue',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());

      const tsconfigLibJson = readJsonInTree(
        tree,
        'libs/subdir/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = tree.readContent('libs/subdir/my-lib/.eslintrc.js');
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
        JSON.parse(tree.readContent('libs/subdir/my-lib/package.json'))
      ).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });

      const tsConfigJson = readJsonInTree(
        tree,
        'libs/subdir/my-lib/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });
});
