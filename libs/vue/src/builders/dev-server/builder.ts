import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString,
} from '@angular-devkit/architect';
import { getSystemPath, JsonObject, Path } from '@angular-devkit/core';
import { cliCommand } from '@nrwl/workspace/src/core/file-utils';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DevServerBuilderSchema } from './schema';
import { BrowserBuilderSchema } from '../browser/schema';
import {
  checkUnsupportedConfig,
  getProjectRoot,
  modifyChalkOutput,
  resolveConfigureWebpack,
} from '../../utils';
import {
  modifyCachePaths,
  modifyEntryPoint,
  modifyIndexHtmlPath,
  modifyTsConfigPaths,
  modifyTypescriptAliases,
} from '../../webpack';

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

export function runBuilder(
  options: DevServerBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
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

  // https://github.com/angular/angular-cli/blob/v9.1.0/packages/angular_devkit/build_angular/src/dev-server/index.ts#L133
  async function setup(): Promise<{
    projectRoot: Path;
    browserOptions: BrowserBuilderSchema;
    inlineOptions;
  }> {
    const browserTarget = targetFromTargetString(options.browserTarget);
    const rawBrowserOptions = await context.getTargetOptions(browserTarget);
    const overrides = Object.keys(options)
      .filter(
        (key) =>
          options[key] !== undefined &&
          devServerBuilderOverriddenKeys.includes(key)
      )
      .reduce((previous, key) => ({ ...previous, [key]: options[key] }), {});
    const browserName = await context.getBuilderNameForTarget(browserTarget);
    const browserOptions = await context.validateOptions<
      JsonObject & BrowserBuilderSchema
    >({ ...rawBrowserOptions, ...overrides }, browserName);

    const projectRoot = await getProjectRoot(context);

    const inlineOptions = {
      chainWebpack: (config) => {
        modifyIndexHtmlPath(config, browserOptions, context);
        modifyEntryPoint(config, browserOptions, context);
        modifyTsConfigPaths(config, browserOptions, context);
        modifyCachePaths(config, context);
        modifyTypescriptAliases(config, browserOptions, context);

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
    };

    return {
      projectRoot,
      browserOptions,
      inlineOptions,
    };
  }

  // The vue-cli build command is not suitable for an nx project.
  // We spy on chalk to intercept the console output and replace
  // it with a nx command.
  // TODO: Find a better way to rewrite vue-cli console output
  const buildRegex = /([p]?npm run|yarn) build/;
  modifyChalkOutput('cyan', (arg) => {
    if (buildRegex.test(arg)) {
      return arg.replace(
        buildRegex,
        `${cliCommand()} build ${context.target.project} --prod`
      );
    }
    return arg;
  });

  return from(setup()).pipe(
    switchMap(({ projectRoot, browserOptions, inlineOptions }) => {
      checkUnsupportedConfig(context, projectRoot);

      const service = new Service(getSystemPath(projectRoot), {
        pkg: resolvePkg(context.workspaceRoot),
        inlineOptions,
      });

      return new Observable((obs) => {
        service
          .run(
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
              'skip-plugins': browserOptions.skipPlugins,
            },
            ['serve']
          )
          .then((success) => obs.next(success))
          .catch((err) => obs.error(err));
      });
    }),
    map(({ url }) => ({ success: true, baseUrl: url }))
  );
}

export default createBuilder(runBuilder);
