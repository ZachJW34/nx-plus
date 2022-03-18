export interface BrowserExecutorSchema {
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
  publicPath: string;
  filenameHashing: boolean;
  productionSourceMap: boolean;
  css: {
    requireModuleExtension: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    extract: boolean | object;
    sourceMap: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    loaderOptions: object;
  };
  stdin: boolean;
  transpileDependencies: string[];
}
