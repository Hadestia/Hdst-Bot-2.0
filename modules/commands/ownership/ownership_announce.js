module.exports.config = {
	name: 'announce',
	version: '1.0.0',
	credits: 'Hadestia',
	hasPermssion: 2,
	commandCategory: 'ownership',
	cooldowns: 0,
	description: 'announce a message to a all groups or on a specified one.',
	usages: '[all/group ID] | <author> | <message>',
	hidden: true,
	envConfig: {
		requiredArgument: 3
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Threads }) {
	
	const { threadID, messageID } = event;
	const body = args.join(' ');
	
	let dividerCount = body.match(/\|/g);
	if (!dividerCount || dividerCount.length < 2) {
		return returns.invalid_usage();
	}
	
	const arg = (body).split('|');
	const target_id = arg[0].trim();
	const codename = arg[1].trim();
	
	// if specific thread
	if (target_id !== 'all') {
		// if valid thread id
		if (target_id.length === 16) {
			return api.sendMessage(
				Utils.textFormat('cmd', 'cmdAnnounceFormat', codename, arg[2].trim()),
				target_id,
				(err) => {
					if (err) return console.log(err);
					// return api.sendMessage(Utils.textFormat('cmd', 'cmdAnnounceSentSuccess'), threadID, messageID);
					return Utils.sendReaction.success(api, event);
				}
			);
		}
		// send invalid id
		return api.sendMessage(Utils.textFormat('cmd', 'cmdAnnounceInvalidThreadID'), threadID, logMessageError, messageID);
	
	// send to all thread
	} else {
		const allThreads = await Threads.getAll(['threadID', 'data']);

		for (const thread of allThreads) {
			api.sendMessage(Utils.textFormat('cmd', 'cmdAnnounceFormat', codename, arg[2].trim()), thread.threadID, (err)=> {  });
		}
		
		return Utils.sendReaction.success(api, event);
		// return api.sendMessage(Utils.textFormat('cmd', 'cmdAnnounceSentSuccess'), threadID, messageID);
	}
	
}