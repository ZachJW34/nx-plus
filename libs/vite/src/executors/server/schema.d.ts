export interface ViteServerExecutorSchema {
  config: string;
  root?: string;
  base?: string;
  logLevel?: LogLevel;
  clearScreen?: boolean;
  debug?: string | boolean;
  filter?: string;
  host?: string;
  port?: number;
  https?: boolean;
  open?: string | boolean;
  cors?: boolean;
  strictPort?: boolean;
  mode?: string;
  force?: boolean;
}
