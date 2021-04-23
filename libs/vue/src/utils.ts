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
import { SchematicContext } from '@angular-devkit/schematics';
import * as path from 'path';
import * as semver from 'semver';
import { appRootPath } from './app-root';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { chalk } = require('@vue/cli-shared-utils');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');

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
  const vueNxConfigFileName = join(projectRoot, 'vue-nx.config.json');

  if (packageJson.vue || vueConfigExists) {
    throw new Error(
      `You must specify vue-cli config options in '${workspaceFileName}' or '${vueNxConfigFileName}'.`
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

export function resolveVueConfig(projectRoot: string) {
  const vueConfig = join(normalize(projectRoot), 'vue-nx.config.js');
  const host = new virtualFs.SyncDelegateHost(new NodeJsSyncHost());

  return host.exists(vueConfig) ? require(getSystemPath(vueConfig)) : undefined;
}

export function loadModule(request, context, force = false) {
  try {
    return createRequire(path.resolve(context, 'package.json'))(request);
  } catch (e) {
    const resolvedPath = require.resolve(request, { paths: [context] });
    if (resolvedPath) {
      if (force) {
        clearRequireCache(resolvedPath);
      }
      return require(resolvedPath);
    }
  }
}

// https://github.com/benmosher/eslint-plugin-import/pull/1591
// https://github.com/benmosher/eslint-plugin-import/pull/1602
// Polyfill Node's `Module.createRequireFromPath` if not present (added in Node v10.12.0)
// Use `Module.createRequire` if available (added in Node v12.2.0)
const createRequire =
  Module.createRequire ||
  Module.createRequireFromPath ||
  function (filename) {
    const mod = new Module(filename, null);
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(path.dirname(filename));

    mod._compile(`module.exports = require;`, filename);

    return mod.exports;
  };

function clearRequireCache(id, map = new Map()) {
  const module = require.cache[id];
  if (module) {
    map.set(id, true);
    // Clear children modules
    module.children.forEach((child) => {
      if (!map.get(child.id)) clearRequireCache(child.id, map);
    });
    delete require.cache[id];
  }
}

export function checkPeerDeps(context: SchematicContext, options): void {
  const expectedVersion = '^11.0.0';
  const unmetPeerDeps = [
    ...(options.e2eTestRunner === 'cypress' ? ['@nrwl/cypress'] : []),
    ...(options.unitTestRunner === 'jest' ? ['@nrwl/jest'] : []),
    '@nrwl/linter',
    '@nrwl/workspace',
  ].filter((dep) => {
    try {
      const { version } = loadModule(`${dep}/package.json`, appRootPath, true);
      return !semver.satisfies(version, expectedVersion);
    } catch (err) {
      return true;
    }
  });

  if (unmetPeerDeps.length) {
    context.logger.warn(`
You have the following unmet peer dependencies:

${unmetPeerDeps
  .map((dep) => `${dep}@${expectedVersion}\n`)
  .join()
  .split(',')
  .join('')}
@nx-plus/vue may not work as expected.
    `);
  }
}

export function getBabelConfig(projectRoot: string) {
  const babelConfig = join(normalize(projectRoot), 'babel.config.js');
  const host = new virtualFs.SyncDelegateHost(new NodeJsSyncHost());

  return host.exists(babelConfig) ? getSystemPath(babelConfig) : undefined;
}
