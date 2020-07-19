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
nx run my-docs-app:docusaurus
```

### Build the application

```
nx run my-docs-app:build-docusaurus
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

### Docusaurus server builder

`nx run my-docs-app:docusaurus [...options]`

| Options     | Default     | Description                                          |
| ----------- | ----------- | ---------------------------------------------------- |
| `--port`    | 3000        | Use specified port.                                  |
| `--host`    | 'localhost' | Use specified host.                                  |
| `--hotOnly` | false       | Do not fallback to page refresh if hot reload fails. |
| `--open`    | false       | Open page in the browser.                            |

### Docusaurus build builder

`nx run my-docs-app:build-docusaurus [...options]`

| Options            | Default | Description                                                                    |
| ------------------ | ------- | ------------------------------------------------------------------------------ |
| `--bundleAnalyzer` | false   | Visualize size of webpack output files with an interactive zoomable treemap.   |
| `--outputPath`     | -       | The full path for the new output directory, relative to the current workspace. |
| `--minify`         | true    | Build website minimizing JS bundles.                                           |
