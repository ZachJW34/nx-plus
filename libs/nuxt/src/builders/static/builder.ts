import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  scheduleTargetAndForget,
  targetFromTargetString,
} from '@angular-devkit/architect';
import {
  getSystemPath,
  join,
  JsonObject,
  normalize,
} from '@angular-devkit/core';
import { Nuxt, Builder, Generator, loadNuxtConfig } from 'nuxt';
import { concat, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaticBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';
import { BrowserBuilderSchema } from '../browser/schema';

const serverBuilderOverriddenKeys = [];

export function runBuilder(
  options: StaticBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const run = async () => {
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

    const config = await loadNuxtConfig({
      rootDir: getSystemPath(projectRoot),
      configOverrides: {
        dev: false,
        buildDir: getSystemPath(
          join(
            normalize(context.workspaceRoot),
            browserOptions.buildDir,
            '.nuxt'
          )
        ),
        generate: {
          dir: getSystemPath(
            join(
              normalize(context.workspaceRoot),
              browserOptions.buildDir,
              'dist'
            )
          ),
        },
        build: {
          extend(config, ctx) {
            modifyTypescriptAliases(config, projectRoot);

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { default: nuxtConfig } = require(getSystemPath(
              join(projectRoot, 'nuxt.config.js')
            ));

            if (nuxtConfig.build && nuxtConfig.build.extend) {
              nuxtConfig.build.extend(config, ctx);
            }
          },
        },
      },
    });

    const nuxt = new Nuxt(config);
    await nuxt.ready();
    const builder = new Builder(nuxt);
    const generator = new Generator(nuxt, builder);

    await generator.generate({ build: false });
  };

  return concat(
    scheduleTargetAndForget(
      context,
      targetFromTargetString(options.browserTarget)
    ),
    new Observable((obs) => {
      run()
        .then((success) => obs.next(success))
        .catch((err) => obs.error(err));
    })
  ).pipe(map(() => ({ success: true })));
}

export default createBuilder(runBuilder);
