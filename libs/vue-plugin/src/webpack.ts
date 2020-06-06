import { BuilderContext } from '@angular-devkit/architect';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { AssetPattern, BrowserBuilderSchema } from './builders/browser/schema';

export function modifyIndexHtmlPath(
  config,
  options: BrowserBuilderSchema,
  context: BuilderContext
): void {
  config.plugin('html').tap(args => {
    args[0].template = getSystemPath(
      join(normalize(context.workspaceRoot), options.index)
    );
    return args;
  });
}

export function modifyEntryPoint(
  config,
  options: BrowserBuilderSchema,
  context: BuilderContext
): void {
  config.entry('app').clear();
  config
    .entry('app')
    .add(getSystemPath(join(normalize(context.workspaceRoot), options.main)));
}

export function modifyTsConfigPaths(
  config,
  options: BrowserBuilderSchema,
  context: BuilderContext
): void {
  const tsConfigPath = getSystemPath(
    join(normalize(context.workspaceRoot), options.tsConfig)
  );

  config.module
    .rule('ts')
    .use('ts-loader')
    .tap(loaderOptions => {
      loaderOptions.configFile = tsConfigPath;
      return loaderOptions;
    });
  config.module
    .rule('tsx')
    .use('ts-loader')
    .tap(loaderOptions => {
      loaderOptions.configFile = tsConfigPath;
      return loaderOptions;
    });
  config.plugin('fork-ts-checker').tap(args => {
    args[0].tsconfig = tsConfigPath;
    return args;
  });
}

export function modifyCachePaths(config, context: BuilderContext): void {
  const vueLoaderCachePath = getSystemPath(
    join(normalize(context.workspaceRoot), 'node_modules/.cache/vue-loader')
  );
  const tsLoaderCachePath = getSystemPath(
    join(normalize(context.workspaceRoot), 'node_modules/.cache/ts-loader')
  );

  config.module
    .rule('vue')
    .use('cache-loader')
    .tap(options => {
      options.cacheDirectory = vueLoaderCachePath;
      return options;
    });
  config.module
    .rule('vue')
    .use('vue-loader')
    .tap(options => {
      options.cacheDirectory = vueLoaderCachePath;
      return options;
    });
  config.module
    .rule('ts')
    .use('cache-loader')
    .tap(options => {
      options.cacheDirectory = tsLoaderCachePath;
      return options;
    });
  config.module
    .rule('tsx')
    .use('cache-loader')
    .tap(options => {
      options.cacheDirectory = tsLoaderCachePath;
      return options;
    });
}

export function modifyCopyAssets(
  config,
  options: BrowserBuilderSchema,
  context: BuilderContext,
  assetPatterns: AssetPattern[]
): void {
  const defaultIgnore = ['.DS_Store', '.gitkeep'];
  const transformedAssetPatterns = assetPatterns.map(assetPattern => ({
    from: getSystemPath(
      join(
        normalize(context.workspaceRoot),
        assetPattern.input,
        assetPattern.glob
      )
    ),
    to: getSystemPath(
      join(
        normalize(context.workspaceRoot),
        options.outputPath,
        assetPattern.output
      )
    ),
    context: getSystemPath(
      join(normalize(context.workspaceRoot), assetPattern.input)
    ),
    ignore: assetPattern.ignore
      ? defaultIgnore.concat(assetPattern.ignore)
      : defaultIgnore
  }));

  config
    .plugin('copy')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('copy-webpack-plugin'), [transformedAssetPatterns]);
}

export function addFileReplacements(
  config,
  options: BrowserBuilderSchema,
  context: BuilderContext
) {
  for (const pattern of options.fileReplacements) {
    config.resolve.alias.set(
      getSystemPath(join(normalize(context.workspaceRoot), pattern.replace)),
      getSystemPath(join(normalize(context.workspaceRoot), pattern.with))
    );
  }
}
