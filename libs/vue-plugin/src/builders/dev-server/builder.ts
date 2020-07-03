import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString
} from '@angular-devkit/architect';
import {
  getSystemPath,
  join,
  JsonObject,
  normalize
} from '@angular-devkit/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DevServerBuilderSchema } from './schema';
import { BrowserBuilderSchema } from '../browser/schema';
import {
  getNormalizedAssetPatterns,
  getProjectRoot,
  getProjectSourceRoot
} from '../../utils';
import {
  addFileReplacements,
  modifyCachePaths,
  modifyCopyAssets,
  modifyEntryPoint,
  modifyFilenameHashing,
  modifyIndexHtmlPath,
  modifyTsConfigPaths
} from '../../webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');

const devServerBuilderOverriddenKeys = ['mode', 'skipPlugins'];

export function runBuilder(
  options: DevServerBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  // https://github.com/angular/angular-cli/blob/v9.1.0/packages/angular_devkit/build_angular/src/dev-server/index.ts#L133
  async function setup(): Promise<{
    projectRoot: string;
    browserOptions: BrowserBuilderSchema;
    inlineOptions;
  }> {
    const browserTarget = targetFromTargetString(options.buildTarget);
    const rawBrowserOptions = await context.getTargetOptions(browserTarget);
    const overrides = Object.keys(options)
      .filter(
        key =>
          options[key] !== undefined &&
          devServerBuilderOverriddenKeys.includes(key)
      )
      .reduce((previous, key) => ({ ...previous, [key]: options[key] }), {});
    const browserName = await context.getBuilderNameForTarget(browserTarget);
    const browserOptions = await context.validateOptions<
      JsonObject & BrowserBuilderSchema
    >({ ...rawBrowserOptions, ...overrides }, browserName);

    const projectRoot = await getProjectRoot(context);
    const projectSourceRoot = await getProjectSourceRoot(context);

    const normalizedAssetPatterns = getNormalizedAssetPatterns(
      browserOptions,
      context,
      projectRoot,
      projectSourceRoot
    );

    const inlineOptions = {
      chainWebpack: config => {
        modifyIndexHtmlPath(config, browserOptions, context);
        modifyEntryPoint(config, browserOptions, context);
        modifyTsConfigPaths(config, browserOptions, context);
        modifyCachePaths(config, context);
        modifyCopyAssets(
          config,
          browserOptions,
          context,
          normalizedAssetPatterns
        );
        addFileReplacements(config, browserOptions, context);
        modifyFilenameHashing(config, browserOptions);

        if (!options.watch) {
          // There is no option to disable file watching in `webpack-dev-server`,
          // but webpack's file watcher can be overriden.
          config.plugin('vue-cli').use({
            apply: compiler => {
              compiler.hooks.afterEnvironment.tap('vue-cli', () => {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                compiler.watchFileSystem = { watch: () => {} };
              });
            }
          });
        }
      },
      outputDir: getSystemPath(
        join(normalize(context.workspaceRoot), browserOptions.outputPath)
      ),
      css: {
        extract: browserOptions.extractCss
      }
    };

    return {
      projectRoot,
      browserOptions,
      inlineOptions
    };
  }

  return from(setup()).pipe(
    switchMap(({ projectRoot, browserOptions, inlineOptions }) => {
      const service = new Service(projectRoot, {
        pkg: resolvePkg(context.workspaceRoot),
        inlineOptions
      });

      return new Observable(obs => {
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
              'skip-plugins': browserOptions.skipPlugins
            },
            ['serve']
          )
          .then(success => obs.next(success))
          .catch(err => obs.error(err));
      });
    }),
    map(({ url }) => ({ success: true, baseUrl: url }))
  );
}

export default createBuilder(runBuilder);
