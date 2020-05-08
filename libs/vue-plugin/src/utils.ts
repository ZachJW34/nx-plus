import { BuilderContext } from '@angular-devkit/architect';
import { normalize, resolve } from '@angular-devkit/core';

export async function getProjectRoot(context: BuilderContext): Promise<string> {
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  return resolve(
    normalize(context.workspaceRoot),
    normalize((projectMetadata.root as string) || '')
  );
}

export async function getProjectSourceRoot(
  context: BuilderContext
): Promise<string> {
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  const projectSourceRoot = projectMetadata.sourceRoot as string | undefined;
  return projectSourceRoot
    ? resolve(normalize(context.workspaceRoot), normalize(projectSourceRoot))
    : undefined;
}
