import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';
import { formatFiles, readWorkspace, updateWorkspace } from '@nrwl/workspace';
import { updateDocusaurusConfig } from '../update-0.4.0/update-0.4.0';

export default function update(): Rule {
  return chain([
    (tree: Tree) => {
      const workspace = readWorkspace(tree);
      return chain(
        Object.keys(workspace.projects).map((key) => {
          const project = workspace.projects[key];
          if (
            project.projectType === 'application' &&
            project.architect &&
            project.architect['build-docusaurus'] &&
            project.architect['build-docusaurus'].builder ===
              '@nx-plus/docusaurus:browser'
          ) {
            return updateDocusaurusConfig(
              `${project.root}/docusaurus.config.js`
            );
          }
          return noop();
        })
      );
    },
    updateWorkspace((workspace) => {
      workspace.projects.forEach((project) => {
        if (project.targets.has('docusaurus')) {
          const serveTarget = project.targets.get('docusaurus');
          project.targets.delete('docusaurus');
          project.targets.add({ name: 'serve', ...serveTarget });
        }
        if (project.targets.has('build-docusaurus')) {
          const buildTarget = project.targets.get('build-docusaurus');
          project.targets.delete('build-docusaurus');
          project.targets.add({ name: 'build', ...buildTarget });
        }
      });
    }),
    formatFiles(),
  ]);
}
