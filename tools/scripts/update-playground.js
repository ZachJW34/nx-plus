const { appRootPath } = require('@nrwl/workspace/src/utils/app-root');
const { execSync } = require('child_process');
const { copySync, removeSync } = require('fs-extra');
const { getPublishableLibNames, tmpProjPath } = require('./utils');

console.log('\nUpdating playground...');

const publishableLibNames = getPublishableLibNames();

execSync(`yarn nx run-many --target build --projects ${publishableLibNames}`);

removeSync(tmpProjPath('node_modules/@nx-plus'));

copySync(`${appRootPath}/dist/libs`, tmpProjPath('node_modules/@nx-plus'));

console.log('\nUpdate complete.');
