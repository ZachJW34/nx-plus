export interface LibraryExecutorSchema {
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    extract: boolean | object;
    sourceMap: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    loaderOptions: object;
  };
  formats: string;
  name?: string;
  filename?: string;
  transpileDependencies: string[];
}
