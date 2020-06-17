import { BuilderContext } from '@angular-devkit/architect';
import { normalizeAssetPatterns } from '@angular-devkit/build-angular/src/utils';
import { normalize, resolve, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { BrowserBuilderSchema } from './builders/browser/schema';

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

export function getNormalizedAssetPatterns(
  options: BrowserBuilderSchema,
  context: BuilderContext,
  projectRoot: string,
  projectSourceRoot: string
) {
  // https://github.com/angular/angular-cli/blob/v9.1.0/packages/angular_devkit/build_angular/src/browser/index.ts#L574
  return normalizeAssetPatterns(
    options.assets,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    new virtualFs.SyncDelegateHost(new NodeJsSyncHost()),
    normalize(context.workspaceRoot),
    normalize(projectRoot),
    projectSourceRoot === undefined ? undefined : normalize(projectSourceRoot)
  );
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
