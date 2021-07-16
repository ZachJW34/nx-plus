import { createServer, ServerOptions } from 'vite';
import { ViteServerExecutorSchema } from './schema';
import { cleanViteOptions } from '../utils';

export default async function* runExecutor(options: ViteServerExecutorSchema) {
  const server = await createServer({
    base: options.base,
    mode: options.mode,
    configFile: options.config,
    logLevel: options.logLevel,
    clearScreen: options.clearScreen,
    server: cleanViteOptions(options) as ServerOptions,
  });
  await server.listen();
  yield {
    baseUrl: `http://localhost:${server.config.server.port}`,
    success: true,
  };
  // This Promise intentionally never resolves, leaving the process running
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise<{ success: boolean }>(() => {});
}
