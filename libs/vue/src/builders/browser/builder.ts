import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BrowserBuilderSchema } from './schema';
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
  modifyTsConfigPaths,
  modifyTypescriptAliases
} from '../../webpack';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Service = require('@vue/cli-service/lib/Service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvePkg } = require('@vue/cli-shared-utils/lib/pkg');

export function runBuilder(
  options: BrowserBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  async function setup(): Promise<{
    projectRoot: string;
    inlineOptions;
  }> {
    const projectRoot = await getProjectRoot(context);
    const projectSourceRoot = await getProjectSourceRoot(context);

    const normalizedAssetPatterns = getNormalizedAssetPatterns(
      options,
      context,
      projectRoot,
      projectSourceRoot
    );

    const inlineOptions = {
      pluginOptions: {
        'style-resources-loader': {
          preProcessor: 'scss',
          patterns: [
            `${path.join(projectSourceRoot, 'app/styles/_variables.scss')}`,
            `${path.join(projectSourceRoot, 'app/styles/_mixins.scss')}`
          ]
        }
      },
      chainWebpack: config => {
        modifyIndexHtmlPath(config, options, context);
        modifyEntryPoint(config, options, context);
        modifyTsConfigPaths(config, options, context);
        modifyCachePaths(config, context);
        modifyCopyAssets(config, options, context, normalizedAssetPatterns);
        addFileReplacements(config, options, context);
        modifyFilenameHashing(config, options);
        modifyTypescriptAliases(config, options, context);
      },
      // This option is used instead of `dest` because Vue CLI will
      // overwrite our modified `CopyWebpackPlugin` config when `dest`
      // is defined.
      // https://github.com/vuejs/vue-cli/blob/c64afc3c2a8854aae30fbfb85e92c0bb8b07bad7/packages/%40vue/cli-service/lib/commands/build/resolveAppConfig.js#L6
      outputDir: getSystemPath(
        join(normalize(context.workspaceRoot), options.outputPath)
      ),
      css: {
        extract: options.extractCss
      },
      lintOnSave: false
    };

    return {
      projectRoot,
      inlineOptions
    };
  }

  return from(setup()).pipe(
    switchMap(({ projectRoot, inlineOptions }) => {
      const service = new Service(projectRoot, {
        pkg: resolvePkg(context.workspaceRoot),
        inlineOptions
      });
      const buildOptions = {
        mode: options.optimization ? 'production' : 'development',
        dest: undefined,
        modern: false,
        'unsafe-inline': true,
        clean: options.deleteOutputPath,
        report: options.report,
        'report-json': options.reportJson,
        'skip-plugins': options.skipPlugins,
        watch: options.watch
      };

      if (options.watch) {
        return new Observable(obs => {
          service
            .run('build', buildOptions, ['build'])
            .then(success => obs.next(success))
            .catch(err => obs.error(err));
        });
      }

      return from(service.run('build', buildOptions, ['build']));
    }),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
