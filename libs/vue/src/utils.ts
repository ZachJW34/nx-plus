import { BuilderContext } from '@angular-devkit/architect';
import { normalize, resolve } from '@angular-devkit/core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { chalk } = require('@vue/cli-shared-utils');

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

export function modifyChalkOutput(
  method: string,
  transform: (arg: string) => string
) {
  const originalChalkFn = chalk[method];
  Object.defineProperty(chalk, method, {
    get() {
      const newChalkFn = (...args: string[]) =>
        originalChalkFn(...args.map(transform));
      Object.setPrototypeOf(newChalkFn, originalChalkFn);
      return newChalkFn;
    }
  });
}
