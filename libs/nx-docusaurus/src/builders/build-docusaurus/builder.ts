import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { build } from '@docusaurus/core/lib';
import { join, normalize } from '@angular-devkit/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BuildDocusaurusBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';

export function runBuilder(
  options: BuildDocusaurusBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return from(getProjectRoot(context)).pipe(
    switchMap(projectRoot =>
      from(
        build(projectRoot, {
          bundleAnalyzer: options.bundleAnalyzer,
          outDir: join(normalize(context.workspaceRoot), options.outputPath),
          minify: options.minify
        })
      )
    ),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
