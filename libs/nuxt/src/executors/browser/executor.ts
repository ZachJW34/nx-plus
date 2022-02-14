import { build, loadNuxt } from 'nuxt';
import { BrowserExecutorSchema } from './schema';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';
import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';

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
          extend(config, ctx) {
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
    yield {
      success: false,
      error: err,
    };
  }
}
