module.exports.config = {
	name: 'setbio',
	version: '1.0.2',
	hasPermssion: 2,
	credits: 'Hadestia',
	description: 'Change bot\'s biography by default or given the text provided.',
	commandCategory: 'ownership',
	usages: '[text]',
	cooldowns: 10
}
  
module.exports.run = async ({ api, event, args, Utils }) => {
	
	let content = (args.length > 0) ? args.join(' ').replace('\n', '\n') : Utils.textFormat('system', 'botDefaultBio', global.HADESTIA_BOT_CONFIG.PREFIX);
	
	api.changeBio(
		content,
		(e) => {
			if (e) return api.sendMessage(Utils.textFormat('error', 'errOccured', e), event.threadID, event.messageID);
			return api.sendMessage(Utils.textFormat('system', 'botChangedBio', content), event.threadID, event.messgaeID);
		}
    );
}