import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
  applyChangesToString,
  ChangeType,
} from '@nx/devkit';
import { runTasksInSerial } from '@nx/devkit';
import * as path from 'path';
import { ApplicationGeneratorSchema } from './schema';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
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

  return {
    ...options,
    name,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    host,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

function updateGitIgnore(host: Tree) {
  const gitIgnorePath = '.gitignore';

  if (!host.exists(gitIgnorePath)) return;

  const gitIgnoreSource = host.read(gitIgnorePath, 'utf-8')?.trimRight() ?? '';

  const ignorePatterns = ['.docusaurus/', '.cache-loader/'].filter(
    (ip) => !gitIgnoreSource.includes(ip)
  );

  if (!ignorePatterns.length) return;

  const updatedGitIgnore = applyChangesToString(gitIgnoreSource, [
    {
      type: ChangeType.Insert,
      index: gitIgnoreSource.length,
      text: `

# Generated Docusaurus files
${ignorePatterns.join('\n')}`,
    },
  ]);

  host.write(gitIgnorePath, updatedGitIgnore);
}

function updatePrettierIgnore(host: Tree) {
  const prettierIgnorePath = '.prettierignore';

  if (!host.exists(prettierIgnorePath)) return;

  const prettierIgnoreSource =
    host.read(prettierIgnorePath, 'utf-8')?.trimEnd() ?? '';

  const ignorePattern = '.docusaurus/';

  if (prettierIgnoreSource.includes(ignorePattern)) return;

  const updatedPrettierIgnore = applyChangesToString(prettierIgnorePath, [
    {
      type: ChangeType.Insert,
      index: prettierIgnoreSource.length,
      text: `\n${ignorePattern}`,
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
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nx-plus/docusaurus:browser',
        options: {
          outputPath: `dist/${normalizedOptions.projectRoot}`,
        },
      },
      serve: {
        executor: '@nx-plus/docusaurus:dev-server',
        options: {
          port: 3000,
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(host, normalizedOptions);
  updateGitIgnore(host);
  updatePrettierIgnore(host);
  const installTask = addDependenciesToPackageJson(
    host,
    {
      '@docusaurus/core': '2.4.1',
      '@docusaurus/preset-classic': '2.4.1',
      '@mdx-js/react': '^1.6.22',
      clsx: '^1.2.1',
      'prism-react-renderer': '^1.3.5',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    {
      '@docusaurus/module-type-aliases': '2.4.1',
      typescript: '^4.7.4',
    }
  );
  if (!normalizedOptions.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(installTask);
}

export const applicationSchematic = convertNxGenerator(applicationGenerator);
