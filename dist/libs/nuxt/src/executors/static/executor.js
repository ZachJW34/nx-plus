"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const devkit_1 = require("@nrwl/devkit");
const path = require("path");
const utils_1 = require("../../utils");
const webpack_1 = require("../../webpack");
const executor_1 = require("../browser/executor");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Builder, Generator, loadNuxtConfig, Nuxt } = require('nuxt');
const serverBuilderOverriddenKeys = [];
function runExecutor(options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* runExecutor_1() {
        try {
            const browserTarget = devkit_1.parseTargetString(options.browserTarget);
            const rawBrowserOptions = devkit_1.readTargetOptions(browserTarget, context);
            const overrides = Object.entries(options)
                .filter(([key, val]) => val !== undefined && serverBuilderOverriddenKeys.includes(key))
                .reduce((previous, [key, val]) => (Object.assign(Object.assign({}, previous), { [key]: val })), {});
            const browserOptions = Object.assign(Object.assign({}, rawBrowserOptions), overrides);
            yield tslib_1.__await(executor_1.default(browserOptions, context).next());
            const projectRoot = yield tslib_1.__await(utils_1.getProjectRoot(context));
            const config = yield tslib_1.__await(loadNuxtConfig({
                rootDir: projectRoot,
                configOverrides: {
                    dev: false,
                    buildDir: path.join(context.root, browserOptions.buildDir, '.nuxt'),
                    generate: {
                        dir: path.join(context.root, browserOptions.buildDir, 'dist'),
                    },
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
            const nuxt = new Nuxt(config);
            yield tslib_1.__await(nuxt.ready());
            const builder = new Builder(nuxt);
            const generator = new Generator(nuxt, builder);
            yield tslib_1.__await(generator.generate({ build: false }));
            yield yield tslib_1.__await({
                success: true,
            });
        }
        catch (error) {
            console.error(error);
            yield yield tslib_1.__await({
                success: false,
            });
        }
    });
}
exports.default = runExecutor;
//# sourceMappingURL=executor.js.map