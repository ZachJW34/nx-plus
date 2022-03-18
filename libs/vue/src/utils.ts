import { ExecutorContext, logger } from '@nrwl/devkit';
import { constants as FS_CONSTANTS } from 'fs';
import { access, readFile } from 'fs/promises';
import * as path from 'path';
import * as semver from 'semver';
import { appRootPath } from './app-root';
import { ApplicationGeneratorSchema } from './generators/application/schema';

const readFileToString = (path: string) =>
  readFile(path).then((res) => res.toString());

const exists = (path: string) =>
  access(path, FS_CONSTANTS.F_OK)
    .then(() => true)
    .catch(() => false);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { chalk } = require('@vue/cli-shared-utils');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');

export function getProjectRoot(context: ExecutorContext) {
  return path.join(
    context.root,
    context.workspace.projects[context.projectName].root
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

export async function checkUnsupportedConfig(
  context: ExecutorContext,
  projectRoot: string
) {
  const packageJson = JSON.parse(
    await readFileToString(path.join(context.root, 'package.json'))
  );
  const vueConfigExists =
    (await exists(path.join(projectRoot, 'vue.config.js'))) ||
    (await exists(path.join(projectRoot, 'vue.config.cjs')));

  const workspaceFileName = (await exists(
    path.join(context.root, 'workspace.json')
  ))
    ? 'workspace.json'
    : 'angular.json';

  if (packageJson.vue || vueConfigExists) {
    throw new Error(
      `You must specify vue-cli config options in '${workspaceFileName}'.`
    );
  }
}

export async function resolveConfigureWebpack(projectRoot: string) {
  const configureWebpackPath = path.join(projectRoot, 'configure-webpack.js');

  return (await exists(configureWebpackPath))
    ? require(configureWebpackPath)
    : undefined;
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

export function checkPeerDeps(options: ApplicationGeneratorSchema): void {
  const expectedVersion = '^12.0.0';
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
    logger.warn(`
You have the following unmet peer dependencies:

${unmetPeerDeps
  .map((dep) => `${dep}@${expectedVersion}\n`)
  .join()
  .split(',')
  .join('')}
@nx-plus/vite may not work as expected.
    `);
  }
}

export async function getBabelConfig(
  projectRoot: string
): Promise<string | null> {
  const babelConfig = path.join(projectRoot, 'babel.config.js');

  return (await exists(babelConfig)) ? babelConfig : null;
}
