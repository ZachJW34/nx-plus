import {
  convertNxGenerator,
  formatFiles,
  generateFiles,
  names,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { ComponentGeneratorSchema } from './schema';
import path = require('path');

interface NormalizedSchema extends ComponentGeneratorSchema {
  name: string;
  componentPath: string;
}

function normalizeOptions(
  host: Tree,
  schema: ComponentGeneratorSchema
): NormalizedSchema {
  const name = names(schema.name).className;
  const { projectType, sourceRoot } = readProjectConfiguration(
    host,
    schema.project
  );
  // depending on projectType build destination path of component
  const componentPath =
    projectType === 'application'
      ? `${sourceRoot}/${names(schema.directory ?? '').fileName}`
      : `${sourceRoot}/lib/${names(schema.directory ?? '').fileName}`;

  return {
    ...schema,
    name,
    componentPath,
  };
}

function createComponent(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...names(options.name),
    ...options,
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.componentPath,
    templateOptions
  );
}

export async function componentGenerator(
  tree: Tree,
  schema: ComponentGeneratorSchema
) {
  const options = normalizeOptions(tree, schema);
  createComponent(tree, options);
  await formatFiles(tree);
}

export const componentSchematic = convertNxGenerator(componentGenerator);
