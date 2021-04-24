import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  applyChangesToString,
  ChangeType,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import { ApplicationGeneratorSchema } from './schema';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  isVuepress2: boolean;
}

function normalizeOptions(
  host: Tree,
  options: ApplicationGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];
  const isVuepress2 = options.vuepressVersion === 2;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    isVuepress2,
  };
}

function addFiles(host: Tree, options: NormalizedSchema) {
  generateFiles(
    host,
    path.join(__dirname, 'files/common'),
    options.projectRoot,
    {
      ...options,
      template: '',
      dot: '.',
    }
  );
  generateFiles(
    host,
    path.join(
      __dirname,
      `files/${options.isVuepress2 ? 'vuepress-2' : 'vuepress-1'}`
    ),
    options.projectRoot,
    {
      template: '',
      dot: '.',
    }
  );
}

function updateGitIgnore(host: Tree) {
  const gitIgnorePath = '.gitignore';

  if (!host.exists(gitIgnorePath)) return;

  const gitIgnoreSource = host
    .read(gitIgnorePath)
    .toString('utf-8')
    .trimRight();
  const ignorePatterns = ['.cache/', '.temp/'].filter(
    (ip) => !gitIgnoreSource.includes(ip)
  );

  if (!ignorePatterns.length) return;

  const updatedGitIgnore = applyChangesToString(gitIgnoreSource, [
    {
      type: ChangeType.Insert,
      text: `

# Generated VuePress files
${ignorePatterns.join('\n')}`,
      index: gitIgnoreSource.length,
    },
  ]);

  host.write(gitIgnorePath, updatedGitIgnore);
}

function updatePrettierIgnore(host: Tree) {
  const prettierIgnorePath = '.prettierignore';

  if (!host.exists(prettierIgnorePath)) return;

  const prettierIgnoreSource = host
    .read(prettierIgnorePath)
    .toString('utf-8')
    .trimRight();
  const ignorePattern = '.temp/';

  if (prettierIgnoreSource.includes(ignorePattern)) return;

  const updatedPrettierIgnore = applyChangesToString(prettierIgnoreSource, [
    {
      type: ChangeType.Insert,
      text: `\n${ignorePattern}`,
      index: prettierIgnoreSource.length,
    },
  ]);

  host.write(prettierIgnorePath, updatedPrettierIgnore);
}

export async function applicationGenerator(
  host: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(host, options);
  addProjectConfiguration(host, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    targets: {
      build: {
        executor: '@nx-plus/vuepress:browser',
        options: {
          dest: `dist/${normalizedOptions.projectRoot}`,
        },
      },
      serve: {
        executor: '@nx-plus/vuepress:dev-server',
        options: {
          port: 8080,
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(host, normalizedOptions);

  if (normalizedOptions.isVuepress2) {
    updateGitIgnore(host);
    updatePrettierIgnore(host);
  }

  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(
    addDependenciesToPackageJson(
      host,
      {},
      { vuepress: normalizedOptions.isVuepress2 ? '^2.0.0-beta.8' : '^1.5.3' }
    )
  );
}

export const applicationSchematic = convertNxGenerator(applicationGenerator);
