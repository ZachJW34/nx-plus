export interface DevServerExecutorSchema {
  open: boolean;
  copy: boolean;
  stdin?: boolean;
  mode?: string;
  host: string;
  port: number;
  https: boolean;
  public?: string;
  skipPlugins?: string;
  browserTarget: string;
  watch: boolean;
  publicPath?: string;
  css: {
    requireModuleExtension?: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    extract?: boolean | object;
    sourceMap?: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    loaderOptions: object;
  };
  // eslint-disable-next-line @typescript-eslint/ban-types
  devServer: object;
  transpileDependencies: string[];
}
