import { ExecutorContext, logger } from '@nrwl/devkit';
import * as path from 'path';
import * as semver from 'semver';
import { appRootPath } from './app-root';
import { ApplicationGeneratorSchema } from './generators/application/schema';

export function getProjectRoot(context: ExecutorContext) {
  return path.join(
    context.root,
    context.workspace.projects[context.projectName || ''].root
  );
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');

export function loadModule(request: string, context: string, force = false) {
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
  function (filename: string) {
    const mod = new Module(filename, null);
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(path.dirname(filename));

    mod._compile(`module.exports = require;`, filename);

    return mod.exports;
  };

function clearRequireCache(id: string, map = new Map()) {
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
  const expectedVersion = '^15.0.0';
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
