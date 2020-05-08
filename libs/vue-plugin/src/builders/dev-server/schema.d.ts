import { JsonObject } from '@angular-devkit/core';

export interface DevServerBuilderSchema extends JsonObject {
  open: boolean;
  copy: boolean;
  stdin: boolean;
  mode: 'development' | 'production';
  host: string;
  port: number;
  https: boolean;
  public: string;
  skipPlugins: string;
  buildTarget: string;
}
