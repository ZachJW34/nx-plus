# Nx Plus VuePress

> First class support for [VuePress](https://vuepress.vuejs.org/) in your [Nx](https://nx.dev/) workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/vuepress/nx-plus-vuepress.png">
</div>

## Contents

- [Prerequisite](#prerequisite)
- [Getting Started](#getting-started)
- [Generators (i.e. code generation)](#generators-ie-code-generation)
- [Executors (i.e. task runners)](#executors-ie-task-runners)
- [Updating Nx Plus VuePress](#updating-nx-plus-vuepress)

## Prerequisite

If you have not already, [create an Nx workspace](https://github.com/nrwl/nx#creating-an-nx-workspace) with the following:

```
npx create-nx-workspace@^11.0.0
```

## Getting Started

### Install Plugin

```
# npm
npm install @nx-plus/vuepress --save-dev

# yarn
yarn add @nx-plus/vuepress --dev
```

### Generate Your App

```
nx g @nx-plus/vuepress:app my-app
```

### Serve Your App

```
nx serve my-app
```

## Generators (i.e. code generation)

### Application

`nx g @nx-plus/vuepress:app <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options             | Default | Description                                                      |
| ------------------- | ------- | ---------------------------------------------------------------- |
| `--tags`            | -       | Tags to use for linting (comma-delimited).                       |
| `--directory`       | `apps`  | A directory where the project is placed.                         |
| `--vuepressVersion` | `1`     | The version of VuePress that you want to start the project with. |
| `--skipFormat`      | `false` | Skip formatting files.                                           |

## Executors (i.e. task runners)

### Dev Server

`nx serve <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options   | Default   | Description                             |
| --------- | --------- | --------------------------------------- |
| `--port`  | `8080`    | Use specified port.                     |
| `--host`  | `0.0.0.0` | Use specified host.                     |
| `--debug` | `false`   | Start development server in debug mode. |
| `--open`  | `false`   | Open browser when ready.                |

### Browser

`nx build <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options   | Default | Description                              |
| --------- | ------- | ---------------------------------------- |
| `--dest`  | -       | Specify build output dir.                |
| `--debug` | `false` | Build in development mode for debugging. |

## Updating Nx Plus VuePress

Nx Plus VuePress provides migrations which help you stay up to date with the latest version of Nx Plus VuePress.

Not only do we migrate the version of Nx Plus VuePress, but we also update the versions of dependencies which we install such as `vuepress`.

We recommend waiting for Nx Plus VuePress to update these dependencies for you as we verify that these versions work together.

### How to Migrate

#### Generate migrations.json

All you have to do to update Nx Plus VuePress to the latest version is run the following:

```
nx migrate @nx-plus/vuepress
nx migrate @nx-plus/vuepress@version # you can also specify version
```

This will fetch the specified version of `@nx-plus/vuepress`, analyze the dependencies and fetch all the dependent packages. The process will keep going until the whole tree of dependencies is resolved. This will result in:

- `package.json` being updated
- `migrations.json` being generated

At this point, no packages have been installed, and no other files have been touched.

Now, you can inspect `package.json` to see if the changes make sense and install the packages by running `npm install` or `yarn`.

#### Run Migrations

`migrations.json` contains the transformations that must run to prepare the workspace to the newly installed versions of packages. To run all the migrations, invoke:

```
nx migrate --run-migrations=migrations.json
```
