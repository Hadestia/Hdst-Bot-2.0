module.exports.config = {
	name: 'check-update',
	version: '2.0.6',
	hasPermssion: 2,
	commandCategory: 'system',
	aliases: [ 'update', 'bot-update' ],
	description: 'check available update for bot',
	cooldowns: 5,
	hidden: true,
	credits: 'Hadestia'
}

module.exports.run = async function ({ api, args, event, Utils }) {
	
	const axios = require('axios');
	
	const assets = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/!asset-update.json`);
	await axios(`${global.HADESTIA_BOT_CONFIG.REPO}json/!asset-update.json`).then(res => {
		if (res.data.VERSION !== global.BOT_VERSION) {
			return api.sendMessage(
				Utils.textFormat('system', 'botUpdatesFound', res.data.VERSION, res.data.CHANGELOGS),
				event.threadID,
				event.messageID
			);
		}
		return api.sendMessage(
			`${Utils.textFormat('system', 'botUpdatesUpToDate')} current version was ${global.BOT_VERSION}`,
			event.threadID,
			event.messageID
		);
	}).catch(e => {
		return api.sendMessage(
			Utils.textFormat('system', 'botVersionFetchingFailed'),
			event.threadID,
			event.messageID
		);
	});
}