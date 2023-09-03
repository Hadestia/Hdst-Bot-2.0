// ================= CACHE LIBRARY BY HADESTIA ================= //

const { execSync, existsSync, createReadStream } = require('fs-extra');
const textFormat = require('./textFormat.js');
const logger = require('./log.js');
const PREFIX = '[ Cache.js ]';
const Cache = {};


// @param path string a foldernames or foldernames with filename
// @param filter function [optional]
Cache.remove = async function (path, filter) {
	
	const f = path.split('/');
	
	if (!path) {
		return logger('No value for path', '[ clearCache.js ]');
	}
	
	if (!existsSync(path)) {
		return logger(`${f.pop()} not found`, PREFIX);
	}
	
	if (rule) {
		const files = readDirSync(global.client.mainPath + '/' + path).filter(filter);
		for (const filename in files) {
			await execSync(`rm ${global.client.mainPath}/${(path.endsWith('/')) ? path : path + '/'}${filename}`);
		}
	} else {
    	return await execSync(`rm ${global.client.mainPath}/${path}`);
    }
}

Cache.get = async function (path, obj) {
	
	path = `${__dirname}/${path}`;
	const f = path.split('/');
	
	if (!existsSync(path)) {
		const message = textFormat('tool', 'cacheFileNotFound', f.pop());
		if (obj) {
			return obj.api.sendMessage( message, obj.threadID, obj.messageID );
		}
		return logger(message, PREFIX);
	}
	
	if (obj) {
		return obj.api.sendMessage(
			{
				body: f.pop(),
				attachment: [ createReadStream(path) ]
			},
			obj.threadID,
			obj.messageID
		);
	}
}

module.exports = Cache;