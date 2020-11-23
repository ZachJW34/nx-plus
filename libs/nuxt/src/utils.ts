import { BuilderContext } from '@angular-devkit/architect';
import { normalize, Path, resolve } from '@angular-devkit/core';
import * as path from 'path';

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
