import {
  chain,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import {
  findNodes,
  formatFiles,
  insert,
  readWorkspace,
  updatePackagesInPackageJson,
  updateWorkspace,
} from '@nrwl/workspace';
import { ReplaceChange } from '@nrwl/workspace/src/utils/ast-utils';
import * as path from 'path';
import * as ts from 'typescript';

function getLinksProperty(
  docusaurusConfig: ts.ObjectLiteralExpression,
  properties = ['themeConfig', 'navbar', 'links']
): ts.PropertyAssignment | null {
  const propertyName = properties.shift();
  const propertyAssignment = docusaurusConfig.properties.find(
    (property) => property.name.getText() === propertyName
  ) as ts.PropertyAssignment;

  if (!propertyAssignment) {
    return null;
  }

  if (!properties.length) {
    return propertyAssignment;
  }

  return getLinksProperty(
    propertyAssignment.initializer as ts.ObjectLiteralExpression,
    properties
  );
}

function getDocusaurusConfig(
  tree: Tree,
  path: string
): ts.ObjectLiteralExpression {
  if (!tree.exists(path)) {
    throw new Error(`Cannot find '${path}' in your workspace.`);
  }

  const content = tree.read(path).toString('utf-8');

  const sourceFile = ts.createSourceFile(
    'docusaurus.config.js',
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const expressions = findNodes(
    sourceFile,
    ts.SyntaxKind.BinaryExpression
  ) as ts.BinaryExpression[];

  const moduleExports = expressions.find(
    (node) =>
      node.left.getText() === 'module.exports' &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isObjectLiteralExpression(node.right)
  );

  if (!moduleExports) {
    throw new Error(
      `
       The provided docusaurus config file does not have the expected 'module.exports' expression.
       See https://v2.docusaurus.io/docs/docusaurus.config.js for more details.`
    );
  }

  return moduleExports.right as ts.ObjectLiteralExpression;
}

export function updateDocusaurusConfig(path: string): Rule {
  return (tree: Tree) => {
    const docusaurusConfig = getDocusaurusConfig(tree, path);
    const linksProperty = getLinksProperty(docusaurusConfig);

    if (linksProperty) {
      insert(tree, path, [
        new ReplaceChange(
          path,
          linksProperty.pos,
          linksProperty.name.getFullText(),
          'items'
        ),
      ]);
    }
  };
}

export default function update(): Rule {
  return chain([
    updatePackagesInPackageJson(
      path.join(__dirname, '../../../', 'migrations.json'),
      '0.4.0'
    ),
    updateWorkspace((workspace) => {
      workspace.projects.forEach((project) => {
        project.targets.forEach((target) => {
          if (target.builder === '@nx-plus/docusaurus:docusaurus') {
            target.builder = '@nx-plus/docusaurus:dev-server';
          }
          if (target.builder === '@nx-plus/docusaurus:build-docusaurus') {
            target.builder = '@nx-plus/docusaurus:browser';
          }
        });
      });
    }),
    (tree: Tree) => {
      const workspace = readWorkspace(tree);
      return chain(
        Object.keys(workspace.projects).map((key) => {
          const project = workspace.projects[key];
          if (
            project.projectType === 'application' &&
            project.architect &&
            project.architect.build &&
            project.architect.build.builder === '@nx-plus/docusaurus:browser'
          ) {
            return updateDocusaurusConfig(
              `${project.root}/docusaurus.config.js`
            );
          }
          return noop();
        })
      );
    },
    formatFiles(),
    (tree: Tree, context: SchematicContext) => {
      context.logger.warn(
        'An installation of node_modules has been required. Make sure to run it after the migration.'
      );
    },
  ]);
}
