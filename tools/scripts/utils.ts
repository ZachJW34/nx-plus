export function getPublishableLibNames(workspaceJson: any) {
  const { projects } = workspaceJson;
  return Object.keys(projects).filter(
    (key) =>
      projects[key].projectType === 'library' &&
      projects[key].targets &&
      projects[key].targets.build &&
      projects[key].targets.build.executor === '@nx/js:tsc' &&
      // tmp
      key !== 'nuxt'
  );
}

export function tmpProjPath(path?: string) {
  return path
    ? `${process.cwd()}/tmp/nx-playground/proj/${path}`
    : `${process.cwd()}/tmp/nx-playground/proj`;
}
