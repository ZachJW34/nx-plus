import { JsonObject } from '@angular-devkit/core';

export interface BuildDocusaurusBuilderSchema extends JsonObject {
  bundleAnalyzer?: boolean;
  outputPath: string;
  minify?: boolean;
}
