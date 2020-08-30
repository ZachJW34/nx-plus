# Nx Plus Nuxt

> First class support for [Nuxt](https://nuxtjs.org/) in your [Nx](https://nx.dev/) workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/nuxt/nx-plus-nuxt.png">
</div>

## Contents

- [Prerequisite](#prerequisite)
- [Getting Started](#getting-started)
- [Schematics (i.e. code generation)](#schematics-ie-code-generation)
- [Builders (i.e. task runners)](#builders-ie-task-runners)
- [Configuring Nuxt.js](#configuring-nuxtjs)
- [Updating Nx Plus Nuxt](#updating-nx-plus-nuxt)

## Prerequisite

If you have not already, [create an Nx workspace](https://github.com/nrwl/nx#creating-an-nx-workspace) with the following:

```
npx create-nx-workspace@^10.0.0
```

When creating your Nx workspace you may be prompted to choose a preset, **we do not support the `oss` preset at this time**.

## Getting Started

### Install Plugin

```
# npm
npm install @nx-plus/nuxt --save-dev

# yarn
yarn add @nx-plus/nuxt --dev
```

### Generate Your App

```
nx g @nx-plus/nuxt:app my-app
```

### Serve Your App

```
nx serve my-app
```

## Schematics (i.e. code generation)

### Application

`nx g @nx-plus/nuxt:app <name> [options]`

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

### Dev Server

`nx serve <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options           | Default | Description                                           |
| ----------------- | ------- | ----------------------------------------------------- |
| `--browserTarget` | -       | Target to serve.                                      |
| `--dev`           | `true`  | Define the development or production mode of Nuxt.js. |

### Browser

`nx build <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options      | Default | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| `--buildDir` | -       | Define the dist directory for your Nuxt.js application. |

### Configuring Nuxt.js

By default, Nuxt.js is configured to cover most use cases. This default configuration can be overwritten with the `nuxt.config.js` file. For more information see the [NuxtJS documentation](https://nuxtjs.org/guides/directory-structure/nuxt-config#nuxtconfigjs).

### Linting

`nx lint <name> [options]`

We use `@nrwl/linter` for linting, so the options are as documented [here](https://github.com/nrwl/nx/blob/master/docs/angular/api-linter/builders/lint.md#lint).

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
