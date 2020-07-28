import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  tmpProjPath,
  uniq,
} from '@nrwl/nx-plugin/testing';
import * as cp from 'child_process';

describe('vue e2e', () => {
  describe('app', () => {
    it('should generate app', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(`generate @nx-plus/vue:app ${appName}`);

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

        done();
      }, 300000);
    });

    describe('--style', () => {
      it('should generate app with scss', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --style scss`
        );

        await testGeneratedApp(appName, {
          lint: false,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });

        done();
      }, 300000);

      it('should generate app with stylus', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --style stylus`
        );

        await testGeneratedApp(appName, {
          lint: false,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });

        done();
      }, 300000);

      it('should generate app with less', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --style less`
        );

        await testGeneratedApp(appName, {
          lint: false,
          test: false,
          e2e: false,
          build: true,
          buildProd: true,
        });

        done();
      }, 300000);
    });

    describe('vuex', () => {
      it('should generate app and add vuex', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(`generate @nx-plus/vue:app ${appName}`);
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
      await runNxCommandAsync(`generate @nx-plus/vue:app ${appName} --routing`);
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

    describe('--directory subdir', () => {
      it('should generate app', async (done) => {
        const appName = uniq('app');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:app ${appName} --directory subdir`
        );

        const result = await runNxCommandAsync(`build subdir-${appName}`);
        expect(result.stdout).toContain('Build complete.');
        expect(() =>
          checkFilesExist(
            `dist/apps/subdir/${appName}/index.html`,
            `dist/apps/subdir/${appName}/favicon.ico`,
            `dist/apps/subdir/${appName}/js/app.js`,
            `dist/apps/subdir/${appName}/img/logo.png`
          )
        ).not.toThrow();

        done();
      }, 300000);
    });
  });

  describe('library', () => {
    it('should generate lib', async (done) => {
      const lib = uniq('lib');
      ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
      await runNxCommandAsync(`generate @nx-plus/vue:lib ${lib}`);

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
      await runNxCommandAsync(`generate @nx-plus/vue:lib ${lib} --publishable`);

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

    describe('--directory subdir', () => {
      it('should generate publishable lib', async (done) => {
        const lib = uniq('lib');
        ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
        await runNxCommandAsync(
          `generate @nx-plus/vue:lib ${lib} --directory subdir --publishable`
        );

        const buildResult = await runNxProdCommandAsync(`build subdir-${lib}`);
        expect(buildResult.stdout).toContain('Compiled successfully');

        expect(() =>
          checkFilesExist(
            `dist/libs/subdir/${lib}/demo.html`,
            `dist/libs/subdir/${lib}/subdir-${lib}.common.js`,
            `dist/libs/subdir/${lib}/subdir-${lib}.common.js.map`,
            `dist/libs/subdir/${lib}/subdir-${lib}.umd.js`,
            `dist/libs/subdir/${lib}/subdir-${lib}.umd.js.map`,
            `dist/libs/subdir/${lib}/subdir-${lib}.umd.min.js`,
            `dist/libs/subdir/${lib}/subdir-${lib}.umd.min.js.map`,
            `dist/libs/subdir/${lib}/package.json`
          )
        ).not.toThrow();

        done();
      }, 300000);
    });
  });
});

async function testGeneratedApp(
  appName: string,
  options: {
    lint: boolean;
    test: boolean;
    e2e: boolean;
    build: boolean;
    buildProd: boolean;
  }
): Promise<void> {
  if (options.lint) {
    const lintResult = await runNxCommandAsync(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');
  }

  if (options.test) {
    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);
  }

  if (options.e2e) {
    const e2eResult = await runNxCommandAsync(`e2e ${appName}-e2e --headless`);
    expect(e2eResult.stdout).toContain('All specs passed!');
  }

  if (options.build) {
    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Build complete.');
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/index.html`,
        `dist/apps/${appName}/favicon.ico`,
        `dist/apps/${appName}/js/app.js`,
        `dist/apps/${appName}/img/logo.png`
      )
    ).not.toThrow();
  }

  if (options.buildProd) {
    const buildResult = await runNxProdCommandAsync(
      `build ${appName} --prod --filenameHashing false`
    );
    expect(buildResult.stdout).toContain('Build complete.');
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/index.html`,
        `dist/apps/${appName}/favicon.ico`,
        `dist/apps/${appName}/js/app.js`,
        `dist/apps/${appName}/js/app.js.map`,
        `dist/apps/${appName}/js/chunk-vendors.js`,
        `dist/apps/${appName}/js/chunk-vendors.js.map`,
        `dist/apps/${appName}/img/logo.png`,
        `dist/apps/${appName}/css/app.css`
      )
    ).not.toThrow();
  }
}

// Vue CLI requires `NODE_ENV` be set to `production` to produce
// a production build. Jest sets `NODE_ENV` to `test` by default.
// This function is very similar to `runCommandAsync`.
// https://github.com/nrwl/nx/blob/9.5.1/packages/nx-plugin/src/utils/testing-utils/async-commands.ts#L10
function runNxProdCommandAsync(
  command: string
): Promise<{
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    cp.exec(
      `node ./node_modules/@nrwl/cli/bin/nx.js ${command}`,
      {
        cwd: tmpProjPath(),
        env: { ...process.env, NODE_ENV: 'production' },
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}
