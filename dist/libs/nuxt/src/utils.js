"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPeerDeps = exports.loadModule = exports.getProjectRoot = void 0;
const devkit_1 = require("@nrwl/devkit");
const path = require("path");
const semver = require("semver");
const app_root_1 = require("./app-root");
function getProjectRoot(context) {
    return path.join(context.root, context.workspace.projects[context.projectName || ''].root);
}
exports.getProjectRoot = getProjectRoot;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
function loadModule(request, context, force = false) {
    try {
        return createRequire(path.resolve(context, 'package.json'))(request);
    }
    catch (e) {
        const resolvedPath = require.resolve(request, { paths: [context] });
        if (resolvedPath) {
            if (force) {
                clearRequireCache(resolvedPath);
            }
            return require(resolvedPath);
        }
    }
}
exports.loadModule = loadModule;
// https://github.com/benmosher/eslint-plugin-import/pull/1591
// https://github.com/benmosher/eslint-plugin-import/pull/1602
// Polyfill Node's `Module.createRequireFromPath` if not present (added in Node v10.12.0)
// Use `Module.createRequire` if available (added in Node v12.2.0)
const createRequire = Module.createRequire ||
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
            if (!map.get(child.id))
                clearRequireCache(child.id, map);
        });
        delete require.cache[id];
    }
}
function checkPeerDeps(options) {
    const expectedVersion = '^14.0.0';
    const unmetPeerDeps = [
        ...(options.e2eTestRunner === 'cypress' ? ['@nrwl/cypress'] : []),
        ...(options.unitTestRunner === 'jest' ? ['@nrwl/jest'] : []),
        '@nrwl/linter',
        '@nrwl/workspace',
    ].filter((dep) => {
        try {
            const { version } = loadModule(`${dep}/package.json`, app_root_1.appRootPath, true);
            return !semver.satisfies(version, expectedVersion);
        }
        catch (err) {
            return true;
        }
    });
    if (unmetPeerDeps.length) {
        devkit_1.logger.warn(`
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
exports.checkPeerDeps = checkPeerDeps;
//# sourceMappingURL=utils.js.map