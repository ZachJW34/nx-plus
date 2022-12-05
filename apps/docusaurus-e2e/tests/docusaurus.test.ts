import { ensureNxProject, uniq } from '@nrwl/nx-plugin/testing';
import { runNxCommandAsyncStripped } from '@nx-plus/shared/testing';

describe('docusaurus e2e', () => {
  it('should create and build docusaurus', async () => {
    const appName = uniq('docusaurus');
    ensureNxProject('@nx-plus/docusaurus', 'dist/libs/docusaurus');
    await runNxCommandAsyncStripped(
      `generate @nx-plus/docusaurus:app ${appName}`
    );

    const result = await runNxCommandAsyncStripped(`build ${appName}`);
    expect(result.stdout).toContain(
      `[SUCCESS] Generated static files in "dist/apps/${appName}".`
    );
  }, 200000);
});
