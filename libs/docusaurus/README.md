# Nx Docusaurus

> First class support for [Docusaurus](https://v2.docusaurus.io/) in your Nx workspace.

<div align="center">
  <img src="https://raw.githubusercontent.com/ZachJW34/nx-plus/master/libs/docusaurus/nx-plus-docusaurus.png">
</div>

## Getting Started

### Add the Plugin

```
# With npm
npm install --save-dev @nx-plus/docusaurus

# With yarn
yarn add --dev @nx-plus/docusaurus
```

### Generate a Docusaurus application

```
nx g @nx-plus/docusaurus:app my-docs-app
```

### Serve the application

```
nx serve my-docs-app
```

### Build the application

```
nx build my-docs-app
```

## Usage

### Docusaurus schematic

`nx g @nx-plus/docusaurus:app <name> [...options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options        | Default | Description                                |
| -------------- | ------- | ------------------------------------------ |
| `--tags`       | -       | Tags to use for linting (comma-delimited). |
| `--directory`  | 'apps'  | A directory where the project is placed.   |
| `--skipFormat` | false   | Skip formatting files.                     |

### Docusaurus dev-server builder

`nx serve my-docs-app [...options]`

| Options     | Default     | Description                                          |
| ----------- | ----------- | ---------------------------------------------------- |
| `--port`    | 3000        | Use specified port.                                  |
| `--host`    | 'localhost' | Use specified host.                                  |
| `--hotOnly` | false       | Do not fallback to page refresh if hot reload fails. |
| `--open`    | false       | Open page in the browser.                            |

### Docusaurus browser builder

`nx build my-docs-app [...options]`

| Options            | Default | Description                                                                    |
| ------------------ | ------- | ------------------------------------------------------------------------------ |
| `--bundleAnalyzer` | false   | Visualize size of webpack output files with an interactive zoomable treemap.   |
| `--outputPath`     | -       | The full path for the new output directory, relative to the current workspace. |
| `--minify`         | true    | Build website minimizing JS bundles.                                           |

## Updating Nx Plus Docusaurus

Nx Plus Docusaurus provides migrations which help you stay up to date with the latest version of Nx Plus Docusaurus.

Not only do we migrate the version of Nx Plus Docusaurus, but we also update the versions of dependencies which we install such as `@docusaurus/core` and `react`.

We recommend waiting for Nx Plus Docusaurus to update these dependencies for you as we verify that these versions work together.

### How to Migrate

#### Generate migrations.json

All you have to do to update Nx Plus Docusaurus to the latest version is run the following:

```
nx migrate @nx-plus/docusaurus
nx migrate @nx-plus/docusaurus@version # you can also specify version
```

This will fetch the specified version of `@nx-plus/docusaurus`, analyze the dependencies and fetch all the dependent packages. The process will keep going until the whole tree of dependencies is resolved. This will result in:

- `package.json` being updated
- `migrations.json` being generated

At this point, no packages have been installed, and no other files have been touched.

Now, you can inspect `package.json` to see if the changes make sense and install the packages by running `npm install` or `yarn`.

#### Run Migrations

`migrations.json` contains the transformations that must run to prepare the workspace to the newly installed versions of packages. To run all the migrations, invoke:

```
nx migrate --run-migrations=migrations.json
```
