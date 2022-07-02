import { tags } from '@angular-devkit/core';
import { checkFilesExist, tmpProjPath } from '@nrwl/nx-plugin/testing';
import * as cp from 'child_process';
import { runNxCommandAsyncStripped } from '@nx-plus/shared/testing';

export async function testGeneratedApp(
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
    const lintResult = await runNxCommandAsyncStripped(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');
  }

  if (options.test) {
    const testResult = await runNxCommandAsyncStripped(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);
  }

  if (options.e2e) {
    const e2eResult = await runNxCommandAsyncStripped(`e2e ${appName}-e2e`);
    expect(e2eResult.stdout).toContain('All specs passed!');
  }

  if (options.build) {
    const buildResult = await runNxCommandAsyncStripped(`build ${appName}`);
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
export function runNxProdCommandAsync(command: string): Promise<{
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
