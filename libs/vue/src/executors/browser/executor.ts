import { BrowserExecutorSchema } from './schema';
import {
  checkUnsupportedConfig,
  getBabelConfig,
  getProjectRoot,
  modifyChalkOutput,
  resolveConfigureWebpack,
} from '../../utils';
import {
  modifyBabelLoader,
  modifyCachePaths,
  modifyEntryPoint,
  modifyIndexHtmlPath,
  modifyTsConfigPaths,
  modifyTypescriptAliases,
} from '../../webpack';
import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');

function modifyChalk(options: BrowserExecutorSchema) {
  // The compiled files output by vue-cli are not relative to the
  // root of the workspace. We can spy on chalk to intercept the
  // console output and transform any non-relative file paths.
  // TODO: Find a better way to rewrite vue-cli console output
  const chalkTransform = (arg: string) => {
    const normalizedArg = path.normalize(arg);
    return normalizedArg.includes(options.dest)
      ? options.dest + normalizedArg.split(options.dest)[1]
      : arg;
  };
  ['green', 'cyan', 'blue'].forEach((color) =>
    modifyChalkOutput(color, chalkTransform)
  );
}

export default async function* runExecutor(
  options: BrowserExecutorSchema,
  context: ExecutorContext
) {
  try {
    modifyChalk(options);

    const projectRoot = await getProjectRoot(context);
    const babelConfig = await getBabelConfig(projectRoot);

    const inlineOptions = {
      chainWebpack: (config) => {
        modifyIndexHtmlPath(config, options, context);
        modifyEntryPoint(config, options, context);
        modifyTsConfigPaths(config, options, context);
        modifyCachePaths(config, context);
        modifyTypescriptAliases(config, options, context);
        if (babelConfig) {
          modifyBabelLoader(config, babelConfig, context);
        }
      },
      publicPath: options.publicPath,
      filenameHashing: options.filenameHashing,
      productionSourceMap: options.productionSourceMap,
      css: options.css,
      configureWebpack: resolveConfigureWebpack(projectRoot),
      transpileDependencies: options.transpileDependencies,
    };

    checkUnsupportedConfig(context, projectRoot);

    const service = new Service(projectRoot, {
      pkg: resolvePkg(context.root),
      inlineOptions,
    });
    const buildOptions = {
      mode: options.mode,
      dest: path.join(context.root, options.dest),
      modern: false,
      'unsafe-inline': true,
      clean: options.clean,
      report: options.report,
      'report-json': options.reportJson,
      'skip-plugins': options.skipPlugins,
      watch: options.watch,
      stdin: options.stdin,
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
    yield { success: false, error: err };
  }
}
