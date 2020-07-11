import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq
} from '@nrwl/nx-plugin/testing';
describe('vue e2e', () => {
  it('should create, lint, test, e2e and build app', async done => {
    const appName = uniq('app');
    ensureNxProject('@nx-plus/vue', 'dist/libs/vue');
    await runNxCommandAsync(`generate @nx-plus/vue:app ${appName}`);

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

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Build complete.');
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/index.html`,
        `dist/apps/${appName}/favicon.ico`,
        `dist/apps/${appName}/js/app.js`,
        `dist/apps/${appName}/img`
      )
    ).not.toThrow();

    done();
  }, 300000);

  describe('--directory subdir', () => {
    it('should create and build app', async done => {
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
          `dist/apps/subdir/${appName}/img`
        )
      ).not.toThrow();

      done();
    }, 300000);
  });
});
