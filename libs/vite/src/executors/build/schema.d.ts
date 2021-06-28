import { LogLevel } from 'vite';

export interface ViteBuildExecutorSchema {
  config: string;
  root?: string;
  base?: string;
  logLevel?: LogLevel;
  clearScreen?: boolean;
  debug?: string | boolean;
  filter?: string;
  target?: string;
  outDir?: string;
  assetsDir?: string;
  assetsInlineLimit?: number;
  ssr?: string;
  sourcemap?: boolean;
  minify?: string | boolean;
  manifest?: boolean;
  ssrManifest?: boolean;
  emptyOutDir?: boolean;
  mode?: string;
  watch?: boolean;
}
