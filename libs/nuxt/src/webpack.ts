import { getSystemPath, join, Path } from '@angular-devkit/core';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function modifyTypescriptAliases(config: any, projectRoot: Path): void {
  ['~~', '@@', '~', '@', 'assets', 'static'].forEach(
    (key) => delete config.resolve.alias[key]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    configFile: getSystemPath(join(projectRoot, 'tsconfig.json')),
    extensions: [...config.resolve.extensions, '.ts', '.tsx'],
  };

  if (config.resolve.mainFields) {
    options.mainFields = config.resolve.mainFields;
  }

  config.resolve.plugins = [
    ...(config.resolve.plugins || []),
    new TsconfigPathsPlugin(options),
  ];
}
