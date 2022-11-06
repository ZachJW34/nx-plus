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

const dynamicImport = new Function('specifier', 'return import(specifier)');

// const Module = require('module');
// import Module from 'module';

export async function loadModule(
  request: string,
  context: string,
  force = false
) {
  const Module = (await dynamicImport('module')) as typeof import('module');
  const createRequire = Module.createRequire;

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

export async function checkPeerDeps(
  options: ApplicationGeneratorSchema
): Promise<void> {
  const expectedVersion = '^14.0.0';
  const unmetPeerDeps = [
    ...(options.e2eTestRunner === 'cypress' ? ['@nrwl/cypress'] : []),
    ...(options.unitTestRunner === 'jest' ? ['@nrwl/jest'] : []),
    '@nrwl/linter',
    '@nrwl/workspace',
  ].filter(async (dep) => {
    try {
      const { version } = await loadModule(
        `${dep}/package.json`,
        appRootPath,
        true
      );
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
