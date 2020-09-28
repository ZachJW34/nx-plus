# Contributing to Nx Plus

We would love for you to contribute to Nx Plus! Read this document to see how.

## Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by [submitting an issue](#submitting-an-issue). Even better, you can [submit a PR](#submitting-a-pr) with a fix.

## Project Structure

Source code and documentation are included in the top-level folders listed below:

| Folder  | Purpose                                          |
| ------- | ------------------------------------------------ |
| `apps`  | Contains the e2e tests associated with a plugin. |
| `libs`  | Contains the source code for plugins.            |
| `tools` | Contains miscellaneous scripts.                  |

## Building the Project

To install dependencies after cloning the repo, run the following:

```
yarn
```

To build all plugins, run the following:

```
nx run-many --target build --all
```

## Testing your Changes

To test your changes in a Nx workspace you can create a playground. To create a playground, run the following:

```
yarn create-playground
```

To update an existing playground, run the following:

```
yarn update-playground
```

### Running Unit Tests

To run unit tests for all plugins, run the following:

```
nx run-many --target test --all
```

To run unit tests for a specific plugin such as Vue, run the following:

```
nx test vue
```

### Running e2e Tests

To run e2e tests for all plugins, run the following:

```
nx run-many --target e2e --all
```

To run e2e tests for a specific plugin such as Vue, run the following:

```
nx e2e vue
```

## Submission Guidelines

### Submitting an Issue

Before submitting an issue please check that the issue you intend to create doesn't already exist. You can create new issues [here](https://github.com/ZachJW34/nx-plus/issues/new/choose).

### Submitting a PR

Before submitting a PR please check the following:

- Your code is properly formatted
  - To format all code, run `nx format:write --all`
- You haven't introduced any lint errors or warnings
- All unit tests are passing
- All e2e test are passing (this may take a while, so you can delegate this to CI)
