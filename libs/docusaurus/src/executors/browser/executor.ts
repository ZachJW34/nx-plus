import { build } from '@docusaurus/core/lib';
import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import { join } from 'path';
import { BrowserExecutorSchema } from './schema';

export default async function* runExecutor(
  options: BrowserExecutorSchema,
  context: ExecutorContext
) {
  const projectRoot = path.join(
    context.root,
    context.projectsConfigurations?.projects?.[context?.projectName ?? '']
      ?.root ?? ''
  );

  try {
    await build(projectRoot, {
      bundleAnalyzer: options.bundleAnalyzer,
      outDir: join(context.root, options.outputPath),
      minify: options.minify,
    });

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
