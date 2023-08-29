import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nx/devkit';
import * as path from 'path';
import { getProjectRoot } from '../../utils';
import { modifyTypescriptAliases } from '../../webpack';
import { default as browserExecutor } from '../browser/executor';
import { StaticExecutorSchema } from './schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Builder, Generator, loadNuxtConfig, Nuxt } = require('nuxt');

const serverBuilderOverriddenKeys: string[] = [];

export default async function* runExecutor(
  options: StaticExecutorSchema,
  context: ExecutorContext
) {
  try {
    const browserTarget = parseTargetString(options.browserTarget);
    const rawBrowserOptions = readTargetOptions(browserTarget, context);
    const overrides = Object.entries(options)
      .filter(
        ([key, val]) =>
          val !== undefined && serverBuilderOverriddenKeys.includes(key)
      )
      .reduce((previous, [key, val]) => ({ ...previous, [key]: val }), {});
    const browserOptions = { ...rawBrowserOptions, ...overrides };

    await browserExecutor(browserOptions, context).next();

    const projectRoot = await getProjectRoot(context);

    const config = await loadNuxtConfig({
      rootDir: projectRoot,
      configOverrides: {
        dev: false,
        buildDir: path.join(context.root, browserOptions.buildDir, '.nuxt'),
        generate: {
          dir: path.join(context.root, browserOptions.buildDir, 'dist'),
        },
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

    const nuxt = new Nuxt(config);
    await nuxt.ready();
    const builder = new Builder(nuxt);
    const generator = new Generator(nuxt, builder);

    await generator.generate({ build: false });

    yield {
      success: true,
    };
  } catch (error) {
    console.error(error);
    yield {
      success: false,
    };
  }
}
