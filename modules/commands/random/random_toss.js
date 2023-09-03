module.exports.config = {
	name: 'toss',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'random',
	credits: 'Hadestia',
	cooldowns: 0,
	description: 'A simple toss coin game, will return either heads or tail',
	usages: ''
}

module.exports.run = function ({ api, args, event, textFormat }) {
	
	const { threadID, messageID } = event;
	const pick = ['Head', 'Tail'][Math.floor(Math.random() * 2)];
		
	return api.sendMessage(pick, threadID, messageID);
}