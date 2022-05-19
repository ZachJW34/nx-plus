"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationSchematic = exports.applicationGenerator = void 0;
const tslib_1 = require("tslib");
const devkit_1 = require("@nrwl/devkit");
const run_tasks_in_serial_1 = require("@nrwl/workspace/src/utilities/run-tasks-in-serial");
const utils_1 = require("../../utils");
const path = require("path");
function normalizeOptions(tree, schema) {
    const name = devkit_1.names(schema.name).fileName;
    const projectDirectory = schema.directory
        ? `${devkit_1.names(schema.directory).fileName}/${name}`
        : name;
    const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
    const projectRoot = `${devkit_1.getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
    const parsedTags = schema.tags
        ? schema.tags.split(',').map((s) => s.trim())
        : [];
    return Object.assign(Object.assign({}, schema), { name,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags });
}
function addFiles(tree, options) {
    const templateOptions = Object.assign(Object.assign(Object.assign({}, options), devkit_1.names(options.name)), { offsetFromRoot: devkit_1.offsetFromRoot(options.projectRoot) });
    devkit_1.generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
    if (options.unitTestRunner === 'none') {
        const { path } = tree
            .listChanges()
            .find(({ path }) => path.includes('test/NuxtLogo.spec.js')) || {};
        if (path) {
            tree.delete(path);
        }
    }
}
function addEsLint(tree, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const eslintConfig = {
            env: {
                browser: true,
                node: true,
            },
            extends: [
                `${devkit_1.offsetFromRoot(options.projectRoot)}.eslintrc.json`,
                '@nuxtjs/eslint-config-typescript',
                'plugin:nuxt/recommended',
                'prettier',
            ],
            parserOptions: {
                extraFileExtensions: ['.vue'],
            },
            ignorePatterns: ['!**/*'],
            rules: {},
        };
        const { lintProjectGenerator, Linter } = yield Promise.resolve().then(() => require('@nrwl/linter'));
        const lintTask = yield lintProjectGenerator(tree, {
            linter: Linter.EsLint,
            project: options.projectName,
            eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,vue}`],
            skipFormat: true,
        });
        const content = JSON.stringify(eslintConfig, null, 2);
        const configPath = `${options.projectRoot}/.eslintrc.json`;
        tree.write(configPath, content);
        return [lintTask];
    });
}
function addJest(tree, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { jestProjectGenerator, jestInitGenerator } = yield Promise.resolve().then(() => require('@nrwl/jest'));
        const jestInitTask = yield jestInitGenerator(tree, { babelJest: false });
        const jestTask = yield jestProjectGenerator(tree, {
            project: options.projectName,
            setupFile: 'none',
            skipSerializers: true,
            supportTsx: true,
            testEnvironment: 'jsdom',
            babelJest: false,
        });
        devkit_1.updateJson(tree, `${options.projectRoot}/tsconfig.spec.json`, (json) => {
            json.include.push('**/*.spec.js');
            json.compilerOptions = Object.assign(Object.assign({}, json.compilerOptions), { esModuleInterop: true, allowJs: true, noEmit: true });
            return json;
        });
        const content = `
module.exports = {
  displayName: '${options.projectName}',
  preset: '${devkit_1.offsetFromRoot(options.projectRoot)}jest.preset.ts',
  transform: {
    '.*\\.(vue)$': '@vue/vue2-jest',
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'vue', 'json'],
  coverageDirectory: '${devkit_1.offsetFromRoot(options.projectRoot)}coverage/${options.projectRoot}',
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue',
  ],
  moduleNameMapper: {
    '^vue$': 'vue/dist/vue.common.js',
  },
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
    'vue-jest': { tsConfig: '${options.projectRoot}/tsconfig.spec.json' },
  },
};
`;
        tree.write(`${options.projectRoot}/jest.config.ts`, content);
        const installTask = devkit_1.addDependenciesToPackageJson(tree, {}, {
            '@vue/test-utils': '^1.0.3',
            'babel-core': '^7.0.0-bridge.0',
            '@vue/vue2-jest': '^27.0.0-alpha.1',
        });
        return [jestInitTask, jestTask, installTask];
    });
}
function addCypress(tree, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { cypressInitGenerator, cypressProjectGenerator } = yield Promise.resolve().then(() => require('@nrwl/cypress'));
        const { Linter } = yield Promise.resolve().then(() => require('@nrwl/linter'));
        const cypressInitTask = yield cypressInitGenerator(tree, {});
        const cypressTask = yield cypressProjectGenerator(tree, {
            project: options.projectName,
            name: options.name + '-e2e',
            directory: options.directory,
            linter: Linter.EsLint,
            js: false,
        });
        const appSpecPath = options.projectRoot + '-e2e/src/integration/app.spec.ts';
        tree.write(appSpecPath, `describe('${options.projectName}', () => {
  it('should display welcome message', () => {
    cy.visit('/')
    cy.contains('h2', 'Welcome to your Nuxt Application')
  });
});
`);
        return [cypressInitTask, cypressTask];
    });
}
function addPostInstall(tree) {
    return devkit_1.updateJson(tree, 'package.json', (json) => {
        const vuePostInstall = 'node node_modules/@nx-plus/nuxt/patch-nx-dep-graph.js';
        const { postinstall } = json.scripts || {};
        if (postinstall) {
            if (postinstall !== vuePostInstall) {
                devkit_1.logger.warn("We couldn't add our postinstall script. Without it Nx's dependency graph won't support Vue files. For more information see https://github.com/ZachJW34/nx-plus/tree/master/libs/vue#nx-dependency-graph-support");
            }
            return json;
        }
        json.scripts = Object.assign(Object.assign({}, json.scripts), { postinstall: vuePostInstall });
        return json;
    });
}
function applicationGenerator(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        utils_1.checkPeerDeps(schema);
        const options = normalizeOptions(tree, schema);
        devkit_1.addProjectConfiguration(tree, options.projectName, {
            root: options.projectRoot,
            projectType: 'application',
            sourceRoot: `${options.projectRoot}/src`,
            targets: {
                build: {
                    executor: '@nx-plus/nuxt:browser',
                    options: {
                        buildDir: `dist/${options.projectRoot}`,
                    },
                    configurations: {
                        production: {},
                    },
                },
                serve: {
                    executor: '@nx-plus/nuxt:server',
                    options: {
                        browserTarget: `${options.projectName}:build`,
                        dev: true,
                    },
                    configurations: {
                        production: {
                            browserTarget: `${options.projectName}:build:production`,
                            dev: false,
                        },
                    },
                },
                static: {
                    executor: '@nx-plus/nuxt:static',
                    options: {
                        browserTarget: `${options.projectName}:build:production`,
                    },
                },
            },
            tags: options.parsedTags,
        });
        addFiles(tree, options);
        const lintTasks = yield addEsLint(tree, options);
        const cypressTasks = options.e2eTestRunner === 'cypress' ? yield addCypress(tree, options) : [];
        const jestTasks = options.unitTestRunner === 'jest' ? yield addJest(tree, options) : [];
        const installTask = devkit_1.addDependenciesToPackageJson(tree, {
            'core-js': '^3.15.1',
            nuxt: '^2.15.7',
        }, {
            '@nuxtjs/eslint-config-typescript': '^9.0.0',
            '@nuxt/types': '^2.15.7',
            '@nuxt/typescript-build': '^2.1.0',
            'eslint-plugin-nuxt': '^3.2.0',
            'ts-loader': '^8.3.0',
        });
        addPostInstall(tree);
        if (!options.skipFormat) {
            yield devkit_1.formatFiles(tree);
        }
        return run_tasks_in_serial_1.runTasksInSerial(...lintTasks, ...cypressTasks, ...jestTasks, installTask);
    });
}
exports.applicationGenerator = applicationGenerator;
exports.applicationSchematic = devkit_1.convertNxGenerator(applicationGenerator);
//# sourceMappingURL=generator.js.map