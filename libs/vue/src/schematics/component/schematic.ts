import { strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {
  formatFiles,
  getProjectConfig,
  ProjectType,
  toClassName,
  toFileName,
} from '@nrwl/workspace';
import { ComponentSchematicSchema } from './schema';

interface NormalizedSchema extends ComponentSchematicSchema {
  name: string;
  componentPath: string;
}

function normalizeOptions(
  host,
  options: ComponentSchematicSchema,
  _: SchematicContext
): NormalizedSchema {
  const name = toClassName(options.name);
  const { projectType, sourceRoot } = getProjectConfig(host, options.project);
  // depending on projectType build destination path of component
  const componentPath =
    projectType === ProjectType.Application
      ? `${sourceRoot}/${toFileName(options.directory ?? '')}`
      : `${sourceRoot}/lib/${toFileName(options.directory ?? '')}`;

  return {
    ...options,
    name,
    componentPath,
  };
}

function createComponent(options: NormalizedSchema): Rule {
  return mergeWith(
    apply(url(`./files`), [
      applyTemplates({
        ...options,
        ...strings,
        toClassName,
      }),
      move(options.componentPath),
    ])
  );
}

export default function (schema: ComponentSchematicSchema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(host, schema, context);
    return chain([
      createComponent(options),
      formatFiles({ skipFormat: false }),
    ]);
  };
}
