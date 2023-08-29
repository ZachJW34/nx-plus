import { LibraryExecutorSchema } from './schema';
import {
  checkUnsupportedConfig,
  getBabelConfig,
  getProjectRoot,
  resolveConfigureWebpack,
} from '../../utils';
import {
  modifyBabelLoader,
  modifyCopyAssets,
  modifyTsConfigPaths,
  modifyTypescriptAliases,
} from '../../webpack';
import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');

// Deal with this later
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

export default async function* runExecutor(
  options: LibraryExecutorSchema,
  context: ExecutorContext
) {
  try {
    const projectRoot = getProjectRoot(context);
    const babelConfig = await getBabelConfig(projectRoot);

    const inlineOptions = {
      chainWebpack: (config: ANY) => {
        modifyTsConfigPaths(config, options, context);
        modifyTypescriptAliases(config, options, context);
        modifyCopyAssets(config, options, context, projectRoot);
        if (babelConfig) {
          modifyBabelLoader(config, babelConfig);
        }
      },
      css: options.css,
      configureWebpack: await resolveConfigureWebpack(projectRoot),
    };

    checkUnsupportedConfig(context, projectRoot);

    const service = new Service(projectRoot, {
      pkg: resolvePkg(context.root),
      inlineOptions,
    });
    const buildOptions = {
      mode: 'production',
      dest: path.join(context.root, options.dest),
      clean: options.clean,
      report: options.report,
      'report-json': options.reportJson,
      'skip-plugins': options.skipPlugins,
      target: 'lib',
      entry: path.join(context.root, options.entry),
      'inline-vue': options.inlineVue,
      watch: options.watch,
      formats: options.formats,
      name: options.name ?? context.targetName,
      filename: options.filename,
      transpileDependencies: options.transpileDependencies,
    };

    await service.run('build', buildOptions, ['build']);

    yield {
      success: true,
    };

    if (options.watch) {
      // This Promise intentionally never resolves, leaving the process running
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await new Promise<{ success: boolean }>(() => {});
    }
  } catch (err) {
    console.error(err);
    yield { success: false };
  }
}
