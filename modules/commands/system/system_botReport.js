module.exports.config = {
	name: 'bot-report',
	version: '1.0.11',
	hasPermssion: 0,
	credits: 'Hadestia',
	description: 'Report a bot issue directly to the developer.',
	commandCategory: 'system',
	usages: '< message >',
	aliases: [ 'report', 'callad' ],
	cooldowns: 600,
	envConfig: {
		requiredArgument: 1
	}
}

module.exports.run = async function ({ api, args, event, Utils, Users, Threads }) {
	
	const message = args.join(' ');
	
	try {
		const sender = await Users.getNameUser(event.senderID);
		const group = (event.isGroup) ? await Threads.getInfo(event.threadID) : {};
	
		for (const admin of global.HADESTIA_BOT_CONFIG.ADMINBOT) {
			await api.sendMessage(
				Utils.textFormat('events', 'eventBotReportSendToAdmin', message, sender, group.threadName || '<DIRECT MESSAGE>', event.threadID, event.messageID),
				admin,
				(err, info) => {
					if (err) {
						Utils.sendReaction.failed(api, event);
						return api.sendMessage(Utils.textFormat('error', 'errOccured', err), event.threadID, event.messageID);
					}
					Utils.sendReaction.success(api, event);
					return api.sendMessage(Utils.textFormat('events', 'eventBotReportSendToRespondent'), event.threadID, event.messageID);
				}
			);
		}
	} catch (err) {
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return;
	}
}