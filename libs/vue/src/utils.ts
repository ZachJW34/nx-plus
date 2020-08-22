import { BuilderContext } from '@angular-devkit/architect';
import {
  getSystemPath,
  join,
  normalize,
  Path,
  resolve,
  virtualFs,
} from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { chalk } = require('@vue/cli-shared-utils');

export async function getProjectRoot(context: BuilderContext): Promise<Path> {
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  return resolve(
    normalize(context.workspaceRoot),
    normalize((projectMetadata.root as string) || '')
  );
}

export function modifyChalkOutput(
  method: string,
  transform: (arg: string) => string
) {
  const originalChalkFn = chalk[method];
  Object.defineProperty(chalk, method, {
    get() {
      const newChalkFn = (...args: string[]) =>
        originalChalkFn(...args.map(transform));
      Object.setPrototypeOf(newChalkFn, originalChalkFn);
      return newChalkFn;
    },
  });
}

export function checkUnsupportedConfig(
  context: BuilderContext,
  projectRoot: Path
): void {
  const host = new virtualFs.SyncDelegateHost(new NodeJsSyncHost());
  const packageJson = JSON.parse(
    virtualFs.fileBufferToString(
      host.read(join(normalize(context.workspaceRoot), 'package.json'))
    )
  );
  const vueConfigExists =
    host.exists(join(projectRoot, 'vue.config.js')) ||
    host.exists(join(projectRoot, 'vue.config.cjs'));
  const workspaceFileName = host.exists(
    join(normalize(context.workspaceRoot), 'workspace.json')
  )
    ? 'workspace.json'
    : 'angular.json';

  if (packageJson.vue || vueConfigExists) {
    throw new Error(
      `You must specify vue-cli config options in '${workspaceFileName}'.`
    );
  }
}

export function resolveConfigureWebpack(projectRoot: string) {
  const configureWebpackPath = join(
    normalize(projectRoot),
    'configure-webpack.js'
  );
  const host = new virtualFs.SyncDelegateHost(new NodeJsSyncHost());

  return host.exists(configureWebpackPath)
    ? require(getSystemPath(configureWebpackPath))
    : undefined;
}
