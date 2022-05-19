"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRootPath = void 0;
const fs = require("fs-extra");
const path = require("path");
exports.appRootPath = pathInner(__dirname);
function pathInner(dir) {
    if (path.dirname(dir) === dir)
        return process.cwd();
    if (fileExists(path.join(dir, 'workspace.json')) ||
        fileExists(path.join(dir, 'angular.json'))) {
        return dir;
    }
    else {
        return pathInner(path.dirname(dir));
    }
}
function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (err) {
        return false;
    }
}
//# sourceMappingURL=app-root.js.map