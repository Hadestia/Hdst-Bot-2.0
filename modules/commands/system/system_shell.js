module.exports.config = {
	name: 'shell',
	version: '1.0.0',
	description: 'Run shell command on the system.',
	hasPermssion: 2,
	credits: 'Hadestia',
	commandCategory: 'system',
	usages: '<command>',
	aliases: [ 'sh' ],
	cooldowns: 30,
	hidden: true,
	dependencies: {
		child_process: ''
	},
	envConfig: {
		requiredArgument: 2,
		inProcessReaction: true
	}
}

module.exports.run = async function ({ api, args, event, Utils }) {
	
	const { exec } = require('child_process');
	
	if (!event.senderID == global.HADESTIA_BOT_CONFIG.ADMINBOT[0]) {
		return api.sendMessage(Utils.textFormat('cmd', 'cmdPermissionNotEnough', 'Bot owner'), event.threadID, event.messageID);
	}
	
	const command = args.join(' ');

	await exec(
		command,
		(err, stdout, stderr) => {
			if (err) {
				Utils.sendReaction.failed(api, event);
				return api.sendMessage(Utils.textFormat('system', 'botBashError', err), event.threadID, event.messageID);
			}
			if (stderr) {
				Utils.sendReaction.failed(api, event);
				return api.sendMessage(Utils.textFormat('system', 'botBashStdError', stderr), event.threadID, event.messageID);
			}
			
			Utils.sendReaction.success(api, event);
			if (stdout) return api.sendMessage(Utils.textFormat('system', 'botBashStdOut', stdout), event.threadID, event.messageID);
		}
	);
}