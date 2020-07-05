# Nx Vue

> First class support for [Vue](https://vuejs.org/) in your Nx workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/vue/nx-plus-vue.png">
</div>

## Nx Dependency Graph Support

**Nx's dep-graph does not support `.vue` files.** To patch support for `.vue` files, add the following npm script to your `package.json`:

```
"postinstall": "node node_modules/@nx-plus/vue/patch-nx-dep-graph.js"
```

**Help us!** We dislike this hack just as much as you do. Please give this Nx [issue](https://github.com/nrwl/nx/issues/2960) a 👍 so that we can remove this hack in the future.

## Getting Started

### Add the Plugin

```
# With npm
npm install --save-dev @nx-plus/vue

# With yarn
yarn add --dev @nx-plus/vue
```

### Generate a Vue application

```
nx g @nx-plus/vue:app my-app
```

### Serve the application

```
nx serve my-app
```

### Build the application

```
nx build my-app
```

## Usage

### App schematic

`nx g @nx-plus/vue:app <name> [...options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options            | Default   | Description                                    |
| ------------------ | --------- | ---------------------------------------------- |
| `--tags`           | -         | Tags to use for linting (comma-delimited).     |
| `--directory`      | `apps`    | A directory where the project is placed.       |
| `--style`          | `css`     | The file extension to be used for style files. |
| `--unitTestRunner` | `jest`    | Test runner to use for unit tests.             |
| `--e2eTestRunner`  | `cypress` | Test runner to use for end to end (e2e) tests. |
| `--routing`        | `false`   | Generate routing configuration.                |
| `--skipFormat`     | `false`   | Skip formatting files.                         |

### Vuex schematic

`nx g @nx-plus/vue:vuex <project> [...options]`

| Arguments   | Description                                            |
| ----------- | ------------------------------------------------------ |
| `<project>` | The name of the project you would like to add Vuex to. |

| Options        | Default | Description            |
| -------------- | ------- | ---------------------- |
| `--skipFormat` | `false` | Skip formatting files. |

### Dev server builder

`nx serve my-app [...options]`

| Options           | Default   | Description                                                |
| ----------------- | --------- | ---------------------------------------------------------- |
| `--open`          | `false`   | Open browser on server start.                              |
| `--copy`          | `false`   | Copy url to clipboard on server start.                     |
| `--stdin`         | `false`   | Close when stdin ends.                                     |
| `--optimization`  | `false`   | Enables optimization of the build output.                  |
| `--host`          | `0.0.0.0` | Specify host (default: 0.0.0.0).                           |
| `--port`          | `4200`    | Specify port (default: 4200).                              |
| `--ssl`           | `false`   | Serve using HTTPS.                                         |
| `--publicHost`    | -         | Specify the public network URL for the HMR client.         |
| `--skipPlugins`   | -         | Comma-separated list of plugin names to skip for this run. |
| `--browserTarget` | -         | Target to serve.                                           |
| `--watch`         | `true`    | Watch for changes.                                         |

### Browser builder

`nx build my-app [...options]`

| Options              | Default | Description                                                                                                                                                                                                     |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--optimization`     | `false` | Enables optimization of the build output.                                                                                                                                                                       |
| `--outputPath`       | -       | Specify output directory.                                                                                                                                                                                       |
| `--deleteOutputPath` | `true`  | Delete the output path before building.                                                                                                                                                                         |
| `--report`           | `false` | Generate report.html to help analyze bundle content.                                                                                                                                                            |
| `--reportJson`       | `false` | Generate report.json to help analyze bundle content.                                                                                                                                                            |
| `--skipPlugins`      | -       | Comma-separated list of plugin names to skip for this run.                                                                                                                                                      |
| `--watch`            | `false` | Watch for changes.                                                                                                                                                                                              |
| `--index`            | -       | The path of a file to use for the application's HTML index. The filename of the specified path will be used for the generated file and will be created in the root of the application's configured output path. |
| `--main`             | -       | The full path for the main entry point to the app, relative to the current workspace.                                                                                                                           |
| `--tsConfig`         | -       | The full path for the TypeScript configuration file, relative to the current workspace.                                                                                                                         |
| `--assets`           | `[]`    | List of static application assets.                                                                                                                                                                              |
| `--fileReplacements` | `[]`    | Replace files with other files in the build.                                                                                                                                                                    |
| `--outputHashing`    | `none`  | Define the output filename cache-busting hashing mode.                                                                                                                                                          |
| `--extractCss`       | `false` | Extract css from global styles into css files instead of js ones.                                                                                                                                               |

### Lint builder

`nx lint my-app [...options]`

We use `@nrwl/linter` for linting, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-linter/builders/lint.md#lint).

### Jest builder

`nx test my-app [...options]`

We use `@nrwl/jest` for unit testing, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-jest/builders/jest.md#jest).

### Cypress builder

`nx e2e my-app-e2e [...options]`

We use `@nrwl/cypress` for e2e testing, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-cypress/builders/cypress.md#cypress).
