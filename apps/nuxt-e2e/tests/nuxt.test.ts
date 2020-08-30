import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('nuxt e2e', () => {
  it('should generate app', async (done) => {
    const appName = uniq('app');
    ensureNxProject('@nx-plus/nuxt', 'dist/libs/nuxt');
    await runNxCommandAsync(`generate @nx-plus/nuxt:app ${appName}`);

    const lintResult = await runNxCommandAsync(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);

    const e2eResult = await runNxCommandAsync(`e2e ${appName}-e2e --headless`);
    expect(e2eResult.stdout).toContain('All specs passed!');

    await runNxCommandAsync(`build ${appName}`);
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/utils.js`,
        `dist/apps/${appName}/server.js`,
        `dist/apps/${appName}/routes.json`,
        `dist/apps/${appName}/router.scrollBehavior.js`,
        `dist/apps/${appName}/router.js`,
        `dist/apps/${appName}/middleware.js`,
        `dist/apps/${appName}/loading.html`,
        `dist/apps/${appName}/jsonp.js`,
        `dist/apps/${appName}/index.js`,
        `dist/apps/${appName}/empty.js`,
        `dist/apps/${appName}/client.js`,
        `dist/apps/${appName}/App.js`,
        `dist/apps/${appName}/views`,
        `dist/apps/${appName}/vetur`,
        `dist/apps/${appName}/mixins`,
        `dist/apps/${appName}/dist`,
        `dist/apps/${appName}/components`
      )
    ).not.toThrow();

    done();
  }, 300000);

  describe('--directory subdir', () => {
    it('should generate app', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/nuxt', 'dist/libs/nuxt');
      await runNxCommandAsync(
        `generate @nx-plus/nuxt:app ${appName} --directory subdir`
      );

      await runNxCommandAsync(`build subdir-${appName}`);
      expect(() =>
        checkFilesExist(
          `dist/apps/subdir/${appName}/utils.js`,
          `dist/apps/subdir/${appName}/server.js`,
          `dist/apps/subdir/${appName}/routes.json`,
          `dist/apps/subdir/${appName}/router.scrollBehavior.js`,
          `dist/apps/subdir/${appName}/router.js`,
          `dist/apps/subdir/${appName}/middleware.js`,
          `dist/apps/subdir/${appName}/loading.html`,
          `dist/apps/subdir/${appName}/jsonp.js`,
          `dist/apps/subdir/${appName}/index.js`,
          `dist/apps/subdir/${appName}/empty.js`,
          `dist/apps/subdir/${appName}/client.js`,
          `dist/apps/subdir/${appName}/App.js`,
          `dist/apps/subdir/${appName}/views`,
          `dist/apps/subdir/${appName}/vetur`,
          `dist/apps/subdir/${appName}/mixins`,
          `dist/apps/subdir/${appName}/dist`,
          `dist/apps/subdir/${appName}/components`
        )
      ).not.toThrow();

      done();
    }, 300000);
  });
});
