import { ensureNxProject, uniq } from '@nrwl/nx-plugin/testing';
import { runNxCommandAsyncStripped } from '@nx-plus/test-utils';

describe('docusaurus e2e', () => {
  it('should create and build docusaurus', async () => {
    const appName = uniq('docusaurus');
    ensureNxProject('@nx-plus/docusaurus', 'dist/libs/docusaurus');
    await runNxCommandAsyncStrippedStripped(
      `generate @nx-plus/docusaurus:app ${appName}`
    );

    const result = await runNxCommandAsyncStrippedStripped(`build ${appName}`);
    expect(result.stdout).toContain(
      `Success! Generated static files in "dist/apps/${appName}".`
    );
  }, 200000);
});
