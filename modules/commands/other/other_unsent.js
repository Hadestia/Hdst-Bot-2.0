module.exports.config = {
	name: 'unsent',
	version: '1.0.3',
	hasPermssion: 2,
	credits: 'Hadestia',
	description: 'unsent bot message by replying on the target message.',
	commandCategory: 'other',
	aliases: [ 'unsend', 'remove' ],
	usages: '<!reply base command!>',
	cooldowns: 0,
	ignoreAdminMessageReply: [ 'unsend', 'unsent', 'remove', 'delete' ]
};

module.exports.handleMessageReply = async function ({ api, event, Utils }) {
	
	if (!['unsend', 'unsent', 'remove', 'delete'].includes(event.body.toLowerCase())) return;
	
	const eligible = await Utils.hasPermission(event.senderID, event.threadID, this.config.hasPermssion);
	if (eligible) {
		this.run({ api, event, Utils });
	}
	
}

module.exports.run = function({ api, event, Utils }) {
	
	// if not reply
	if (event.type != 'message_reply') {
		Utils.sendReaction.failed(api, event);
		return api.sendMessage(Utils.textFormat('system', 'botUnsentMissingReply'), event.threadID, event.messageID);
	}
	
	if (event.messageReply.senderID != Utils.BOT_ID) {
		Utils.sendReaction.failed(api, event);
		return api.sendMessage(Utils.textFormat('system', 'botCantUnsent'), event.threadID, event.messageID);
	}
	
	Utils.sendReaction.success(api, event);
	return api.unsendMessage(event.messageReply.messageID);
	
}