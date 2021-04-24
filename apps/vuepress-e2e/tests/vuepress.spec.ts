import {
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe.skip('vuepress e2e', () => {
  describe('--vuepressVersion 1', () => {
    it('should generate and build app', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/vuepress', 'dist/libs/vuepress');
      await runNxCommandAsync(`generate @nx-plus/vuepress:app ${appName}`);

      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain(
        `success Generated static files in dist/apps/${appName}.`
      );

      done();
    }, 100000);
  });

  describe('--vuepressVersion 2', () => {
    it('should generate and build app', async (done) => {
      const appName = uniq('app');
      ensureNxProject('@nx-plus/vuepress', 'dist/libs/vuepress');
      await runNxCommandAsync(
        `generate @nx-plus/vuepress:app ${appName} --vuepressVersion 2`
      );

      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain(
        `success VuePress webpack build successfully!`
      );

      done();
    }, 100000);
  });
});
