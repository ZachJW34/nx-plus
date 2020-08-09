const { readWorkspaceJson } = require('@nrwl/workspace');

function getPublishableLibNames(workspaceJson = readWorkspaceJson()) {
  const { projects } = workspaceJson;
  return Object.keys(projects).filter(
    (key) =>
      projects[key].projectType === 'library' &&
      projects[key].architect &&
      projects[key].architect.build &&
      projects[key].architect.build.builder === '@nrwl/node:package'
  );
}

module.exports.getPublishableLibNames = getPublishableLibNames;

function tmpProjPath(path) {
  return path
    ? `${process.cwd()}/tmp/nx-playground/proj/${path}`
    : `${process.cwd()}/tmp/nx-playground/proj`;
}

module.exports.tmpProjPath = tmpProjPath;
