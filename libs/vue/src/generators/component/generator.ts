import { ComponentGeneratorSchema } from './schema';
import {
  convertNxGenerator,
  formatFiles,
  generateFiles,
  names,
  readProjectConfiguration,
  Tree as DevkitTree,
} from '@nrwl/devkit';
import path = require('path');

interface NormalizedSchema extends ComponentGeneratorSchema {
  name: string;
  componentPath: string;
}

function normalizeOptions(
  host: DevkitTree,
  schema: ComponentGeneratorSchema
): NormalizedSchema {
  const name = names(schema.name).fileName;
  const { projectType, sourceRoot } = readProjectConfiguration(
    host,
    schema.name
  );
  // depending on projectType build destination path of component
  const componentPath =
    projectType === 'application'
      ? `${sourceRoot}/${names(schema.directory ?? '')}`
      : `${sourceRoot}/lib/${names(schema.directory ?? '')}`;

  return {
    ...schema,
    name,
    componentPath,
  };
}

function createComponent(tree: DevkitTree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.componentPath,
    templateOptions
  );
}

export async function componentGenerator(
  tree: DevkitTree,
  schema: ComponentGeneratorSchema
) {
  const options = normalizeOptions(tree, schema);
  createComponent(tree, options);
  await formatFiles(tree);
}

export const componentSchematic = convertNxGenerator(componentGenerator);
