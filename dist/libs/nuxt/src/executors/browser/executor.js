"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("../../utils");
const webpack_1 = require("../../webpack");
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build, loadNuxt } = require('nuxt');
function runExecutor(options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* runExecutor_1() {
        try {
            const projectRoot = yield tslib_1.__await(utils_1.getProjectRoot(context));
            const nuxt = yield tslib_1.__await(loadNuxt({
                for: 'build',
                rootDir: projectRoot,
                configOverrides: {
                    buildDir: path.join(context.root, options.buildDir, '.nuxt'),
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
            yield tslib_1.__await(build(nuxt));
            yield yield tslib_1.__await({
                success: true,
            });
        }
        catch (err) {
            console.error(err);
            yield yield tslib_1.__await({
                success: false,
            });
        }
    });
}
exports.default = runExecutor;
//# sourceMappingURL=executor.js.map