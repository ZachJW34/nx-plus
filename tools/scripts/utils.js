const { readWorkspaceJson } = require('@nrwl/workspace');
const { readPackageJson } = require('@nrwl/workspace/src/core/file-utils');
const semver = require('semver');

function getPublishableLibNames(workspaceJson = readWorkspaceJson()) {
  const { projects } = workspaceJson;
  return Object.keys(projects).filter(
    (key) =>
      projects[key].projectType === 'library' &&
      projects[key].targets &&
      projects[key].targets.build &&
      projects[key].targets.build.executor === '@nrwl/node:package'
  );
}

module.exports.getPublishableLibNames = getPublishableLibNames;

function tmpProjPath(path) {
  return path
    ? `${process.cwd()}/tmp/nx-playground/proj/${path}`
    : `${process.cwd()}/tmp/nx-playground/proj`;
}

module.exports.tmpProjPath = tmpProjPath;

function getNxVersion() {
  return semver.major(readPackageJson().devDependencies['@nrwl/workspace']);
}

module.exports.getNxVersion = getNxVersion;
