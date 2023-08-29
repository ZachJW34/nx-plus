import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../utils';
import { applicationGenerator } from '../application/generator';
import { options as appOptions } from '../application/generator.spec';
import { vuexGenerator } from './generator';
import { VuexGeneratorSchema } from './schema';

describe('vuex schematic', () => {
  let appTree: Tree;
  const options: VuexGeneratorSchema = { project: 'my-app', skipFormat: false };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should generate Vuex configuration for Vue 2', async () => {
    jest.spyOn(utils, 'loadModule').mockReturnValue({ version: '2.0.0' });

    await applicationGenerator(appTree, appOptions);
    await vuexGenerator(appTree, options);

    const packageJson = readJson(appTree, 'package.json');
    expect(packageJson.dependencies['vuex']).toBeDefined();

    expect(appTree.exists('apps/my-app/src/store/index.ts')).toBeTruthy();

    const main = appTree.read('apps/my-app/src/main.ts', 'utf-8');
    expect(main).toContain("import store from './store';");
    expect(main).toContain(`
new Vue({
  store,
  render: h => h(App)
}).$mount('#app');`);
  });

  it('should generate Vuex configuration for Vue 3', async () => {
    jest.spyOn(utils, 'loadModule').mockReturnValue({ version: '3.0.0' });

    await applicationGenerator(appTree, { ...appOptions, vueVersion: 3 });
    await vuexGenerator(appTree, options);

    const packageJson = readJson(appTree, 'package.json');
    expect(packageJson.dependencies['vuex']).toBeDefined();

    expect(appTree.exists('apps/my-app/src/store/index.ts')).toBeTruthy();

    const main = appTree.read('apps/my-app/src/main.ts', 'utf-8');
    expect(main).toContain("import store from './store';");
    expect(main).toContain(`createApp(App).use(store)
  .mount('#app');`);
  });
});
