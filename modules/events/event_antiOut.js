module.exports.config = {
	name: 'antiout',
	eventType: ['log:unsubscribe'],
	version: '0.0.1',
	credits: 'Hadestia',
	description: 'try to add back users from the group',
	envConfig: {
		needGroupData: true,
		allowBannedUser: true,
	}
};

module.exports.run = async function ({ event, api, Utils, Threads, Users }) {
	
	const threadData = await Threads.getData(event.threadID);
	const data = threadData.data;
	
	if (event.logMessageData.leftParticipantFbId == Utils.BOT_ID) {
		try {
			await Threads.delData(event.threadID);
			return;
		} catch (e) {}
	}
	
	const userID = event.logMessageData.leftParticipantFbId
	const type = (event.author == userID) ? 'self-separation' : 'kicked';
 
	try {
		
		const name = await Users.getNameUser(userID);
		
		if (type == 'self-separation') {
			if (data.antiout) {
				api.addUserToGroup(
					userID,
					event.threadID,
					(error, info) => {
						if (error) {
							//removeUserEconomy(event.logMessageData.leftParticipantFbId);
    						return api.sendMessage(Utils.textFormat('group', 'groupAntiOutFailed', name), event.threadID)
						}
						api.sendMessage(
							Utils.textFormat('group', 'groupAntiOutSuccess', name, data.PREFIX || global.HADESTIA_BOT_CONFIG.PREFIX),
							event.threadID,
							() => {
								try {
									const ecoUIO = require('./event_economyUIO.js');
									ecoUIO.initUserEco({
										userID,
										threadID: event.threadID,
										Threads, Utils
									});
								} catch (err) {
									console.log(err);
								}
							}
						);
					}
				);
			}
		} else if (type == 'kicked') {
			return api.sendMessage(
				Utils.textFormat('group', 'groupAntiOutKicked', name),
				event.threadID, ()=>{}
			);
		}
	} catch (err) {
		console.log(err);
		Utils.logModuleErrorToAdmin(err, __filename, event);
	}
}