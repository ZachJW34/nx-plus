import { JsonObject } from '@angular-devkit/core';

export interface DevServerBuilderSchema extends JsonObject {
  open: boolean;
  copy: boolean;
  stdin: boolean;
  optimization?: boolean;
  host: string;
  port: number;
  ssl: boolean;
  publicHost?: string;
  skipPlugins?: string;
  browserTarget: string;
  watch: boolean;
}
