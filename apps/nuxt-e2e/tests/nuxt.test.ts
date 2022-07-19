import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { runNxCommandAsyncStripped } from '@nx-plus/shared/testing';

describe('nuxt e2e', () => {
  beforeAll(() => {
    ensureNxProject('@nx-plus/nuxt', 'dist/libs/nuxt');
  });

  it('should generate app', async () => {
    const appName = uniq('app');
    await runNxCommandAsyncStripped(`generate @nx-plus/nuxt:app ${appName}`);

    const lintResult = await runNxCommandAsyncStripped(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');

    const testResult = await runNxCommandAsyncStripped(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);

    const e2eResult = await runNxCommandAsyncStripped(`e2e ${appName}-e2e`);
    expect(e2eResult.stdout).toContain('All specs passed!');

    await runNxCommandAsyncStripped(`build ${appName}`);
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/.nuxt/client/manifest.json`,
        `dist/apps/${appName}/.nuxt/server/client.manifest.json`,
        `dist/apps/${appName}/.nuxt/server/client.manifest.mjs`,
        `dist/apps/${appName}/.nuxt/server/server.mjs`,
        `dist/apps/${appName}/.nuxt/components.d.ts`,
        `dist/apps/${appName}/.nuxt/imports.d.ts`,
        `dist/apps/${appName}/.nuxt/nuxt.d.ts`,
        `dist/apps/${appName}/.nuxt/tsconfig.json`,
        `dist/apps/${appName}/.nuxt/.output`,
        `dist/apps/${appName}/.nuxt/.output/server`,
        `dist/apps/${appName}/.nuxt/.output/nitro.json`,
        `dist/apps/${appName}/.nuxt/.output/server/index.mjs`,
        `dist/apps/${appName}/.nuxt/views`,
        `dist/apps/${appName}/.nuxt/types`
        /*         `dist/apps/${appName}/.nuxt/utils.js`,
        `dist/apps/${appName}/.nuxt/server.js`,
        `dist/apps/${appName}/.nuxt/routes.json`,
        `dist/apps/${appName}/.nuxt/router.scrollBehavior.js`,
        `dist/apps/${appName}/.nuxt/router.js`,
        `dist/apps/${appName}/.nuxt/middleware.js`,
        `dist/apps/${appName}/.nuxt/loading.html`,
        `dist/apps/${appName}/.nuxt/jsonp.js`,
        `dist/apps/${appName}/.nuxt/index.js`,
        `dist/apps/${appName}/.nuxt/empty.js`,
        `dist/apps/${appName}/.nuxt/client.js`,
        `dist/apps/${appName}/.nuxt/App.js`,
        `dist/apps/${appName}/.nuxt/views`,
        `dist/apps/${appName}/.nuxt/vetur`,
        `dist/apps/${appName}/.nuxt/mixins`,
        `dist/apps/${appName}/.nuxt/dist`,
        `dist/apps/${appName}/.nuxt/components` */
      )
    ).not.toThrow();

    const prodE2eResult = await runNxCommandAsyncStripped(
      `e2e ${appName}-e2e --prod`
    );
    expect(prodE2eResult.stdout).toContain('All specs passed!');
  }, 300000);

  it('should report lint error in index.vue', async () => {
    const appName = uniq('app');
    await runNxCommandAsyncStripped(`generate @nx-plus/nuxt:app ${appName}`);

    updateFile(
      `apps/${appName}/pages/index.vue`,
      '<script lang="ts">{}</script>'
    );

    const result = await runNxCommandAsyncStripped(`lint ${appName}`, {
      silenceError: true,
    });
    expect(result.stderr).toContain('Lint errors found in the listed files.');
  }, 300000);

  it('should generate static app', async () => {
    const appName = uniq('app');
    await runNxCommandAsyncStripped(`generate @nx-plus/nuxt:app ${appName}`);

    await runNxCommandAsyncStripped(`static ${appName}`);
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/dist/_nuxt`,
        `dist/apps/${appName}/dist/.nojekyll`,
        `dist/apps/${appName}/dist/200.html`,
        `dist/apps/${appName}/dist/favicon.ico`,
        `dist/apps/${appName}/dist/index.html`
      )
    ).not.toThrow();
  }, 300000);

  describe('--directory subdir', () => {
    it('should generate app', async () => {
      const appName = uniq('app');
      await runNxCommandAsyncStripped(
        `generate @nx-plus/nuxt:app ${appName} --directory subdir`
      );

      await runNxCommandAsyncStripped(`build subdir-${appName}`);
      expect(() =>
        checkFilesExist(
          `dist/apps/subdir/${appName}/.nuxt/utils.js`,
          `dist/apps/subdir/${appName}/.nuxt/server.js`,
          `dist/apps/subdir/${appName}/.nuxt/routes.json`,
          `dist/apps/subdir/${appName}/.nuxt/router.scrollBehavior.js`,
          `dist/apps/subdir/${appName}/.nuxt/router.js`,
          `dist/apps/subdir/${appName}/.nuxt/middleware.js`,
          `dist/apps/subdir/${appName}/.nuxt/loading.html`,
          `dist/apps/subdir/${appName}/.nuxt/jsonp.js`,
          `dist/apps/subdir/${appName}/.nuxt/index.js`,
          `dist/apps/subdir/${appName}/.nuxt/empty.js`,
          `dist/apps/subdir/${appName}/.nuxt/client.js`,
          `dist/apps/subdir/${appName}/.nuxt/App.js`,
          `dist/apps/subdir/${appName}/.nuxt/views`,
          `dist/apps/subdir/${appName}/.nuxt/vetur`,
          `dist/apps/subdir/${appName}/.nuxt/mixins`,
          `dist/apps/subdir/${appName}/.nuxt/dist`,
          `dist/apps/subdir/${appName}/.nuxt/components`
        )
      ).not.toThrow();
    }, 300000);

    it('should generate static app', async () => {
      const appName = uniq('app');
      await runNxCommandAsyncStripped(
        `generate @nx-plus/nuxt:app ${appName} --directory subdir`
      );

      await runNxCommandAsyncStripped(`static subdir-${appName}`);
      expect(() =>
        checkFilesExist(
          `dist/apps/subdir/${appName}/dist/_nuxt`,
          `dist/apps/subdir/${appName}/dist/.nojekyll`,
          `dist/apps/subdir/${appName}/dist/200.html`,
          `dist/apps/subdir/${appName}/dist/favicon.ico`,
          `dist/apps/subdir/${appName}/dist/index.html`
        )
      ).not.toThrow();
    }, 300000);
  });
});
