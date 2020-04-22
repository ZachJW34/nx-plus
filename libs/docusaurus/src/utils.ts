import { BuilderContext } from '@angular-devkit/architect';
import { join, normalize } from '@angular-devkit/core';

export async function getProjectRoot(context: BuilderContext): Promise<string> {
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  return join(normalize(context.workspaceRoot), projectMetadata.root as string);
}
