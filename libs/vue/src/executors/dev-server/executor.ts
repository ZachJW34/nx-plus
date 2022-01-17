import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
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
import { DevServerExecutorSchema } from './schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');

const devServerBuilderOverriddenKeys = [
  'mode',
  'skipPlugins',
  'publicPath',
  'css',
  'stdin',
];

function modifyChalk(context: ExecutorContext) {
  // The vue-cli build command is not suitable for an nx project.
  // We spy on chalk to intercept the console output and replace
  // it with a nx command.
  // TODO: Find a better way to rewrite vue-cli console output
  const buildRegex = /([p]?npm run|yarn) build/;
  modifyChalkOutput('cyan', (arg) => {
    if (buildRegex.test(arg)) {
      return arg.replace(buildRegex, `nx build ${context.projectName} --prod`);
    }
    return arg;
  });
}

export default async function* runExecutor(
  options: DevServerExecutorSchema,
  context: ExecutorContext
) {
  modifyChalk(context);

  // The `css` option must be `undefined` in order for the
  // browser builder option to serve as the default. JSON
  // Schema does not support setting a default value of
  // `undefined`.
  // TODO: Handle this less obtrusively.
  if (
    options.css.requireModuleExtension === undefined &&
    options.css.extract === undefined &&
    options.css.sourceMap === undefined &&
    !Object.keys(options.css.loaderOptions).length
  ) {
    options.css = undefined;
  }

  const browserTarget = parseTargetString(options.browserTarget);
  const rawBrowserOptions = readTargetOptions(browserTarget, context);

  const overrides = Object.keys(options)
    .filter(
      (key) =>
        options[key] !== undefined &&
        devServerBuilderOverriddenKeys.includes(key)
    )
    .reduce((previous, key) => ({ ...previous, [key]: options[key] }), {});
  const browserOptions = { ...rawBrowserOptions, ...overrides };

  const projectRoot = getProjectRoot(context);
  const babelConfig = await getBabelConfig(projectRoot);

  const inlineOptions = {
    chainWebpack: (config) => {
      modifyIndexHtmlPath(config, browserOptions, context);
      modifyEntryPoint(config, browserOptions, context);
      modifyTsConfigPaths(config, browserOptions, context);
      modifyCachePaths(config, context);
      modifyTypescriptAliases(config, browserOptions, context);
      if (babelConfig) {
        modifyBabelLoader(config, babelConfig, context);
      }

      if (!options.watch) {
        // There is no option to disable file watching in `webpack-dev-server`,
        // but webpack's file watcher can be overriden.
        config.plugin('vue-cli').use({
          apply: (compiler) => {
            compiler.hooks.afterEnvironment.tap('vue-cli', () => {
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              compiler.watchFileSystem = { watch: () => {} };
            });
          },
        });
      }
    },
    publicPath: browserOptions.publicPath,
    filenameHashing: browserOptions.filenameHashing,
    css: browserOptions.css,
    configureWebpack: resolveConfigureWebpack(projectRoot),
    devServer: options.devServer,
    transpileDependencies: options.transpileDependencies,
  };

  checkUnsupportedConfig(context, projectRoot);

  const service = new Service(projectRoot, {
    pkg: resolvePkg(context.root),
    inlineOptions,
  });

  const { url: baseUrl } = await service.run(
    'serve',
    {
      open: options.open,
      copy: options.copy,
      stdin: options.stdin,
      mode: browserOptions.mode,
      host: options.host,
      port: options.port,
      https: options.https,
      public: options.public,
      transpileDependencies: options.transpileDependencies,
      'skip-plugins': browserOptions.skipPlugins,
    },
    ['serve']
  );

  yield { success: true, baseUrl };
  // This Promise intentionally never resolves, leaving the process running
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise<{ success: boolean }>(() => {});
}
