import { JsonObject } from '@angular-devkit/core';

export interface BrowserBuilderSchema extends JsonObject {
  mode: 'development' | 'production';
  outputPath: string;
  modern: boolean;
  skipUnsafeInline: boolean;
  skipClean: boolean;
  report: boolean;
  reportJson: boolean;
  skipPlugins?: string;
  watch: boolean;
  index: string;
  main: string;
  tsConfig: string;
  assets: Array<string | AssetPattern>;
  fileReplacements: FileReplacementPattern[];
  outputHashing: 'none' | 'all' | 'media' | 'bundles';
}

interface AssetPattern {
  glob: string;
  input: string;
  ignore?: string[];
  output: string;
}

interface FileReplacementPattern {
  replace: string;
  with: string;
}
