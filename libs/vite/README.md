# Nx Plus Vite

> First class support for [Vite](https://vitejs.dev/) in your [Nx](https://nx.dev/) workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/vite/nx-plus-vite.png">
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

| Options         | Default | Description                                                            |
| --------------- | ------- | ---------------------------------------------------------------------- |
| `--config`      | -       | Use specified config file.                                             |
| `--root`        | -       | Use specified root directory.                                          |
| `--base`        | '/'     | Public base path.                                                      |
| `--logLevel`    | -       | Change specificity of logging. One of: "silent","error", "warn", "all" |
| `--clearScreen` | `false` | Allow/disable clear screen when logging.                               |
| `--debug`       | `true`  | Show debug logs.                                                       |
| `--filter`      | -       | Filter debug log.                                                      |
| `--host`        | `true`  | Specify hostname.                                                      |
| `--port`        | `true`  | Specify port.                                                          |
| `--https`       | `true`  | Use TLS + HTTP/2.                                                      |
| `--open`        | `true`  | Open browser on startup.                                               |
| `--cors`        | `true`  | Enable cors.                                                           |
| `--strictPort`  | `true`  | Exit if specified port is already in use.                              |
| `--mode`        | `true`  | Set env mode.                                                          |
| `--force`       | `true`  | Force the optimizer to ignore the cache and re-bundle.                 |

### Browser

`nx build <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options      | Default | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| `--buildDir` | -       | Define the dist directory for your Nuxt.js application. |

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

## Updating Nx Plus Nuxt

Nx Plus Nuxt provides migrations which help you stay up to date with the latest version of Nx Plus Nuxt.

Not only do we migrate the version of Nx Plus Nuxt, but we also update the versions of dependencies which we install such as `nuxt` and `@nuxt/types`.

We recommend waiting for Nx Plus Nuxt to update these dependencies for you as we verify that these versions work together.

### How to Migrate

#### Generate migrations.json

All you have to do to update Nx Plus Nuxt to the latest version is run the following:

```
nx migrate @nx-plus/nuxt
nx migrate @nx-plus/nuxt@version # you can also specify version
```

This will fetch the specified version of `@nx-plus/nuxt`, analyze the dependencies and fetch all the dependent packages. The process will keep going until the whole tree of dependencies is resolved. This will result in:

- `package.json` being updated
- `migrations.json` being generated

At this point, no packages have been installed, and no other files have been touched.

Now, you can inspect `package.json` to see if the changes make sense and install the packages by running `npm install` or `yarn`.

#### Run Migrations

`migrations.json` contains the transformations that must run to prepare the workspace to the newly installed versions of packages. To run all the migrations, invoke:

```
nx migrate --run-migrations=migrations.json
```
