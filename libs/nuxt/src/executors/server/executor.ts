import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';
import { ServerExecutorSchema } from './schema';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { build, loadNuxt } = await import('nuxt');
const dynamicImport = new Function('specifier', 'return import(specifier)');

const serverBuilderOverriddenKeys: string[] = [];

export default async function* runExecutor(
  options: ServerExecutorSchema,
  context: ExecutorContext
) {
  const { loadNuxt, build } = (await dynamicImport(
    'nuxt'
  )) as typeof import('nuxt');
  const browserTarget = parseTargetString(options.browserTarget);
  const rawBrowserOptions = readTargetOptions(browserTarget, context);
  const overrides = Object.entries(options)
    .filter(
      ([key, val]) =>
        val !== undefined && serverBuilderOverriddenKeys.includes(key)
    )
    .reduce((previous, [key, val]) => ({ ...previous, [key]: val }), {});
  const browserOptions = { ...rawBrowserOptions, ...overrides };

  const projectRoot = await getProjectRoot(context);

  const nuxt = await loadNuxt({
    dev: options.dev,
    rootDir: projectRoot,
    config: {
      buildDir: path.join(context.root, browserOptions.buildDir, '.nuxt'),
      /*       build: {
        extend(config: Record<string, unknown>, ctx: Record<string, unknown>) {
          modifyTypescriptAliases(config, projectRoot);

          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { default: nuxtConfig } = require(path.join(
            projectRoot,
            'nuxt.config.ts'
          ));

          if (nuxtConfig.build && nuxtConfig.build.extend) {
            nuxtConfig.build.extend(config, ctx);
          }
        },
      }, */
    },
  });

  if (options.dev) {
    await build(nuxt);
  }

  const result = await nuxt.server();
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
