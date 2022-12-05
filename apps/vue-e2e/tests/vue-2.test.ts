import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { runNxProdCommandAsync, testGeneratedApp } from './utils';
import { runNxCommandAsyncStripped } from '@nx-plus/shared/testing';

describe('vue 2 e2e', () => {
  describe('app', () => {
    beforeAll(() => {
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
    });

    it('should generate app', async () => {
      const appName = uniq('app');
      await runNxCommandAsyncStripped(`generate @nx-plus/vue:app ${appName}`);

      await testGeneratedApp(appName, {
        lint: true,
        test: true,
        e2e: true,
        build: true,
        buildProd: true,
      });
    }, 300000);

    describe('--routing', () => {
      it('should generate app with routing', async () => {
        const appName = uniq('app');
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:app ${appName} --routing`
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
      }, 300000);
    });

    describe('--style', () => {
      it('should generate app with scss', async () => {
        const appName = uniq('app');
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:app ${appName} --style scss`
        );

        await testGeneratedApp(appName, {
          lint: false,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });
      }, 300000);

      it('should generate app with stylus', async () => {
        const appName = uniq('app');
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:app ${appName} --style stylus`
        );

        await testGeneratedApp(appName, {
          lint: false,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });
      }, 300000);

      it('should generate app with less', async () => {
        const appName = uniq('app');
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:app ${appName} --style less`
        );

        await testGeneratedApp(appName, {
          lint: false,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });
      }, 300000);
    });

    describe('vuex', () => {
      it('should generate app and add vuex', async () => {
        const appName = uniq('app');
        await runNxCommandAsyncStripped(`generate @nx-plus/vue:app ${appName}`);
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:vuex ${appName}`
        );

        await testGeneratedApp(appName, {
          lint: true,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });
      }, 300000);
    });

    it('should generate app with routing and add vuex', async () => {
      const appName = uniq('app');
      await runNxCommandAsyncStripped(
        `generate @nx-plus/vue:app ${appName} --routing`
      );
      await runNxCommandAsyncStripped(`generate @nx-plus/vue:vuex ${appName}`);

      await testGeneratedApp(appName, {
        lint: false,
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
    }, 300000);

    it('should report lint error in App.vue', async () => {
      const appName = uniq('app');
      await runNxCommandAsyncStripped(`generate @nx-plus/vue:app ${appName}`);

      updateFile(
        `apps/${appName}/src/App.vue`,
        '<script lang="ts">let myVar: {}</script>'
      );

      const result = await runNxCommandAsyncStripped(`lint ${appName}`, {
        silenceError: true,
      });
      expect(result.stderr).toContain('Lint errors found in the listed files.');
    }, 300000);

    describe('--directory subdir', () => {
      it('should generate app', async () => {
        const appName = uniq('app');
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:app ${appName} --directory subdir`
        );

        const result = await runNxCommandAsyncStripped(
          `build subdir-${appName}`
        );
        expect(result.stdout).toContain('Build complete.');
        expect(() =>
          checkFilesExist(
            `dist/apps/subdir/${appName}/index.html`,
            `dist/apps/subdir/${appName}/favicon.ico`,
            `dist/apps/subdir/${appName}/js/app.js`
          )
        ).not.toThrow();
      }, 300000);
    });
  });

  describe('library', () => {
    beforeAll(() => {
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
    });

    it('should generate lib', async () => {
      const lib = uniq('lib');
      await runNxCommandAsyncStripped(`generate @nx-plus/vue:lib ${lib}`);

      const lintResult = await runNxCommandAsyncStripped(`lint ${lib}`);
      expect(lintResult.stdout).toContain('All files pass linting.');

      const testResult = await runNxCommandAsyncStripped(`test ${lib}`);
      expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);
    }, 300000);

    it('should generate publishable lib', async () => {
      const lib = uniq('lib');
      await runNxCommandAsyncStripped(
        `generate @nx-plus/vue:lib ${lib} --publishable`
      );

      let buildResult = await runNxProdCommandAsync(`build ${lib}`);
      expect(buildResult.stdout).toContain('Compiled successfully');
      expect(() =>
        checkFilesExist(
          `dist/libs/${lib}/demo.html`,
          `dist/libs/${lib}/build.common.js`,
          `dist/libs/${lib}/build.common.js.map`,
          `dist/libs/${lib}/build.umd.js`,
          `dist/libs/${lib}/build.umd.js.map`,
          `dist/libs/${lib}/build.umd.min.js`,
          `dist/libs/${lib}/build.umd.min.js.map`,
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
          `dist/libs/${lib}/build.common.js`,
          `dist/libs/${lib}/build.common.js.map`
        )
      ).not.toThrow();
      expect(() =>
        checkFilesExist(
          `dist/libs/${lib}/build.umd.js`,
          `dist/libs/${lib}/build.umd.js.map`,
          `dist/libs/${lib}/build.umd.min.js`,
          `dist/libs/${lib}/build.umd.min.js.map`
        )
      ).toThrow();
    }, 300000);

    describe('--directory subdir', () => {
      it('should generate publishable lib', async () => {
        const lib = uniq('lib');
        await runNxCommandAsyncStripped(
          `generate @nx-plus/vue:lib ${lib} --directory subdir --publishable`
        );

        const buildResult = await runNxProdCommandAsync(`build subdir-${lib}`);
        expect(buildResult.stdout).toContain('Compiled successfully');

        expect(() =>
          checkFilesExist(
            `dist/libs/subdir/${lib}/demo.html`,
            `dist/libs/subdir/${lib}/build.common.js`,
            `dist/libs/subdir/${lib}/build.common.js.map`,
            `dist/libs/subdir/${lib}/build.umd.js`,
            `dist/libs/subdir/${lib}/build.umd.js.map`,
            `dist/libs/subdir/${lib}/build.umd.min.js`,
            `dist/libs/subdir/${lib}/build.umd.min.js.map`,
            `dist/libs/subdir/${lib}/package.json`
          )
        ).not.toThrow();
      }, 300000);
    });
  });
});
