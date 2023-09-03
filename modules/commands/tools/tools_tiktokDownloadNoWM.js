module.exports.config = {
	name: 'tiktok-dl',
	version: '1.0.2',
	hasPermssion: 0,
	credits: 'Hadestia',
	description: 'Downloads tiktok video via link without watermark.',
	commandCategory: 'tools',
	usages: '<URL>',
	cooldowns: 60,
	aliases: [ 'ttdl' ],
	envConfig: {
		requiredArgument: 1
	},
	dependencies: {
		'axios': '',
		'fs-extra': ''
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils }) {
	
	const axios = require('axios');
	const fs = require('fs-extra');
	
	const { threadID, messageID } = event;
	const request = args[0];
	
	Utils.sendReaction.inprocess(api, event);
	axios.get(
		`https://hdst-bot-side-server.hdstteam.repl.co/tiktok-dl?url=${request}`
	).then((res) => {
		const link = res.data.link;
		const path = `${Utils.ROOT_PATH}/cache/tk-${link.split('/').pop()}`;
		
		Utils.downloadFile(link, path).then(() => {
			api.sendMessage(
				{
					body: '',
					attachment: fs.createReadStream(path)
				},
				threadID,
				(err) => {
					fs.unlinkSync(path);
					if (err) return Utils.sendReaction.failed(api, event);
					Utils.sendReaction.success(api, event);
				},
				messageID
			);
		}).catch((err) => {
			Utils.sendReaction.failed(api, event);
			api.sendMessage(Utils.textFormat('error', 'errOccured', err), threadID, Utils.autoUnsend, messageID);
		});
	}).catch((err) => {
		Utils.sendReaction.failed(api, event);
		api.sendMessage(Utils.textFormat('error', 'errOccured', err), threadID, Utils.autoUnsend, messageID);
	});
}