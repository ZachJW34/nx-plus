import { LibraryExecutorSchema } from './schema';
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
  modifyCopyAssets,
  modifyTsConfigPaths,
  modifyTypescriptAliases,
} from '../../webpack';
import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');

function modifyChalk(options: LibraryExecutorSchema) {
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

// Deal with this later
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

export default async function* runExecutor(
  options: LibraryExecutorSchema,
  context: ExecutorContext
) {
  try {
    modifyChalk(options);

    const projectRoot = getProjectRoot(context);
    const babelConfig = await getBabelConfig(projectRoot);

    const inlineOptions = {
      chainWebpack: (config: ANY) => {
        modifyTsConfigPaths(config, options, context);
        modifyCachePaths(config, context);
        modifyTypescriptAliases(config, options, context);
        modifyCopyAssets(config, options, context, projectRoot);
        if (babelConfig) {
          modifyBabelLoader(config, babelConfig, context);
        }
      },
      css: options.css,
      configureWebpack: resolveConfigureWebpack(projectRoot),
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
