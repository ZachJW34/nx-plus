import { readWorkspaceConfig } from '@nx/workspace';
import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';

import {
  ensureDirSync,
  readFileSync,
  removeSync,
  writeFileSync,
} from 'fs-extra';
import { dirname } from 'path';
import { getPublishableLibNames, tmpProjPath } from './utils';

const nrwlVersion =
  require('../../package.json').devDependencies['@nx/workspace'];

console.log('\nCreating playground. This may take a few minutes.');

const workspaceConfig = readWorkspaceConfig({ format: 'nx' });

const publishableLibNames = getPublishableLibNames(workspaceConfig);

execSync(`yarn nx run-many --target build --projects ${publishableLibNames}`, {
  stdio: 'inherit',
});

ensureDirSync(tmpProjPath());

removeSync(tmpProjPath());

execSync(
  `node ${require.resolve('@nrwl/tao')} new proj --nx-workspace-root=${dirname(
    tmpProjPath()
  )} --no-interactive --skip-install --collection=@nx/workspace --npmScope=proj --preset=empty --package-manager=yarn`,
  { cwd: dirname(tmpProjPath()), stdio: 'inherit' }
);

publishableLibNames.forEach((pubLibName) => {
  const { outputPath, packageJson } =
    workspaceConfig.projects[pubLibName].targets?.build.options;
  const p = JSON.parse(readFileSync(tmpProjPath('package.json')).toString());
  p.devDependencies[
    require(`${workspaceRoot}/${packageJson}`).name
  ] = `file:${workspaceRoot}/${outputPath}`;
  writeFileSync(tmpProjPath('package.json'), JSON.stringify(p, null, 2));
});

const peerDeps = ['@nx/cypress', '@nx/cypress', '@nx/linter'].map(
  (dep) => `${dep}@${nrwlVersion}`
);

execSync(`yarn add -D ${peerDeps.join(' ')}`, {
  cwd: tmpProjPath(),
  stdio: 'inherit',
});

console.log(`\nCreated playground at ${tmpProjPath()}`);
