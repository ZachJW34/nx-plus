import { getSystemPath, join, normalize, Path } from '@angular-devkit/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { LibraryBuilderSchema } from './schema';
import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import {
  checkUnsupportedConfig,
  getBabelConfig,
  getProjectRoot,
  modifyChalkOutput,
  resolveConfigureWebpack,
  resolveVueConfig,
} from '../../utils';
import {
  modifyBabelLoader,
  modifyCachePaths,
  modifyCopyAssets,
  modifyTsConfigPaths,
  modifyTypescriptAliases,
} from '../../webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mergeOptions = require('merge-options');

export function runBuilder(
  options: LibraryBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  async function setup(): Promise<{
    projectRoot: Path;
    inlineOptions;
  }> {
    const projectRoot = await getProjectRoot(context);
    const babelConfig = getBabelConfig(projectRoot);
    const vueConfig = resolveVueConfig(projectRoot) || {};

    const defaults = {
      transpileDependencies: [],
      css: {
        requireModuleExtension: true,
        extract: false,
        sourceMap: false,
        loaderOptions: {},
      },
    };

    const inlineOptions = mergeOptions.call(
      { ignoreUndefined: true },
      defaults,
      vueConfig,
      {
        chainWebpack: (config) => {
          modifyTsConfigPaths(config, options, context);
          modifyCachePaths(config, context);
          modifyTypescriptAliases(config, options, context);
          modifyCopyAssets(config, options, context, projectRoot);
          if (babelConfig) {
            modifyBabelLoader(config, babelConfig, context);
          }

          vueConfig.chainWebpack && vueConfig.chainWebpack(config);
        },
        css: options.css,
        transpileDependencies: options.transpileDependencies,
      }
    );
    const configureWebpack = resolveConfigureWebpack(projectRoot);
    if (configureWebpack) {
      context.logger.warn(
        `"configure-webpack.js" has been deprecated. Please move this function to the "vue-nx.config.js" file.`
      );
      inlineOptions['configureWebpack'] = configureWebpack;
    }

    return {
      projectRoot,
      inlineOptions,
    };
  }

  // The compiled files output by vue-cli are not relative to the
  // root of the workspace. We can spy on chalk to intercept the
  // console output and tranform any non-relative file paths.
  // TODO: Find a better way to rewrite vue-cli console output
  const chalkTransform = (arg: string) => {
    const normalizedArg = normalize(arg);
    return normalizedArg.includes(options.dest)
      ? options.dest + normalizedArg.split(options.dest)[1]
      : arg;
  };
  ['green', 'cyan', 'blue'].forEach((color) =>
    modifyChalkOutput(color, chalkTransform)
  );

  return from(setup()).pipe(
    switchMap(({ projectRoot, inlineOptions }) => {
      checkUnsupportedConfig(context, projectRoot);

      const service = new Service(getSystemPath(projectRoot), {
        pkg: resolvePkg(context.workspaceRoot),
        inlineOptions,
      });
      const buildOptions = {
        mode: 'production',
        dest: getSystemPath(
          join(normalize(context.workspaceRoot), options.dest)
        ),
        clean: options.clean,
        report: options.report,
        'report-json': options.reportJson,
        'skip-plugins': options.skipPlugins,
        target: 'lib',
        entry: getSystemPath(
          join(normalize(context.workspaceRoot), options.entry)
        ),
        'inline-vue': options.inlineVue,
        watch: options.watch,
        formats: options.formats,
        name: options.name || context.target.project,
        filename: options.filename,
      };

      return options.watch
        ? new Observable((obs) => {
            service
              .run('build', buildOptions, ['build'])
              .then((success) => obs.next(success))
              .catch((err) => obs.error(err));
          })
        : from(service.run('build', buildOptions, ['build']));
    }),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
