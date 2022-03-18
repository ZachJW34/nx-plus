import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { build, loadNuxt } from 'nuxt';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';
import { ServerExecutorSchema } from './schema';
import * as path from 'path';

const serverBuilderOverriddenKeys = [];

export default async function* runExecutor(
  options: ServerExecutorSchema,
  context: ExecutorContext
) {
  const browserTarget = parseTargetString(options.browserTarget);
  const rawBrowserOptions = readTargetOptions(browserTarget, context);
  const overrides = Object.keys(options)
    .filter(
      (key) =>
        options[key] !== undefined && serverBuilderOverriddenKeys.includes(key)
    )
    .reduce((previous, key) => ({ ...previous, [key]: options[key] }), {});
  const browserOptions = { ...rawBrowserOptions, ...overrides };

  const projectRoot = await getProjectRoot(context);

  const nuxt = await loadNuxt({
    for: options.dev ? 'dev' : 'start',
    rootDir: projectRoot,
    configOverrides: {
      buildDir: path.join(context.root, browserOptions.buildDir, '.nuxt'),
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

  if (options.dev) {
    await build(nuxt);
  }

  console.log(nuxt);

  const result = await nuxt.listen(nuxt.options.server.port);
  const baseUrl = options.dev ? nuxt.server.listeners[0].url : result.url;

  logger.info(`\nListening on: ${baseUrl}\n`);

  yield {
    success: true,
    baseUrl,
  };

  // This Promise intentionally never resolves, leaving the process running
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise<{ success: boolean }>(() => {});
}
