# Nx Plus Vue

> First class support for [Vue](https://vuejs.org/) in your [Nx](https://nx.dev/) workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/vue/nx-plus-vue.png">
</div>

## Contents

- [Prerequisite](#prerequisite)
- [Getting Started](#getting-started)
- [Nx Dependency Graph Support](#nx-dependency-graph-support)
- [Schematics (i.e. code generation)](#schematics-ie-code-generation)
- [Builders (i.e. task runners)](#builders-ie-task-runners)
- [Modify the Webpack Configuration](#modify-the-webpack-configuration)
- [Updating Nx Plus Vue](#updating-nx-plus-vue)

## Prerequisite

### Nx Workspace

If you have not already, [create an Nx workspace](https://github.com/nrwl/nx#creating-an-nx-workspace) with the following:

```
npx create-nx-workspace@^12.0.0
```

### Peer Dependencies

If you have not already, install peer dependencies with the following:

```
# npm
npm install @nrwl/cypress@^12.0.0 @nrwl/jest@^12.0.0 @nrwl/linter@^12.0.0 --save-dev

# yarn
yarn add @nrwl/cypress@^12.0.0 @nrwl/jest@^12.0.0 @nrwl/linter@^12.0.0 --dev
```

## Getting Started

### Install Plugin

```
# npm
npm install @nx-plus/vue --save-dev

# yarn
yarn add @nx-plus/vue --dev
```

### Generate Your App

```
nx g @nx-plus/vue:app my-app
```

### Serve Your App

```
nx serve my-app
```

## Nx Dependency Graph Support

**Nx's dep-graph does not support `.vue` files.** To patch support for `.vue` files, add the following npm script to your `package.json`:

```
"postinstall": "node node_modules/@nx-plus/vue/patch-nx-dep-graph.js"
```

**Help us!** We dislike this hack just as much as you do. Please give this Nx [issue](https://github.com/nrwl/nx/issues/2960) a 👍 so that we can remove this hack in the future.

## Schematics (i.e. code generation)

### Application

`nx g @nx-plus/vue:app <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options            | Default   | Description                                                    |
| ------------------ | --------- | -------------------------------------------------------------- |
| `--tags`           | -         | Tags to use for linting (comma-delimited).                     |
| `--directory`      | `apps`    | A directory where the project is placed.                       |
| `--style`          | `css`     | The file extension to be used for style files.                 |
| `--unitTestRunner` | `jest`    | Test runner to use for unit tests.                             |
| `--e2eTestRunner`  | `cypress` | Test runner to use for end to end (e2e) tests.                 |
| `--routing`        | `false`   | Generate routing configuration.                                |
| `--vueVersion`     | `2`       | The version of Vue.js that you want to start the project with. |
| `--skipFormat`     | `false`   | Skip formatting files.                                         |
| `--babel`          | `false`   | Add Babel support.                                             |

### Vuex

`nx g @nx-plus/vue:vuex <project> [options]`

| Arguments   | Description                                            |
| ----------- | ------------------------------------------------------ |
| `<project>` | The name of the project you would like to add Vuex to. |

| Options        | Default | Description            |
| -------------- | ------- | ---------------------- |
| `--skipFormat` | `false` | Skip formatting files. |

### Library

`nx g @nx-plus/vue:lib <name> [options]`

| Arguments | Description               |
| --------- | ------------------------- |
| `<name>`  | The name of your library. |

| Options            | Default | Description                                                    |
| ------------------ | ------- | -------------------------------------------------------------- |
| `--tags`           | -       | Tags to use for linting (comma-delimited).                     |
| `--directory`      | `libs`  | A directory where the project is placed.                       |
| `--unitTestRunner` | `jest`  | Test runner to use for unit tests.                             |
| `--skipFormat`     | `false` | Skip formatting files.                                         |
| `--skipTsConfig`   | `false` | Do not update tsconfig.json for development experience.        |
| `--vueVersion`     | `2`     | The version of Vue.js that you want to start the project with. |
| `--publishable`    | `false` | Create a buildable library.                                    |
| `--babel`          | `false` | Add Babel support.                                             |

### Component

`nx g @nx-plus/vue:component <name> [options]`

| Arguments | Description                 |
| --------- | --------------------------- |
| `<name>`  | The name of your component. |

| Options       | Default | Description                                    |
| ------------- | ------- | ---------------------------------------------- |
| `--project`   | -       | Tags to use for linting (comma-delimited).     |
| `--directory` | -       | A directory where the component is placed.     |
| `--style`     | `css`   | The file extension to be used for style files. |

## Builders (i.e. task runners)

### Dev Server

`nx serve <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options                      | Default       | Description                                                                                                                                                                                                                          |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--open`                     | `false`       | Open browser on server start.                                                                                                                                                                                                        |
| `--copy`                     | `false`       | Copy url to clipboard on server start.                                                                                                                                                                                               |
| `--stdin`                    | `false`       | Close when stdin ends.                                                                                                                                                                                                               |
| `--mode`                     | `development` | Specify env mode (default: development).                                                                                                                                                                                             |
| `--host`                     | `0.0.0.0`     | Specify host (default: 0.0.0.0).                                                                                                                                                                                                     |
| `--port`                     | `8080`        | Specify port (default: 8080).                                                                                                                                                                                                        |
| `--https`                    | `false`       | Use https (default: false).                                                                                                                                                                                                          |
| `--public`                   | -             | Specify the public network URL for the HMR client.                                                                                                                                                                                   |
| `--skipPlugins`              | -             | Comma-separated list of plugin names to skip for this run.                                                                                                                                                                           |
| `--browserTarget`            | -             | Target to serve.                                                                                                                                                                                                                     |
| `--watch`                    | `true`        | Watch for changes.                                                                                                                                                                                                                   |
| `--publicPath`               | `/`           | The base URL your application bundle will be deployed at.                                                                                                                                                                            |
| `--transpileDependencies`    | []            | By default babel-loader ignores all files inside node_modules. If you want to explicitly transpile a dependency with Babel, you can list it in this option.                                                                          |
| `css.requireModuleExtension` | `true`        | By default, only files that end in `*.module.[ext]` are treated as CSS modules. Setting this to `false` will allow you to drop `.module` in the filenames and treat all `*.(css\|scss\|sass\|less\|styl(us)?)` files as CSS modules. |
| `css.extract`                | `false`       | Whether to extract CSS in your components into a standalone CSS file (instead of inlined in JavaScript and injected dynamically).                                                                                                    |
| `css.sourceMap`              | `false`       | Whether to enable source maps for CSS. Setting this to `true` may affect build performance.                                                                                                                                          |
| `css.loaderOptions`          | `{}`          | Pass options to CSS-related loaders.                                                                                                                                                                                                 |
| `devServer`                  | `{}`          | All options for `webpack-dev-server` are supported.                                                                                                                                                                                  |

### Browser

`nx build <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options                      | Default       | Description                                                                                                                                                                                                                          |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--mode`                     | `development` | Specify env mode (default: development).                                                                                                                                                                                             |
| `--dest`                     | -             | Specify output directory.                                                                                                                                                                                                            |
| `--clean`                    | `true`        | Remove the dist directory before building the project.                                                                                                                                                                               |
| `--report`                   | `false`       | Generate report.html to help analyze bundle content.                                                                                                                                                                                 |
| `--reportJson`               | `false`       | Generate report.json to help analyze bundle content.                                                                                                                                                                                 |
| `--skipPlugins`              | -             | Comma-separated list of plugin names to skip for this run.                                                                                                                                                                           |
| `--watch`                    | `false`       | Watch for changes.                                                                                                                                                                                                                   |
| `--index`                    | -             | The path of a file to use for the application's HTML index. The filename of the specified path will be used for the generated file and will be created in the root of the application's configured output path.                      |
| `--main`                     | -             | The full path for the main entry point to the app, relative to the current workspace.                                                                                                                                                |
| `--tsConfig`                 | -             | The full path for the TypeScript configuration file, relative to the current workspace.                                                                                                                                              |
| `--publicPath`               | `/`           | The base URL your application bundle will be deployed at.                                                                                                                                                                            |
| `--filenameHashing`          | `false`       | Generated static assets contain hashes in their filenames for better caching control.                                                                                                                                                |
| `--productionSourceMap`      | `false`       | Setting this to `false` can speed up production builds if you don't need source maps for production.                                                                                                                                 |
| `--transpileDependencies`    | []            | By default babel-loader ignores all files inside node_modules. If you want to explicitly transpile a dependency with Babel, you can list it in this option.                                                                          |
| `css.requireModuleExtension` | `true`        | By default, only files that end in `*.module.[ext]` are treated as CSS modules. Setting this to `false` will allow you to drop `.module` in the filenames and treat all `*.(css\|scss\|sass\|less\|styl(us)?)` files as CSS modules. |
| `css.extract`                | `false`       | Whether to extract CSS in your components into a standalone CSS file (instead of inlined in JavaScript and injected dynamically).                                                                                                    |
| `css.sourceMap`              | `false`       | Whether to enable source maps for CSS. Setting this to `true` may affect build performance.                                                                                                                                          |
| `css.loaderOptions`          | `{}`          | Pass options to CSS-related loaders.                                                                                                                                                                                                 |
| `--stdin`                    | `false`       | Close when stdin ends.                                                                                                                                                                                                               |

### Library

`nx build <name> [options]`

| Arguments | Description               |
| --------- | ------------------------- |
| `<name>`  | The name of your library. |

| Options                      | Default                | Description                                                                                                                                                                                                                          |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--dest`                     | -                      | Specify output directory.                                                                                                                                                                                                            |
| `--clean`                    | `true`                 | Remove the dist directory before building the project.                                                                                                                                                                               |
| `--report`                   | `false`                | Generate report.html to help analyze bundle content.                                                                                                                                                                                 |
| `--reportJson`               | `false`                | Generate report.json to help analyze bundle content.                                                                                                                                                                                 |
| `--skipPlugins`              | -                      | Comma-separated list of plugin names to skip for this run.                                                                                                                                                                           |
| `--watch`                    | `false`                | Watch for changes.                                                                                                                                                                                                                   |
| `--entry`                    | -                      | The full path for the main entry point to your library, relative to the current workspace.                                                                                                                                           |
| `--tsConfig`                 | -                      | The full path for the TypeScript configuration file, relative to the current workspace.                                                                                                                                              |
| `--inlineVue`                | `false`                | Include the Vue module in the final bundle of library.                                                                                                                                                                               |
| `--formats`                  | `commonjs,umd,umd-min` | List of output formats for library builds.                                                                                                                                                                                           |
| `--name`                     | -                      | Name for library.                                                                                                                                                                                                                    |
| `--filename`                 | -                      | File name for output.                                                                                                                                                                                                                |
| `--transpileDependencies`    | []                     | By default babel-loader ignores all files inside node_modules. If you want to explicitly transpile a dependency with Babel, you can list it in this option.                                                                          |
| `css.requireModuleExtension` | `true`                 | By default, only files that end in `*.module.[ext]` are treated as CSS modules. Setting this to `false` will allow you to drop `.module` in the filenames and treat all `*.(css\|scss\|sass\|less\|styl(us)?)` files as CSS modules. |
| `css.extract`                | `true`                 | Whether to extract CSS in your components into a standalone CSS file (instead of inlined in JavaScript and injected dynamically).                                                                                                    |
| `css.sourceMap`              | `false`                | Whether to enable source maps for CSS. Setting this to `true` may affect build performance.                                                                                                                                          |
| `css.loaderOptions`          | `{}`                   | Pass options to CSS-related loaders.                                                                                                                                                                                                 |

### Linting

`nx lint <name> [options]`

We use `@nrwl/linter` for linting, so the options are as documented [here](https://github.com/nrwl/nx/tree/master/packages/linter).

### Unit Testing

`nx test <name> [options]`

We use `@nrwl/jest` for unit testing, so the options are as documented [here](https://github.com/nrwl/nx/tree/master/packages/jest).

### E2E Testing

`nx e2e <name> [options]`

We use `@nrwl/cypress` for e2e testing, so the options are as documented [here](https://github.com/nrwl/nx/tree/master/packages/cypress).

## Modify the Webpack Configuration

Modify the webpack config by exporting an Object or Function from your project's `configure-webpack.js` file.

> If your project does not have a `configure-webpack.js` file, then simply add it at the root of your project.

If the value is an Object, it will be merged into the final config using [`webpack-merge`](https://github.com/survivejs/webpack-merge).

If the value is a function, it will receive the resolved config as the argument. The function can either mutate the config and return nothing, OR return a cloned or merged version of the config.

For more information see the [Vue CLI documentation](https://cli.vuejs.org/config/#configurewebpack).

## Updating Nx Plus Vue

Nx Plus Vue provides migrations which help you stay up to date with the latest version of Nx Plus Vue.

Not only do we migrate the version of Nx Plus Vue, but we also update the versions of dependencies which we install such as `vue` and `vue-router`.

We recommend waiting for Nx Plus Vue to update these dependencies for you as we verify that these versions work together.

### How to Migrate

#### Generate migrations.json

All you have to do to update Nx Plus Vue to the latest version is run the following:

```
nx migrate @nx-plus/vue
nx migrate @nx-plus/vue@version # you can also specify version
```

This will fetch the specified version of `@nx-plus/vue`, analyze the dependencies and fetch all the dependent packages. The process will keep going until the whole tree of dependencies is resolved. This will result in:

- `package.json` being updated
- `migrations.json` being generated

At this point, no packages have been installed, and no other files have been touched.

Now, you can inspect `package.json` to see if the changes make sense and install the packages by running `npm install` or `yarn`.

#### Run Migrations

`migrations.json` contains the transformations that must run to prepare the workspace to the newly installed versions of packages. To run all the migrations, invoke:

```
nx migrate --run-migrations=migrations.json
```
