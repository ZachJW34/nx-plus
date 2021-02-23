import { normalize } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  addProjectToNxJsonInTree,
  formatFiles,
  insert,
  names,
  offsetFromRoot,
  ProjectType,
  toFileName,
  updateWorkspace,
} from '@nrwl/workspace';
import { appsDir, InsertChange } from '@nrwl/workspace/src/utils/ast-utils';
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
  host: Tree,
  options: AppSchematicSchema
): NormalizedSchema {
  const name = toFileName(options.name);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = normalize(`${appsDir(host)}/${projectDirectory}`);
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    name,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(options: NormalizedSchema): Rule {
  return mergeWith(
    apply(url(`./files`), [
      applyTemplates({
        ...options,
        ...names(options.name),
        offsetFromRoot: offsetFromRoot(options.projectRoot),
      }),
      move(options.projectRoot),
    ])
  );
}

function updateGitIgnore(): Rule {
  return (tree: Tree) => {
    const gitIgnorePath = '.gitignore';

    if (!tree.exists(gitIgnorePath)) return;

    const gitIgnoreSource = tree
      .read(gitIgnorePath)
      .toString('utf-8')
      .trimRight();
    const ignorePatterns = ['.docusaurus/', '.cache-loader/'].filter(
      (ip) => !gitIgnoreSource.includes(ip)
    );

    if (!ignorePatterns.length) return;

    insert(tree, gitIgnorePath, [
      new InsertChange(
        gitIgnorePath,
        gitIgnoreSource.length,
        `

# Generated Docusaurus files
${ignorePatterns.join('\n')}`
      ),
    ]);
    return tree;
  };
}

function updatePrettierIgnore(): Rule {
  return (tree: Tree) => {
    const prettierIgnorePath = '.prettierignore';

    if (!tree.exists(prettierIgnorePath)) return;

    const prettierIgnoreSource = tree
      .read(prettierIgnorePath)
      .toString('utf-8')
      .trimRight();
    const ignorePattern = '.docusaurus/';

    if (prettierIgnoreSource.includes(ignorePattern)) return;

    insert(tree, prettierIgnorePath, [
      new InsertChange(
        prettierIgnorePath,
        prettierIgnoreSource.length,
        `\n${ignorePattern}`
      ),
    ]);
    return tree;
  };
}

export default function (options: AppSchematicSchema): Rule {
  return (host: Tree) => {
    const normalizedOptions = normalizeOptions(host, options);
    return chain([
      updateWorkspace((workspace) => {
        const targets = workspace.projects.add({
          name: normalizedOptions.projectName,
          root: normalizedOptions.projectRoot,
          sourceRoot: `${normalizedOptions.projectRoot}/src`,
          projectType,
        }).targets;
        targets.add({
          name: 'build',
          builder: '@nx-plus/docusaurus:browser',
          options: {
            outputPath: `dist/${normalizedOptions.projectRoot}`,
          },
        });
        targets.add({
          name: 'serve',
          builder: '@nx-plus/docusaurus:dev-server',
          options: {
            port: 3000,
          },
        });
      }),
      addProjectToNxJsonInTree(normalizedOptions.projectName, {
        tags: normalizedOptions.parsedTags,
      }),
      addFiles(normalizedOptions),
      updateGitIgnore(),
      updatePrettierIgnore(),
      addDepsToPackageJson(
        {
          '@docusaurus/core': '^2.0.0-alpha.70',
          '@docusaurus/preset-classic': '^2.0.0-alpha.70',
          '@mdx-js/react': '^1.6.21',
          clsx: '^1.1.1',
          react: '^16.8.4',
          'react-dom': '^16.8.4',
        },
        {},
        true
      ),
      formatFiles(options),
    ]);
  };
}
