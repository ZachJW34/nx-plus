import {
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe('docusaurus e2e', () => {
  it('should create and build docusaurus', async (done) => {
    const appName = uniq('docusaurus');
    ensureNxProject('@nx-plus/docusaurus', 'dist/libs/docusaurus');
    await runNxCommandAsync(`generate @nx-plus/docusaurus:app ${appName}`);

    const result = await runNxCommandAsync(`build ${appName}`);
    expect(result.stdout).toContain(
      `Success! Generated static files in "dist/apps/${appName}".`
    );

    done();
  }, 100000);
});
