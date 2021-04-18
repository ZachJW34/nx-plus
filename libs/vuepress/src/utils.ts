import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import * as semver from 'semver';

export function isVuepress2(context: ExecutorContext): boolean {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { devDependencies, dependencies } = require(path.join(
    context.root,
    'package.json'
  )) as {
    devDependencies?: { [key: string]: string };
    dependencies?: { [key: string]: string };
  };
  let vuepressVersion = devDependencies?.vuepress || dependencies?.vuepress;

  if (!vuepressVersion) {
    throw new Error(
      'Nx Plus failed to find vuepress listed in your package.json.'
    );
  }

  if (vuepressVersion.startsWith('^') || vuepressVersion.startsWith('~')) {
    vuepressVersion = vuepressVersion.substring(1);
  }

  if (!semver.valid(vuepressVersion)) {
    throw new Error(
      `Nx Plus failed to validate the vuepress version listed in your package.json: ${vuepressVersion}`
    );
  }

  return semver.major(vuepressVersion) === 2;
}
