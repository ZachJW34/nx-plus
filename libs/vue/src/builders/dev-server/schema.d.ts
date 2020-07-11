import { JsonObject } from '@angular-devkit/core';

export interface DevServerBuilderSchema extends JsonObject {
  open: boolean;
  copy: boolean;
  stdin: boolean;
  mode?: string;
  host: string;
  port: number;
  https: boolean;
  public?: string;
  skipPlugins?: string;
  browserTarget: string;
  watch: boolean;
}
