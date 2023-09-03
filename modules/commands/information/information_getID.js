module.exports.config = {
	name: 'get-id',
	version: '1.0.4',
	hasPermssion: 0,
	description: 'get the ID of the current Group/Account or other users by replying or mentioning',
	usages: '< user link | (@reply) | (@mention(s))>',
	commandCategory: 'information',
	cooldowns: 5,
	credits: 'Hadestia',
	aliases: [ 'id', 'uid', 'tid', 'group-id' ]
}

module.exports.run = async function({ api, args, event, alias, returns, Utils, Prefix }) {
	
	const { threadID,  messageID, senderID, mentions, body } = event;
	const axios = require('axios');
	
	
	async function searchPerson(str) {
		const search = await api.getUserID(str);
		if (search[0]) {
			if (str.indexOf('mark zuckerberg') !== -1) {
				returns.remove_usercooldown();
				Utils.sendReaction.failed(api, event);
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'I can\'t do that.'), threadID, messageID);
			}
			return search[0].userID;
		} else {
			returns.remove_usercooldown();
			Utils.sendReaction.failed(api, event);
			api.sendMessage(Utils.textFormat('error', 'errOccured', 'I couldn\'t find that person.'), threadID, messageID);
			return false;
		}
	}
	
	if (['tid', 'thread', 'group'].includes(alias)) {
		return api.sendMessage(threadID, threadID, messageID);
	}
	
	// handle reply event
	if (event.type == 'message_reply') {
		return api.sendMessage(event.messageReply.senderID, threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);
	}
	
	// handle Normal execution
	const mentionLength = Object.keys(mentions).length;
	if (mentionLength == 0) {
		const param = (args[0] || '').toLowerCase();
		if (param.indexOf('facebook.com/') !== -1) {
			const split = param.split('facebook.com/');
			const username = split.pop();
			
			if (parseInt(username)) {
				return api.sendMessage(`${username}`, threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);
			} else {
				const result = await searchPerson(username);
				if (!result) return api.sendMessage(Utils.textFormat('error', 'errOccured', 'I couldn\'t find that person.'), threadID, ()=>{}, messageID);
				return api.sendMessage(`${result}`, threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);
			}
		} else {
			return api.sendMessage(`${event.senderID}`, threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);
		}
	// handle mentions
	} else {
		
		let messageListBody = '';
		if (Object.keys(mentions).length > 1) {
		
			for (let i = 0; i < Object.keys(mentions).length; i++) {
				const name = Object.values(mentions)[i].replace('@', '');
				const id = Object.keys(mentions)[i];
				const body = Utils.textFormat('tool', 'getIdMentions', name, id);
				messageListBody = messageListBody + body + '\n';
			}
		
			let messageBody = Utils.textFormat('tool', 'getIdMentionsFormat', messageListBody);
			return api.sendMessage(messageBody, threadID, messageID);
			
		} else {
			
			const name = Object.values(mentions)[0].replace('@', '');
			const id = Object.keys(mentions)[0]
			return api.sendMessage(id, threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);
			
		}
	}
}