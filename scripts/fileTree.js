// FileTree : Will automatically make default folders and subfolders if not existed.
const { existsSync } = require('fs-extra');
const { exec } = require('child_process');

module.exports.checkAndMakeDir = async function (obj, basePath) {
	Object.keys(obj).forEach(function(key) {
		let path = basePath + '/' + key;
		if (!existsSync(path)) {
			exec(`mkdir ${path}`, (error, stdout, stderr) => {
				if (error) {
					return console.error(`exec error: ${error}`);
				}
				if (stderr) {
					return console.error(`exec stderr: ${stderr}`);
				}
				console.log(`Directory created: ${path}`);
				// If the property is a sub-object, create a directory for it recursively
				if (typeof obj[key] === 'object') {
					this.checkAndMakeDir(obj[key], path);
				}
			});
		}
	});
}
