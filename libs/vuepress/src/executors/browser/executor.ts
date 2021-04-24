import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import { BrowserExecutorSchema } from './schema';
import { isVuepress2 } from '../../utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build } = require('vuepress');

export default async function runExecutor(
  options: BrowserExecutorSchema,
  context: ExecutorContext
) {
  const sourceDir = path.join(
    context.root,
    context.workspace.projects[context.projectName].root
  );
  const buildOptions = {
    dest: path.join(context.root, options.dest),
    debug: options.debug,
  };

  if (isVuepress2(context)) {
    await build(sourceDir, buildOptions);
  } else {
    await build({ sourceDir, ...buildOptions });
  }

  return { success: true };
}
