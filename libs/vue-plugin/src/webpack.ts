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

export function modifyFilenameHashing(
  config,
  options: BrowserBuilderSchema
): void {
  const hashFormats = {
    none: { chunk: '', file: '' },
    media: { chunk: '', file: `.[hash:8]` },
    bundles: { chunk: `.[contenthash:8]`, file: '' },
    all: { chunk: `.[contenthash:8]`, file: `.[hash:8]` }
  };
  const hashFormat = hashFormats[options.outputHashing];

  config.output.filename(`js/[name]${hashFormat.chunk}.js`);
  config.output.chunkFilename(`js/[name]${hashFormat.chunk}.js`);

  config.module
    .rule('images')
    .use('url-loader')
    .tap(loaderOptions => {
      loaderOptions.fallback.options.name = `img/[name]${hashFormat.file}.[ext]`;
      return loaderOptions;
    });
  config.module
    .rule('svg')
    .use('file-loader')
    .tap(loaderOptions => {
      loaderOptions.name = `img/[name]${hashFormat.file}.[ext]`;
      return loaderOptions;
    });
  config.module
    .rule('media')
    .use('url-loader')
    .tap(loaderOptions => {
      loaderOptions.fallback.options.name = `media/[name]${hashFormat.file}.[ext]`;
      return loaderOptions;
    });
  config.module
    .rule('fonts')
    .use('url-loader')
    .tap(loaderOptions => {
      loaderOptions.fallback.options.name = `fonts/[name]${hashFormat.file}.[ext]`;
      return loaderOptions;
    });

  config.when(options.mode === 'production', config =>
    config.plugin('extract-css').tap(args => {
      args[0].filename = `css/[name]${hashFormat.chunk}.css`;
      args[0].chunkFilename = `css/[name]${hashFormat.chunk}.css`;
      return args;
    })
  );
}
