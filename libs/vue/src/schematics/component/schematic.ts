import { strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
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
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';
import { ComponentSchematicSchema } from './schema';

interface NormalizedSchema extends ComponentSchematicSchema {
  name: string;
  componentPath: string;
}

function normalizeOptions(
  host,
  options: ComponentSchematicSchema
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

export function componentSchematic(schema: ComponentSchematicSchema): Rule {
  return (host: Tree) => {
    const options = normalizeOptions(host, schema);
    return chain([
      createComponent(options),
      formatFiles({ skipFormat: false }),
    ]);
  };
}

export default componentSchematic;
export const componentGenerator = wrapAngularDevkitSchematic(
  '@nx-plus/vue',
  'component'
);
