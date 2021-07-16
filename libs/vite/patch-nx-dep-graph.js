const fs = require('fs');
const path = require('path');

/**
 * Patch dep-graph builder function to support Vue files.
 * @see https://github.com/nrwl/nx/issues/2960
 */
function patchNxDepGraph() {
  const filePath = path.join(
    process.env.INIT_CWD || '',
    'node_modules/@nrwl/workspace/src/core/project-graph/build-dependencies/typescript-import-locator.js'
  );
  try {
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

patchNxDepGraph();
