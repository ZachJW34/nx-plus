import { BrowserExecutorSchema } from './schema';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';
import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build, loadNuxt } = require('nuxt');

export default async function* runExecutor(
  options: BrowserExecutorSchema,
  context: ExecutorContext
) {
  try {
    const projectRoot = await getProjectRoot(context);
    const nuxt = await loadNuxt({
      for: 'build',
      rootDir: projectRoot,
      configOverrides: {
        buildDir: path.join(context.root, options.buildDir, '.nuxt'),
        build: {
          extend(
            config: Record<string, unknown>,
            ctx: Record<string, unknown>
          ) {
            modifyTypescriptAliases(config, projectRoot);

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { default: nuxtConfig } = require(path.join(
              projectRoot,
              'nuxt.config.js'
            ));

            if (nuxtConfig.build && nuxtConfig.build.extend) {
              nuxtConfig.build.extend(config, ctx);
            }
          },
        },
      },
    });

    await build(nuxt);

    yield {
      success: true,
    };
  } catch (err) {
    console.error(err);
    yield {
      success: false,
    };
  }
}
