const fs = require('fs');
const path = require('path');

/**
 * Patch dep-graph builder function to support Vue files.
 * @see https://github.com/nrwl/nx/issues/2960
 */
function patchNxDepGraph() {
  const file = 'node_modules/nx/src/project-graph/build-dependencies/typescript-import-locator.js';
  try {
    const data = String(fs.readFileSync(path.resolve(file)));
    const replacement = 'extension !== \'.ts\' && extension !== \'.vue\' &&';
    if (data.indexOf(replacement) !== -1) {
      console.log('NX dep-graph for vue file support ALREADY patched');
      return;
    }
    const patched = data.replace('extension !== \'.ts\' &&', 'extension !== \'.ts\' && extension !== \'.vue\' &&');
    fs.writeFileSync(file, patched);
    console.log('NX dep-graph for vue file support patched');
  } catch (err) {
    console.error('Failed to patch dep-graph for vue file support', err);
  }
}

patchNxDepGraph();
