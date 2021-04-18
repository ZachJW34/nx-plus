import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import { DevServerExecutorSchema } from './schema';
import { isVuepress2 } from '../../utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { dev } = require('vuepress');

export default async function* runExecutor(
  options: DevServerExecutorSchema,
  context: ExecutorContext
) {
  const sourceDir = path.join(
    context.root,
    context.workspace.projects[context.projectName].root
  );

  if (isVuepress2(context)) {
    await dev(sourceDir, options);
  } else {
    await dev({ sourceDir, ...options });
  }

  yield { success: true };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise<{ success: boolean }>(() => {});
}
