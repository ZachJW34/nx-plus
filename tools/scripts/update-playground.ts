import { readWorkspaceConfig } from '@nrwl/workspace';
import { workspaceRoot } from '@nrwl/devkit';
import { execSync } from 'child_process';
import { copySync, removeSync } from 'fs-extra';
import { getPublishableLibNames, tmpProjPath } from './utils';

console.log('\nUpdating playground...');

const workspaceConfig = readWorkspaceConfig({ format: 'nx' });
const publishableLibNames = getPublishableLibNames(workspaceConfig);

execSync(`yarn nx run-many --target build --projects ${publishableLibNames}`);

removeSync(tmpProjPath('node_modules/@nx-plus'));

copySync(`${workspaceRoot}/dist/libs`, tmpProjPath('node_modules/@nx-plus'));

console.log('\nUpdate complete.');
