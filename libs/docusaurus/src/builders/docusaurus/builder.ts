import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { start } from '@docusaurus/core/lib';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DocusaurusBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';

export function runBuilder(
  options: DocusaurusBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return from(getProjectRoot(context)).pipe(
    switchMap(
      projectRoot =>
        new Observable<any>(obs => {
          start(projectRoot, {
            port: options.port.toString(),
            host: options.host,
            hotOnly: options.hotOnly,
            open: options.open
          })
            .then(success => obs.next(success))
            .catch(err => obs.error(err));
        })
    ),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
