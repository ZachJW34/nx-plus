const fs = require('fs');
const path = require('path');

/**
 * Patch dep-graph builder function to support Vue files.
 * @see https://github.com/nrwl/nx/issues/2960
 */
function patchNxDepGraph() {
  try {
    const filePath = getFilePath();
    const fileContent = fs.readFileSync(filePath).toString('utf-8');
    const replacement = "extension !== '.ts' && extension !== '.vue'";
    if (fileContent.includes(replacement)) {
      return;
    }
    fs.writeFileSync(
      filePath,
      fileContent.replace("extension !== '.ts'", replacement)
    );
    console.log('Successfully patched Nx dep-graph for Vue support.');
  } catch (err) {
    console.error('Failed to patch Nx dep-graph for Vue support.', err);
  }
}

function getFilePath() {
  const possiblePaths = [
    'node_modules/nx/src/project-graph/build-dependencies/typescript-import-locator.js', // for Nx >= 13.10.3
    'node_modules/@nx/workspace/src/core/project-graph/build-dependencies/typescript-import-locator.js', // for older versions of Nx
  ];

  for (const p of possiblePaths) {
    const fullPath = path.join(process.env.INIT_CWD || '', p);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error("Could not find Nx's dep-graph builder in node_modules");
}

patchNxDepGraph();
