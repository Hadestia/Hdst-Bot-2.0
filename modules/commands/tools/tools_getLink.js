module.exports.config = {
	name: 'get-link',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'tools',
	description: 'Get the download link of a reply message that has an attachment.',
	cooldowns: 5,
	credits: 'Hadestia',
	aliases: [ 'link' ],
	usages: '[ index / [indexes separated by space] ]',
	envConfig: {
		requiredArgument: 0
	}
}

module.exports.run = function ({ api, args, event, Utils }) {
	
	const { threadID, messageID } = event;
	
	if (event.type !== 'message_reply') return api.sendMessage(`You must reply to specific message.`, threadID, messageID);
	
	const attachments = event.messageReply.attachments;
	
	// return if there's no attachment found
	if (objIsEmpty(attachments)) {
		Utils.sendReaction.failed(api, event);
		return api.sendMessage(`I don't see any attachments here :/`, threadID, messageID);
	}
	
	const fileLinks = [];
	
	if (args.length > 0) {
		for (const index of args) {
			if (!parseInt(index)) {
				return api.sendMessage(Utils.textFormat('error', 'errOccured', `Index "${index}" is not a number`), threadID, messageID);
			}
			
			const num_index = parseInt(index);
			if (num_index < 1|| num_index > attachments.length) {
				return api.sendMessage(Utils.textFormat('error', 'errOccured', `Index "${num_index}" out of range.`), threadID, messageID);
			}
			
			const url = attachments[num_index - 1].url;
			
			fileLinks.push(url);
		}
	} else {
		for (const attachment of attachments) {
			const url = attachment.url;
			fileLinks.push(url);
		}
	}
	
	let msg = '';
	for (const link of fileLinks) {
		msg += `● ${link}\n\n`;
	}
	Utils.sendReaction.success(api, event);
	return api.sendMessage(msg, threadID, messageID);
}

function objIsEmpty(obj) {
	for(var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}