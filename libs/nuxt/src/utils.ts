import { BuilderContext } from '@angular-devkit/architect';
import { normalize, Path, resolve } from '@angular-devkit/core';

export async function getProjectRoot(context: BuilderContext): Promise<Path> {
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  return resolve(
    normalize(context.workspaceRoot),
    normalize((projectMetadata.root as string) || '')
  );
}
