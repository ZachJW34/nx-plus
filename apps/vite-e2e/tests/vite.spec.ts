import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { join } from 'path';

describe('vite e2e', () => {
  it('should create vite', async (done) => {
    const appName = uniq('vite');
    ensureNxProject('@nx-plus/vite', 'dist/libs/vite');
    await runNxCommandAsync(`generate @nx-plus/vite:app ${appName}`);

    const lintResult = await runNxCommandAsync(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);

    disableHashing(appName);
    const buildResult = await runNxCommandAsync(`build ${appName}`);
    checkFilesExist(
      `dist/apps/${appName}/index.html`,
      `dist/apps/${appName}/assets/index.css`,
      `dist/apps/${appName}/assets/index.js`,
      `dist/apps/${appName}/assets/vendor.js`
    );
    // Cannot disable hashing for assets
    // see: https://github.com/vitejs/vite/issues/2944
    expect(buildResult.stdout).toContain(`dist/apps/${appName}/assets/logo`);

    const e2eResult = await runNxCommandAsync(`e2e ${appName}-e2e --headless`);
    expect(e2eResult.stdout).toContain('All specs passed!');

    done();
  }, 100000);
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
