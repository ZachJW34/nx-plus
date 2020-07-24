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
      await runNxCommandAsync(`generate @nx-plus/vue:app ${appName} --routing`);

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
    const buildResult = await runBuildProdAsync(appName);
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
function runBuildProdAsync(
  appName: string
): Promise<{
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    cp.exec(
      `node ./node_modules/@nrwl/cli/bin/nx.js build ${appName} --prod --filenameHashing false`,
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
