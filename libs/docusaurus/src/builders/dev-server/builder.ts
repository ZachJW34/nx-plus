import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { start } from '@docusaurus/core/lib';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DevServerBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';

export function runBuilder(
  options: DevServerBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  if (context.builder.builderName === 'docusaurus') {
    context.logger.warn(
      'The "@nx-plus/docusaurus:docusaurus" builder has been deprecated in favor of "@nx-plus/docusaurus:dev-server". Support will be removed in version 1.0.0.'
    );
  }

  return from(getProjectRoot(context)).pipe(
    switchMap(
      (projectRoot) =>
        new Observable<any>((obs) => {
          start(projectRoot, {
            port: options.port.toString(),
            host: options.host,
            hotOnly: options.hotOnly,
            open: options.open,
          })
            .then((success) => obs.next(success))
            .catch((err) => obs.error(err));
        })
    ),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
