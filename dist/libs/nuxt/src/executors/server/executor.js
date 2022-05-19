"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const devkit_1 = require("@nrwl/devkit");
const utils_1 = require("../../utils");
const webpack_1 = require("../../webpack");
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build, loadNuxt } = require('nuxt');
const serverBuilderOverriddenKeys = [];
function runExecutor(options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* runExecutor_1() {
        const browserTarget = devkit_1.parseTargetString(options.browserTarget);
        const rawBrowserOptions = devkit_1.readTargetOptions(browserTarget, context);
        const overrides = Object.entries(options)
            .filter(([key, val]) => val !== undefined && serverBuilderOverriddenKeys.includes(key))
            .reduce((previous, [key, val]) => (Object.assign(Object.assign({}, previous), { [key]: val })), {});
        const browserOptions = Object.assign(Object.assign({}, rawBrowserOptions), overrides);
        const projectRoot = yield tslib_1.__await(utils_1.getProjectRoot(context));
        const buildDir = options.buildDir || path.join(context.root, browserOptions.buildDir || '', '.nuxt');
        const nuxt = yield tslib_1.__await(loadNuxt({
            for: options.dev ? 'dev' : 'start',
            rootDir: projectRoot,
            configOverrides: {
                buildDir,
                build: {
                    extend(config, ctx) {
                        webpack_1.modifyTypescriptAliases(config, projectRoot);
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const { default: nuxtConfig } = require(path.join(projectRoot, 'nuxt.config.js'));
                        if (nuxtConfig.build && nuxtConfig.build.extend) {
                            nuxtConfig.build.extend(config, ctx);
                        }
                    },
                },
            },
        }));
        if (options.dev) {
            yield tslib_1.__await(build(nuxt));
        }
        const result = yield tslib_1.__await(nuxt.listen(nuxt.options.server.port));
        const baseUrl = options.dev ? nuxt.server.listeners[0].url : result.url;
        devkit_1.logger.info(`\nListening on: ${baseUrl}\n`);
        yield yield tslib_1.__await({
            success: true,
            baseUrl,
        });
        // This Promise intentionally never resolves, leaving the process running
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        yield tslib_1.__await(new Promise(() => { }));
    });
}
exports.default = runExecutor;
//# sourceMappingURL=executor.js.map