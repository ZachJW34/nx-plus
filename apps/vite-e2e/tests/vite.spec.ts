import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { join } from 'path';
import { runNxCommandAsyncStripped } from '@nx-plus/shared/testing';

describe('vite e2e', () => {
  it('should create vite app', async () => {
    const appName = uniq('vite');
    ensureNxProject('@nx-plus/vite', 'dist/libs/vite');
    await runNxCommandAsyncStripped(`generate @nx-plus/vite:app ${appName}`);

    const lintResult = await runNxCommandAsyncStripped(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');

    const testResult = await runNxCommandAsyncStripped(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);

    disableHashing(appName);
    await runNxCommandAsyncStripped(`build ${appName}`);
    checkFilesExist(
      `dist/apps/${appName}/index.html`,
      `dist/apps/${appName}/favicon.ico`,
      `dist/apps/${appName}/assets/index.css`,
      `dist/apps/${appName}/assets/index.js`,
      `dist/apps/${appName}/assets/logo.png`
    );

    const e2eResult = await runNxCommandAsyncStripped(`e2e ${appName}-e2e`);
    expect(e2eResult.stdout).toContain('All specs passed!');
  }, 200000);
});

function disableHashing(app: string, directory: string = '') {
  updateFile(join('apps', app, directory, 'vite.config.ts'), (content) =>
    content.replace(
      'emptyOutDir: true,',
      `emptyOutDir: true,
       rollupOptions: {
       output: {
           entryFileNames: \`assets/[name].js\`,
           chunkFileNames: \`assets/[name].js\`,
           assetFileNames: \`assets/[name].[ext]\`
         }
       }`
    )
  );
}
