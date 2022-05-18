# Nx Plus Vite

> First class support for [Vite](https://vitejs.dev/) in your [Nx](https://nx.dev/) workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/vue/nx-plus-vue.png">
</div>

## Contents

- [Prerequisite](#prerequisite)
- [Getting Started](#getting-started)
- [Schematics (i.e. code generation)](#schematics-ie-code-generation)
- [Builders (i.e. task runners)](#builders-ie-task-runners)
- [Configuring Vite](#configuring-vite)
- [Updating Nx Plus Vite](#updating-nx-plus-vite)

## Prerequisite

### Nx Workspace

If you have not already, [create an Nx workspace](https://github.com/nrwl/nx#creating-an-nx-workspace) with the following:

```
npx create-nx-workspace@^14.0.0
```

### Peer Dependencies

If you have not already, install peer dependencies with the following:

```
# npm
npm install @nrwl/cypress@^14.0.0 @nrwl/jest@^14.0.0 @nrwl/linter@^14.0.0 --save-dev

# yarn
yarn add @nrwl/cypress@^14.0.0 @nrwl/jest@^14.0.0 @nrwl/linter@^14.0.0 --dev
```

## Getting Started

### Install Plugin

```
# npm
npm install @nx-plus/vite --save-dev

# yarn
yarn add @nx-plus/vite --dev
```

### Generate Your App

```
nx g @nx-plus/vite:app my-app
```

### Serve Your App

```
nx serve my-app
```

## Schematics (i.e. code generation)

### Application

`nx g @nx-plus/vite:app <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options            | Default   | Description                                    |
| ------------------ | --------- | ---------------------------------------------- |
| `--tags`           | -         | Tags to use for linting (comma-delimited).     |
| `--directory`      | `apps`    | A directory where the project is placed.       |
| `--unitTestRunner` | `jest`    | Test runner to use for unit tests.             |
| `--e2eTestRunner`  | `cypress` | Test runner to use for end to end (e2e) tests. |
| `--skipFormat`     | `false`   | Skip formatting files.                         |

## Builders (i.e. task runners)

### Server

`nx serve <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options        | Default | Description                                            |
| -------------- | ------- | ------------------------------------------------------ |
| `--config`     | -       | Use specified config file.                             |
| `--root`       | -       | Use specified root directory.                          |
| `--base`       | '/'     | Public base path.                                      |
| `--host`       | -       | Specify hostname.                                      |
| `--port`       | -       | Specify port.                                          |
| `--https`      | -       | Use TLS + HTTP/2.                                      |
| `--open`       | -       | Open browser on startup.                               |
| `--cors`       | -       | Enable cors.                                           |
| `--strictPort` | -       | Exit if specified port is already in use.              |
| `--mode`       | -       | Set env mode.                                          |
| `--force`      | -       | Force the optimizer to ignore the cache and re-bundle. |

### Build

`nx build <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options               | Default    | Description                                              |
| --------------------- | ---------- | -------------------------------------------------------- |
| `--config`            | -          | Use specified config file.                               |
| `--root`              | -          | Use specified root directory.                            |
| `--base`              | '/'        | Public base path.                                        |
| `--target`            | 'modules'  | Transpile target.                                        |
| `--outDir`            | -          | Output directory.                                        |
| `--assetsDir`         | '\_assets' | Directory under outDir to place assets in.               |
| `--assetsInlineLimit` | `4096`     | Static asset base64 inline threshold in bytes.           |
| `--ssr`               | -          | Build specified entry for server-side rendering.         |
| `--sourcemap`         | `false`    | Output source maps for build.                            |
| `--minify`            | 'esbuild'  | Enable/disable minification, or specify minifier to use. |
| `--manifest`          | -          | Emit build manifest json.                                |
| `--ssrManifest`       | -          | Emit ssr manifest json.                                  |
| `--emptyOutDir`       | -          | Force empty outDir when it's outside of root.            |
| `--mode`              | -          | Set env mode.                                            |
| `--force`             | -          | Force the optimizer to ignore the cache and re-bundle.   |
| `--watch`             | -          | Rebuilds when modules have changed on disk.              |

### Configuring Vite

A `vite.config.js` can be found at the root of your project. See the [Vite documentation](https://vitejs.dev/config/) for more details.

### Linting

`nx lint <name> [options]`

We use `@nrwl/linter` for linting, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-linter/builders/eslint.md#eslint).

### Unit Testing

`nx test <name> [options]`

We use `@nrwl/jest` for unit testing, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-jest/builders/jest.md#jest).

### E2E Testing

`nx e2e <name> [options]`

We use `@nrwl/cypress` for e2e testing, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-cypress/builders/cypress.md#cypress).
