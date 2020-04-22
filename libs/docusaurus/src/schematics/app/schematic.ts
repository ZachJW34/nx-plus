import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  Tree,
  url
} from '@angular-devkit/schematics';
import {
  addProjectToNxJsonInTree,
  insert,
  names,
  offsetFromRoot,
  projectRootDir,
  ProjectType,
  toFileName,
  updateWorkspace
} from '@nrwl/workspace';
import { InsertChange } from '@nrwl/workspace/src/utils/ast-utils';
import { AppSchematicSchema } from './schema';

/**
 * Depending on your needs, you can change this to either `Library` or `Application`
 */
const projectType = ProjectType.Application;

interface NormalizedSchema extends AppSchematicSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  options: AppSchematicSchema
): NormalizedSchema {
  const name = toFileName(options.name);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${projectRootDir(projectType)}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map(s => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags
  };
}

function addFiles(options: NormalizedSchema): Rule {
  return mergeWith(
    apply(url(`./files`), [
      applyTemplates({
        ...options,
        ...names(options.name),
        offsetFromRoot: offsetFromRoot(options.projectRoot)
      }),
      move(options.projectRoot)
    ])
  );
}

function updateGitIgnore(projectRoot: string, tree: Tree): Tree {
  const gitIgnorePath = '.gitignore';
  const gitIgnoreSource = tree.read(gitIgnorePath).toString('utf-8');
  insert(tree, gitIgnorePath, [
    new InsertChange(
      gitIgnorePath,
      gitIgnoreSource.length,
      `
# Generated Docusaurus files
/${projectRoot}/.docusaurus
/${projectRoot}/.cache-loader
`
    )
  ]);
  return tree;
}

export default function(options: AppSchematicSchema): Rule {
  const normalizedOptions = normalizeOptions(options);
  return chain([
    updateWorkspace(workspace => {
      const targets = workspace.projects.add({
        name: normalizedOptions.projectName,
        root: normalizedOptions.projectRoot,
        sourceRoot: `${normalizedOptions.projectRoot}/src`,
        projectType
      }).targets;
      targets.add({
        name: 'docusaurus',
        builder: '@nx-plus/docusaurus:docusaurus',
        options: {
          port: 3000
        }
      });
      targets.add({
        name: 'build-docusaurus',
        builder: '@nx-plus/docusaurus:build-docusaurus',
        options: {
          outputPath: `dist/docusaurus/${normalizedOptions.projectName}`
        }
      });
    }),
    addProjectToNxJsonInTree(normalizedOptions.projectName, {
      tags: normalizedOptions.parsedTags
    }),
    addFiles(normalizedOptions),
    tree => updateGitIgnore(normalizedOptions.projectRoot, tree)
  ]);
}
