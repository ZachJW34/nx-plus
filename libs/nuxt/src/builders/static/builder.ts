import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { getSystemPath, join, normalize } from '@angular-devkit/core';
import { Nuxt, Builder, Generator, loadNuxtConfig } from 'nuxt';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaticBuilderSchema } from './schema';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';

export function runBuilder(
  options: StaticBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  const run = async () => {
    const projectRoot = await getProjectRoot(context);

    const config = await loadNuxtConfig({
      rootDir: getSystemPath(projectRoot),
      configOverrides: {
        dev: false,
        buildDir: getSystemPath(
          join(normalize(context.workspaceRoot), options.buildDir)
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

    const nuxt = new Nuxt(config);
    await nuxt.ready();
    const builder = new Builder(nuxt);
    const generator = new Generator(nuxt, builder);

    await generator.generate();
  };

  return from(run()).pipe(map(() => ({ success: true })));
}

export default createBuilder(runBuilder);
