import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import * as semver from 'semver';
import { BrowserExecutorSchema } from './executors/browser/schema';
import { LibraryExecutorSchema } from './executors/library/schema';
import { loadModule } from './utils';

export function modifyIndexHtmlPath(
  config,
  options: BrowserExecutorSchema,
  context: ExecutorContext
): void {
  config.plugin('html').tap((args) => {
    args[0].template = path.join(context.root, options.index);
    return args;
  });
}

export function modifyEntryPoint(
  config,
  options: BrowserExecutorSchema,
  context: ExecutorContext
): void {
  config.entry('app').clear();
  config.entry('app').add(path.join(context.root, options.main));
}

export function modifyTsConfigPaths(
  config,
  options: BrowserExecutorSchema | LibraryExecutorSchema,
  context: ExecutorContext
): void {
  const tsConfigPath = path.join(context.root, options.tsConfig);
  const vue = loadModule('vue', context.root);
  const isVue3 = semver.major(vue.version) === 3;

  config.module
    .rule('ts')
    .use('ts-loader')
    .tap((loaderOptions) => {
      loaderOptions.configFile = tsConfigPath;
      return loaderOptions;
    });
  config.module
    .rule('tsx')
    .use('ts-loader')
    .tap((loaderOptions) => {
      loaderOptions.configFile = tsConfigPath;
      return loaderOptions;
    });
  config.plugin('fork-ts-checker').tap((args) => {
    if (isVue3) {
      args[0].typescript.configFile = tsConfigPath;
    } else {
      args[0].tsconfig = tsConfigPath;
    }
    return args;
  });
}

export function modifyCachePaths(config, context: ExecutorContext): void {
  const vueLoaderCachePath = path.join(
    context.root,
    'node_modules/.cache/vue-loader'
  );
  const tsLoaderCachePath = path.join(
    context.root,
    'node_modules/.cache/ts-loader'
  );

  config.module
    .rule('vue')
    .use('cache-loader')
    .tap((options) => {
      options.cacheDirectory = vueLoaderCachePath;
      return options;
    });
  config.module
    .rule('vue')
    .use('vue-loader')
    .tap((options) => {
      options.cacheDirectory = vueLoaderCachePath;
      return options;
    });
  config.module
    .rule('ts')
    .use('cache-loader')
    .tap((options) => {
      options.cacheDirectory = tsLoaderCachePath;
      return options;
    });
  config.module
    .rule('tsx')
    .use('cache-loader')
    .tap((options) => {
      options.cacheDirectory = tsLoaderCachePath;
      return options;
    });
}

export function modifyTypescriptAliases(
  config,
  options: BrowserExecutorSchema | LibraryExecutorSchema,
  context: ExecutorContext
) {
  const tsConfigPath = path.join(context.root, options.tsConfig);
  const extensions = [
    '.tsx',
    '.ts',
    '.mjs',
    '.js',
    '.jsx',
    '.vue',
    '.json',
    '.wasm',
  ];
  config.resolve.alias.delete('@');
  config.resolve
    .plugin('tsconfig-paths')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('tsconfig-paths-webpack-plugin'), [
      {
        configFile: tsConfigPath,
        extensions,
      },
    ]);
}

export function modifyCopyAssets(
  config,
  options: LibraryExecutorSchema,
  context: ExecutorContext,
  projectRoot: string
): void {
  const transformedAssetPatterns = ['package.json', 'README.md'].map(
    (file) => ({
      from: path.join(projectRoot, file),
      to: path.join(context.root, options.dest),
    })
  );

  config
    .plugin('copy')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('copy-webpack-plugin'), [transformedAssetPatterns]);
}

export function modifyBabelLoader(
  config,
  babelConfig: string,
  context: ExecutorContext
) {
  ['js', 'ts', 'tsx'].forEach((ext) =>
    config.module
      .rule(ext)
      .use('babel-loader')
      .tap((options) => ({
        ...options,
        configFile: babelConfig,
      }))
  );

  const babelLoaderCachePath = path.join(
    context.root,
    'node_modules/.cache/babel-loader'
  );
  config.module
    .rule('js')
    .use('cache-loader')
    .tap((options) => {
      options.cacheDirectory = babelLoaderCachePath;
      return options;
    });
}
