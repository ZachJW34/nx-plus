import { build, BuildOptions } from 'vite';
import { ViteBuildExecutorSchema } from './schema';
import { cleanViteOptions } from '../utils';

export default async function* runExecutor(options: ViteBuildExecutorSchema) {
  try {
    await build({
      base: options.base,
      mode: options.mode,
      configFile: options.config,
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
      build: cleanViteOptions(options) as BuildOptions,
    });
    yield {
      success: true,
    };
    if (options.watch) {
      // This Promise intentionally never resolves, leaving the process running
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await new Promise<{ success: boolean }>(() => {});
    }
  } catch (err) {
    return {
      success: false,
      error: err,
    };
  }
}
