module.exports.config = {
	name: 'pretty-girls',
	version: '1.0.1',
	description: 'Just a random beautiful girl\'s reels.',
	hasPermssion: 0,
	commandCategory: 'media',
	cooldowns: 0,
	usages: '',
	aliases: [ 'shoti' ],
	credits: 'Hadestia, © rest API',
	dependencies: {
		'fs-extra': '',
		'axios': ''
	}
}

module.exports.run = async function ({ api, event, Utils }) {
	
	const { threadID, messageID, senderID } = event;
	const axios = require('axios');
	const fs = require('fs-extra');
	
	Utils.sendReaction.inprocess(api, event);
	await axios.get('https://api.bot456aa.repl.co/api/shoti').then(async (res) => {
		const { url } = res.data.result;
		const path = `${Utils.ROOT_PATH}/cache/shotiReq-${senderID}.mp4`;
		await Utils.downloadFile(url, path).then(() => {
			api.sendMessage(
				{
					body: '',
					attachment: fs.createReadStream(path)
				},
				threadID,
				(e) => {
					if (e) { Utils.sendReaction.failed(api, event); }
					else { Utils.sendReaction.success(api, event); }
					fs.unlinkSync(path);
				},
				messageID
			);
		}).catch((err) => {
			Utils.sendReaction.failed(api, event);
			api.sendMessage(Utils.textFormat('error', 'errProcessUnable'), threadID, messageID);
		});
	}).catch((err) => {
		Utils.sendReaction.failed(api, event);
		api.sendMessage(Utils.textFormat('error', 'errOccured', err), threadID, messageID);
	});
}