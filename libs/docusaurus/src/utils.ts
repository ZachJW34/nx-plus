import { BuilderContext } from '@angular-devkit/architect';
import { join } from 'path';

export async function getProjectRoot(context: BuilderContext): Promise<string> {
  const projectMetadata = await context.getProjectMetadata(
    context.target.project
  );
  return join(context.workspaceRoot, projectMetadata.root as string);
}
