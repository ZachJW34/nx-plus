import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString,
} from '@angular-devkit/architect';
import {
  getSystemPath,
  join,
  JsonObject,
  normalize,
} from '@angular-devkit/core';
import { build, loadNuxt } from 'nuxt';
import { concat, from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ServerBuilderSchema } from './schema';
import { BrowserBuilderSchema } from '../browser/schema';
import { getProjectRoot } from '../../utils';

const serverBuilderOverriddenKeys = [];

export function runBuilder(
  options: ServerBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function setup(): Promise<any> {
    const browserTarget = targetFromTargetString(options.browserTarget);
    const rawBrowserOptions = await context.getTargetOptions(browserTarget);
    const overrides = Object.keys(options)
      .filter(
        (key) =>
          options[key] !== undefined &&
          serverBuilderOverriddenKeys.includes(key)
      )
      .reduce((previous, key) => ({ ...previous, [key]: options[key] }), {});
    const browserName = await context.getBuilderNameForTarget(browserTarget);
    const browserOptions = await context.validateOptions<
      JsonObject & BrowserBuilderSchema
    >({ ...rawBrowserOptions, ...overrides }, browserName);

    const projectRoot = await getProjectRoot(context);

    const nuxt = await loadNuxt({
      for: options.dev ? 'dev' : 'start',
      rootDir: getSystemPath(projectRoot),
      configOverrides: {
        buildDir: getSystemPath(
          join(normalize(context.workspaceRoot), browserOptions.buildDir)
        ),
      },
    });

    return nuxt;
  }

  return from(setup()).pipe(
    switchMap((nuxt) =>
      options.dev
        ? concat(
            new Observable((obs) => {
              build(nuxt)
                .then((success) => obs.next(success))
                .catch((err) => obs.error(err));
            }),
            from(nuxt.listen(nuxt.options.server.port))
          )
        : new Observable((obs) => {
            nuxt
              .listen(nuxt.options.server.port)
              .then((success) => obs.next(success))
              .catch((err) => obs.error(err));
          })
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map((result: any) => {
      const baseUrl = options.dev
        ? result.nuxt.server.listeners[0].url
        : result.url;

      context.logger.info(`\nListening on: ${baseUrl}\n`);

      return {
        success: true,
        baseUrl,
      };
    })
  );
}

export default createBuilder(runBuilder);
