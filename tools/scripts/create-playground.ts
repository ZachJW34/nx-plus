import { readWorkspaceConfig } from '@nrwl/workspace';
import { workspaceRoot } from '@nrwl/workspace/src/utils/app-root';
import { execSync } from 'child_process';

import {
  ensureDirSync,
  readFileSync,
  removeSync,
  writeFileSync,
} from 'fs-extra';
import { dirname } from 'path';
import { getPublishableLibNames, tmpProjPath } from './utils';

console.log('\nCreating playground. This may take a few minutes.');

const workspaceConfig = readWorkspaceConfig({ format: 'nx' });

const publishableLibNames = getPublishableLibNames(workspaceConfig);

execSync(`yarn nx run-many --target build --projects ${publishableLibNames}`);

ensureDirSync(tmpProjPath());

removeSync(tmpProjPath());

execSync(
  `node ${require.resolve('@nrwl/tao')} new proj --nx-workspace-root=${dirname(
    tmpProjPath()
  )} --no-interactive --skip-install --collection=@nrwl/workspace --npmScope=proj --preset=empty --package-manager=yarn`,
  { cwd: dirname(tmpProjPath()) }
);

publishableLibNames.forEach((pubLibName) => {
  const { outputPath, packageJson } =
    workspaceConfig.projects[pubLibName].targets.build.options;
  const p = JSON.parse(readFileSync(tmpProjPath('package.json')).toString());
  p.devDependencies[
    require(`${workspaceRoot}/${packageJson}`).name
  ] = `file:${workspaceRoot}/${outputPath}`;
  writeFileSync(tmpProjPath('package.json'), JSON.stringify(p, null, 2));
});

execSync('yarn install', {
  cwd: tmpProjPath(),
  stdio: ['ignore', 'ignore', 'ignore'],
});

console.log(`\nCreated playground at ${tmpProjPath()}.`);
