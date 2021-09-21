"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUnrecognizedInfo = exports.changePermissions = exports.downloadFile = exports.getPath = void 0;
const electron_1 = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const rimraf = require("rimraf");
const getPath = () => {
    const savePath = electron_1.app.getPath('userData');
    return path.resolve(`${savePath}/extensions`);
};
exports.getPath = getPath;
// Use https.get fallback for Electron < 1.4.5
const request = electron_1.net ? electron_1.net.request : https.get;
const downloadFile = (from, to) => {
    return new Promise((resolve, reject) => {
        const req = request(from);
        req.on('response', (res) => {
            // Shouldn't handle redirect with `electron.net`, this is for https.get fallback
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return exports.downloadFile(res.headers.location, to).then(resolve).catch(reject);
            }
            res.pipe(fs.createWriteStream(to)).on('close', resolve);
            res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
    });
};
exports.downloadFile = downloadFile;
const changePermissions = (dir, mode) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        fs.chmodSync(filePath, parseInt(`${mode}`, 8));
        if (fs.statSync(filePath).isDirectory()) {
            exports.changePermissions(filePath, mode);
        }
    });
};
exports.changePermissions = changePermissions;
const removeUnrecognizedInfo = (extensionDir) => {
    // fix: Cannot load extension with file or directory name _metadata. Filenames starting with "_" are reserved for use by the system.
    rimraf.sync(path.join(extensionDir, '_metadata'));
    const manifestFilepath = path.join(extensionDir, 'manifest.json');
    const manifestFileContent = JSON.parse(fs.readFileSync(manifestFilepath, {
        encoding: 'utf8',
    }));
    // fix: Unrecognized manifest key 'minimum_chrome_version' etc.
    const removeFields = [
        'minimum_chrome_version',
        'browser_action',
        'update_url',
        'homepage_url',
        'page_action',
        'short_name',
    ];
    for (const field of removeFields) {
        delete manifestFileContent[field];
    }
    fs.writeFileSync(manifestFilepath, JSON.stringify(manifestFileContent, null, 2));
};
exports.removeUnrecognizedInfo = removeUnrecognizedInfo;
//# sourceMappingURL=utils.js.map