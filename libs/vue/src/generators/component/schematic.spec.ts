import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';

import { ComponentSchematicSchema, Style } from './schema';
import { readJsonInTree, toClassName } from '@nrwl/workspace';
import { ApplicationSchematicSchema } from '../application/schema';

describe('component schematic', () => {
  let appTree: Tree;

  describe('for app', () => {
    beforeEach(async () => {
      appTree = createEmptyWorkspace(Tree.empty());

      const appOptions: ApplicationSchematicSchema = {
        name: 'my-app',
        unitTestRunner: 'jest',
        e2eTestRunner: 'cypress',
        routing: false,
        style: 'css',
        vueVersion: 3,
        skipFormat: false,
        babel: false,
      };
      const appTestRunner = new SchematicTestRunner(
        '@nx-plus/vue',
        join(__dirname, '../../../collection.json')
      );

      await appTestRunner
        .runSchematicAsync('application', appOptions, appTree)
        .toPromise();
    });

    describe('styles', () => {
      let options: ComponentSchematicSchema = {
        name: 'my-component',
        project: 'my-app',
        style: 'css',
      };

      const componentTestRunner = new SchematicTestRunner(
        '@nx-plus/vue',
        join(__dirname, '../../../collection.json')
      );

      it.each(['scss' as Style, 'styl' as Style, 'less' as Style])(
        'should set correct style %s',
        async (style) => {
          options = {
            ...options,
            style,
          };

          const tree = await componentTestRunner
            .runSchematicAsync('component', options, appTree)
            .toPromise();

          const workspaceJson = readJsonInTree(tree, 'workspace.json');
          const projectRoot = workspaceJson.projects['my-app'].sourceRoot;

          const componentPath = `${projectRoot}/${toClassName(
            options.name
          )}.vue`;

          const fileEntry = tree.get(componentPath).content.toString();

          expect(fileEntry).toContain(`lang="${style}"`);
        }
      );
    });

    describe('directory', () => {
      const options: ComponentSchematicSchema = {
        name: 'my-component',
        project: 'my-app',
        directory: 'ui',
        style: 'css',
      };

      const componentTestRunner = new SchematicTestRunner(
        '@nx-plus/vue',
        join(__dirname, '../../../collection.json')
      );

      it('should set directory when used', async () => {
        const tree = await componentTestRunner
          .runSchematicAsync('component', options, appTree)
          .toPromise();

        const workspaceJson = readJsonInTree(tree, 'workspace.json');
        const projectRoot = workspaceJson.projects['my-app'].sourceRoot;

        const componentPath = `${projectRoot}/ui/${toClassName(
          options.name
        )}.vue`;

        const fileEntry = tree.get(componentPath).content.toString();

        expect(fileEntry).toMatchSnapshot();
      });
    });
  });

  describe('for library', () => {
    beforeEach(async () => {
      appTree = createEmptyWorkspace(Tree.empty());

      const libOptions = {
        name: 'my-lib',
        unitTestRunner: 'jest',
        skipFormat: false,
        publishable: false,
        vueVersion: 3,
        skipTsConfig: false,
      };
      const libTestRunner = new SchematicTestRunner(
        '@nx-plus/vue',
        join(__dirname, '../../../collection.json')
      );

      await libTestRunner
        .runSchematicAsync('lib', libOptions, appTree)
        .toPromise();
    });

    describe('styles', () => {
      let options: ComponentSchematicSchema = {
        name: 'my-component',
        project: 'my-lib',
        style: 'css',
      };

      const componentTestRunner = new SchematicTestRunner(
        '@nx-plus/vue',
        join(__dirname, '../../../collection.json')
      );

      it.each(['scss' as Style, 'styl' as Style, 'less' as Style])(
        'should set correct style %s',
        async (style) => {
          options = {
            ...options,
            style,
          };

          const tree = await componentTestRunner
            .runSchematicAsync('component', options, appTree)
            .toPromise();

          const workspaceJson = readJsonInTree(tree, 'workspace.json');
          const projectRoot = workspaceJson.projects['my-lib'].sourceRoot;

          const componentPath = `${projectRoot}/lib/${toClassName(
            options.name
          )}.vue`;

          const fileEntry = tree.get(componentPath).content.toString();

          expect(fileEntry).toContain(`lang="${style}"`);
        }
      );
    });

    describe('directory', () => {
      const options: ComponentSchematicSchema = {
        name: 'my-component',
        project: 'my-lib',
        directory: 'components',
        style: 'css',
      };

      const componentTestRunner = new SchematicTestRunner(
        '@nx-plus/vue',
        join(__dirname, '../../../collection.json')
      );

      it('should set directory when used', async () => {
        const tree = await componentTestRunner
          .runSchematicAsync('component', options, appTree)
          .toPromise();

        const workspaceJson = readJsonInTree(tree, 'workspace.json');
        const projectRoot = workspaceJson.projects['my-lib'].sourceRoot;

        const componentPath = `${projectRoot}/lib/components/${toClassName(
          options.name
        )}.vue`;

        expect(tree.exists(componentPath)).toBeTruthy();
      });
    });
  });
});
