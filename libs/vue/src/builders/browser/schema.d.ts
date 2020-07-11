import { JsonObject } from '@angular-devkit/core';

export interface BrowserBuilderSchema extends JsonObject {
  mode: string;
  dest: string;
  clean: boolean;
  report: boolean;
  reportJson: boolean;
  skipPlugins?: string;
  watch: boolean;
  index: string;
  main: string;
  tsConfig: string;
}
