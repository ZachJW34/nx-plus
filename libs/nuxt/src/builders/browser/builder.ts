import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { build, loadNuxt } from 'nuxt';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BrowserBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';

export function runBuilder(
  options: BrowserBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function setup(): Promise<any> {
    const projectRoot = await getProjectRoot(context);
    const nuxt = await loadNuxt({
      for: 'build',
      rootDir: getSystemPath(projectRoot),
      configOverrides: {
        buildDir: getSystemPath(
          join(normalize(context.workspaceRoot), options.buildDir, '.nuxt')
        ),
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

    return nuxt;
  }

  return from(setup()).pipe(
    switchMap((nuxt) => from(build(nuxt))),
    map(() => ({ success: true }))
  );
}

export default createBuilder(runBuilder);
