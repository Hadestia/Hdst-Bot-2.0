module.exports.config = {
	name: 'setup',
	eventType: ['log:subscribe'],
	version: '1.0.3',
	credits: 'Hadestia',
	description: 'Set up bot when connected to the group.',
	envConfig: {
		allowBannedThread: false
	}
};

module.exports.run = async function({ api, event, Utils }) {
	
	const { threadID } = event;
	
	// If joined user was this bot
	if (event.logMessageData.addedParticipants.some(i => i.userFbId == Utils.BOT_ID)) {
		Utils.initBotJoin(threadID);
	}
}