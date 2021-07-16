import { ViteBuildExecutorSchema } from './build/schema';
import { ViteServerExecutorSchema } from './server/schema';

export function cleanViteOptions(
  options: ViteServerExecutorSchema | ViteBuildExecutorSchema
) {
  const ret = { ...options };
  delete ret.debug;
  delete ret.filter;
  delete ret.config;
  delete ret.root;
  delete ret.base;
  delete ret.mode;
  delete ret.logLevel;
  delete ret.clearScreen;
  return ret;
}
