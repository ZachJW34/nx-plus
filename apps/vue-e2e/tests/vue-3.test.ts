import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { runNxProdCommandAsync, testGeneratedApp } from './utils';

describe('vue 3 e2e', () => {
  describe('app', () => {
    it('should generate app', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(
        `generate @nx-plus/vue:app ${appName} --vueVersion 3`
      );

      await testGeneratedApp(appName, {
        lint: true,
        test: true,
        e2e: true,
        build: true,
        buildProd: true,
      });

      done();
    }, 300000);

    describe('--routing', () => {
      it('should generate app with routing', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --vueVersion 3 --routing`
        );

        await testGeneratedApp(appName, {
          lint: true,
          test: false,
          e2e: true,
          build: true,
          buildProd: true,
        });

        expect(() =>
          checkFilesExist(
            `dist/apps/${appName}/js/about.js`,
            `dist/apps/${appName}/js/about.js.map`
          )
        ).not.toThrow();

        done();
      }, 300000);
    });

    describe('vuex', () => {
      it('should generate app and add vuex', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --vueVersion 3`
        );
        await runNxCommandAsync(`generate @nx-plus/vue:vuex ${appName}`);

        await testGeneratedApp(appName, {
          lint: true,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });

        done();
      }, 300000);
    });

    it('should generate app with routing and add vuex', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(
        `generate @nx-plus/vue:app ${appName} --vueVersion 3 --routing`
      );
      await runNxCommandAsync(`generate @nx-plus/vue:vuex ${appName}`);

      await testGeneratedApp(appName, {
        lint: true,
        test: false,
        e2e: true,
        build: true,
        buildProd: true,
      });

      expect(() =>
        checkFilesExist(
          `dist/apps/${appName}/js/about.js`,
          `dist/apps/${appName}/js/about.js.map`
        )
      ).not.toThrow();

      done();
    }, 300000);

    it('should report lint error in App.vue', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(
        `generate @nx-plus/vue:app ${appName} --vueVersion 3`
      );

      updateFile(
        `apps/${appName}/src/App.vue`,
        '<script lang="ts">let myVar: {}</script>'
      );

      const result = await runNxCommandAsync(`lint ${appName}`, {
        silenceError: true,
      });
      expect(result.stderr).toContain('Lint errors found in the listed files.');

      done();
    }, 300000);
  });

  describe('library', () => {
    it('should generate lib', async (done) => {
      const lib = uniq('lib');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(
        `generate @nx-plus/vue:lib ${lib} --vueVersion 3`
      );

      const lintResult = await runNxCommandAsync(`lint ${lib}`);
      expect(lintResult.stdout).toContain('All files pass linting.');

      const testResult = await runNxCommandAsync(`test ${lib}`);
      expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);

      done();
    }, 300000);

    it('should generate publishable lib', async (done) => {
      const lib = uniq('lib');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(
        `generate @nx-plus/vue:lib ${lib} --vueVersion 3 --publishable`
      );

      let buildResult = await runNxProdCommandAsync(`build ${lib}`);
      expect(buildResult.stdout).toContain('Compiled successfully');
      expect(() =>
        checkFilesExist(
          `dist/libs/${lib}/demo.html`,
          `dist/libs/${lib}/${lib}.common.js`,
          `dist/libs/${lib}/${lib}.common.js.map`,
          `dist/libs/${lib}/${lib}.umd.js`,
          `dist/libs/${lib}/${lib}.umd.js.map`,
          `dist/libs/${lib}/${lib}.umd.min.js`,
          `dist/libs/${lib}/${lib}.umd.min.js.map`,
          `dist/libs/${lib}/package.json`,
          `dist/libs/${lib}/README.md`
        )
      ).not.toThrow();

      buildResult = await runNxProdCommandAsync(`build ${lib} --name new-name`);
      expect(() =>
        checkFilesExist(
          `dist/libs/${lib}/new-name.common.js`,
          `dist/libs/${lib}/new-name.common.js.map`,
          `dist/libs/${lib}/new-name.umd.js`,
          `dist/libs/${lib}/new-name.umd.js.map`,
          `dist/libs/${lib}/new-name.umd.min.js`,
          `dist/libs/${lib}/new-name.umd.min.js.map`
        )
      ).not.toThrow();

      buildResult = await runNxProdCommandAsync(
        `build ${lib} --formats commonjs`
      );
      expect(() =>
        checkFilesExist(
          `dist/libs/${lib}/${lib}.common.js`,
          `dist/libs/${lib}/${lib}.common.js.map`
        )
      ).not.toThrow();
      expect(() =>
        checkFilesExist(
          `dist/libs/${lib}/${lib}.umd.js`,
          `dist/libs/${lib}/${lib}.umd.js.map`,
          `dist/libs/${lib}/${lib}.umd.min.js`,
          `dist/libs/${lib}/${lib}.umd.min.js.map`
        )
      ).toThrow();

      done();
    }, 300000);
  });

  describe('component', () => {
    describe('inside an app', () => {
      it('should generate component', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --vueVersion 3`
        );

        await runNxCommandAsync(
          `generate @nx-plus/vue:component my-component --project ${appName}`
        );

        expect(() =>
          checkFilesExist(`apps/${appName}/src/MyComponent.vue`)
        ).not.toThrow();

        done();
      }, 300000);
    });

    describe('inside a library', () => {
      it('should generate component', async (done) => {
        const libName = uniq('lib');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:lib ${libName} --vueVersion 3`
        );

        await runNxCommandAsync(
          `generate @nx-plus/vue:component my-component --project ${libName}`
        );

        expect(() =>
          checkFilesExist(`libs/${libName}/src/lib/MyComponent.vue`)
        ).not.toThrow();

        done();
      }, 300000);
    });
  });
});
