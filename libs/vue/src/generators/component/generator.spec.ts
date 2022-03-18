import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { toClassName } from '@nrwl/workspace';
import { applicationGenerator } from '../application/generator';
import { options as _appOptions } from '../application/generator.spec';
import { libraryGenerator } from '../library/generator';
import { options as _libraryOptions } from '../library/generator.spec';
import { componentGenerator } from './generator';
import { ComponentGeneratorSchema } from './schema';

const appOptions = { ..._appOptions, vueVersion: 3 };
const libOptions = { ..._libraryOptions, vueVersion: 3 };
const styles = ['scss', 'stylus', 'less'] as const;

describe('component schematic', () => {
  let appTree: Tree;

  describe('for app', () => {
    beforeEach(async () => {
      appTree = createTreeWithEmptyWorkspace();
      await applicationGenerator(appTree, appOptions);
    });

    describe('styles', () => {
      let options: ComponentGeneratorSchema = {
        name: 'my-component',
        project: 'my-app',
        style: 'css',
      };

      it.each(styles)('should set correct style %s', async (style) => {
        options = {
          ...options,
          style,
        };

        await componentGenerator(appTree, options);

        const { sourceRoot } = readProjectConfiguration(appTree, 'my-app');

        const componentPath = `${sourceRoot}/${toClassName(options.name)}.vue`;

        const fileEntry = appTree.read(componentPath).toString();

        expect(fileEntry).toContain(`lang="${style}"`);
      });
    });

    describe('directory', () => {
      const options: ComponentGeneratorSchema = {
        name: 'my-component',
        project: 'my-app',
        directory: 'ui',
        style: 'css',
      };

      it('should set directory when used', async () => {
        await componentGenerator(appTree, options);

        const workspaceJson = readJson(appTree, 'workspace.json');
        const projectRoot = workspaceJson.projects['my-app'].sourceRoot;

        const componentPath = `${projectRoot}/ui/${toClassName(
          options.name
        )}.vue`;

        const fileEntry = appTree.read(componentPath).toString();

        expect(fileEntry).toMatchSnapshot();
      });
    });
  });

  describe('for library', () => {
    beforeEach(async () => {
      appTree = createTreeWithEmptyWorkspace();
      await libraryGenerator(appTree, libOptions);
    });

    describe('styles', () => {
      let options: ComponentGeneratorSchema = {
        name: 'my-component',
        project: 'my-lib',
        style: 'css',
      };

      it.each(styles)('should set correct style %s', async (style) => {
        options = {
          ...options,
          style,
        };

        await componentGenerator(appTree, options);

        const { sourceRoot } = readProjectConfiguration(appTree, 'my-lib');

        const componentPath = `${sourceRoot}/lib/${toClassName(
          options.name
        )}.vue`;

        const fileEntry = appTree.read(componentPath).toString();

        expect(fileEntry).toContain(`lang="${style}"`);
      });
    });

    describe('directory', () => {
      const options: ComponentGeneratorSchema = {
        name: 'my-component',
        project: 'my-lib',
        directory: 'components',
        style: 'css',
      };

      it('should set directory when used', async () => {
        await componentGenerator(appTree, options);

        const { sourceRoot } = readProjectConfiguration(appTree, 'my-lib');

        const componentPath = `${sourceRoot}/lib/components/${toClassName(
          options.name
        )}.vue`;

        expect(appTree.exists(componentPath)).toBeTruthy();
      });
    });
  });
});
