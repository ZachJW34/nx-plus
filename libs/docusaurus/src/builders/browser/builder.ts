import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { getSystemPath } from '@angular-devkit/core';
import { build } from '@docusaurus/core/lib';
import { join } from 'path';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BrowserBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';

export function runBuilder(
  options: BrowserBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  if (context.builder.builderName === 'build-docusaurus') {
    context.logger.warn(
      'The "@nx-plus/docusaurus:build-docusaurus" builder has been deprecated in favor of "@nx-plus/docusaurus:browser". Support will be removed in version 1.0.0.'
    );
  }

  return from(getProjectRoot(context)).pipe(
    switchMap((projectRoot) =>
      from(
        build(getSystemPath(projectRoot), {
          bundleAnalyzer: options.bundleAnalyzer,
          outDir: join(context.workspaceRoot, options.outputPath),
          minify: options.minify,
        })
      )
    ),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
