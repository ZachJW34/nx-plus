const { readWorkspaceJson } = require('@nrwl/workspace');
const { appRootPath } = require('@nrwl/workspace/src/utils/app-root');
const { execSync } = require('child_process');
const {
  ensureDirSync,
  readFileSync,
  removeSync,
  writeFileSync,
} = require('fs-extra');
const { getPublishableLibNames, tmpProjPath } = require('./utils');

console.log('\nCreating playground. This may take a few minutes.');

const workspaceJson = readWorkspaceJson();
const publishableLibNames = getPublishableLibNames(workspaceJson);

execSync(`yarn nx run-many --target build --projects ${publishableLibNames}`);

ensureDirSync(tmpProjPath());

removeSync(tmpProjPath());

execSync(
  'yarn create nx-workspace proj --no-interactive --skip-install --preset=empty --cli=nx --no-nx-cloud --package-manager=yarn',
  { cwd: './tmp/nx-playground' }
);

publishableLibNames.forEach((pubLibName) => {
  const { outputPath, packageJson } = workspaceJson.projects[
    pubLibName
  ].targets.build.options;
  const p = JSON.parse(readFileSync(tmpProjPath('package.json')).toString());
  p.devDependencies[
    require(`${appRootPath}/${packageJson}`).name
  ] = `file:${appRootPath}/${outputPath}`;
  writeFileSync(tmpProjPath('package.json'), JSON.stringify(p, null, 2));
});

execSync('yarn install', {
  cwd: tmpProjPath(),
  stdio: ['ignore', 'ignore', 'ignore'],
});

console.log(`\nCreated playground at ${tmpProjPath()}.`);
