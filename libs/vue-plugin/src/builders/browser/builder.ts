import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { normalizeAssetPatterns } from '@angular-devkit/build-angular/src/utils';
import {
  getSystemPath,
  join,
  normalize,
  virtualFs
} from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BrowserBuilderSchema } from './schema';
import { getProjectRoot, getProjectSourceRoot } from '../../utils';
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

export function runBuilder(
  options: BrowserBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const requiredOptions = ['outputPath', 'index', 'main', 'tsConfig'];
  const missingOption = requiredOptions.find(
    requiredOption => !options[requiredOption]
  );

  if (missingOption) {
    context.logger.error(`Invalid options, "${missingOption}" is required.`);
    return of({ success: false });
  }

  async function setup(): Promise<{
    projectRoot: string;
    inlineOptions;
  }> {
    const projectRoot = await getProjectRoot(context);
    const projectSourceRoot = await getProjectSourceRoot(context);
    // https://github.com/angular/angular-cli/blob/v9.1.0/packages/angular_devkit/build_angular/src/browser/index.ts#L574
    const normalizedAssetPatterns = normalizeAssetPatterns(
      options.assets,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      new virtualFs.SyncDelegateHost(new NodeJsSyncHost()),
      normalize(context.workspaceRoot),
      normalize(projectRoot),
      projectSourceRoot === undefined ? undefined : normalize(projectSourceRoot)
    );

    const inlineOptions = {
      chainWebpack: config => {
        modifyIndexHtmlPath(config, options, context);
        modifyEntryPoint(config, options, context);
        modifyTsConfigPaths(config, options, context);
        modifyCachePaths(config, context);
        modifyCopyAssets(config, options, context, normalizedAssetPatterns);
        addFileReplacements(config, options, context);
        modifyFilenameHashing(config, options);
      },
      // This option is used instead of `dest` because Vue CLI will
      // overwrite our modified `CopyWebpackPlugin` config when `dest`
      // is defined.
      // https://github.com/vuejs/vue-cli/blob/c64afc3c2a8854aae30fbfb85e92c0bb8b07bad7/packages/%40vue/cli-service/lib/commands/build/resolveAppConfig.js#L6
      outputDir: getSystemPath(
        join(normalize(context.workspaceRoot), options.outputPath)
      )
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

      return from(
        service.run(
          'build',
          {
            mode: options.mode,
            dest: undefined,
            modern: options.modern,
            'no-unsafe-inline': options.skipUnsafeInline,
            'no-clean': options.skipClean,
            report: options.report,
            'report-json': options.reportJson,
            'skip-plugins': options.skipPlugins,
            watch: options.watch
          },
          ['build']
        )
      );
    }),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
