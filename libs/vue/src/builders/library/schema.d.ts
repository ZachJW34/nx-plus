import { JsonObject } from '@angular-devkit/core';

export interface LibraryBuilderSchema extends JsonObject {
  dest: string;
  clean: boolean;
  report: boolean;
  reportJson: boolean;
  skipPlugins?: string;
  watch: boolean;
  entry: string;
  tsConfig: string;
  inlineVue: boolean;
  css: {
    requireModuleExtension: boolean;
    extract: boolean | object;
    sourceMap: boolean;
    loaderOptions: object;
  };
  formats: string;
  name?: string;
  filename?: string;
}
