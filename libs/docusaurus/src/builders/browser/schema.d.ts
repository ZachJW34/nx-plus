import { JsonObject } from '@angular-devkit/core';

export interface BrowserBuilderSchema extends JsonObject {
  bundleAnalyzer: boolean;
  outputPath: string;
  minify: boolean;
}
