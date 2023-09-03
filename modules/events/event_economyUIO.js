module.exports.config = {
	name: 'event_economyUserIO',
	eventType: ['log:subscribe', 'log:unsubscribe'],
	version: '1.0.3',
	credits: 'Hadestia',
	description: 'Set up user economy when joined or leave',
	envConfig: {
		needGroupData: true
	}
};

module.exports.run = async function({ api, event, Threads, Utils }) {
	
	const { threadID } = event;
	
	try {
		const threadData = await Threads.getData(event.threadID);	
		let settings = threadData.data;
		let economy = threadData.economy;
		let inventory = threadData.inventory;
	
		
		switch (event.logMessageType) {
			case 'log:subscribe':
				// sometimes db for this thread was not initialize yet so end this process and let handleCreateDatabase do its job.
				if (!threadData || !economy || !inventory) break;
				
				for (const user of event.logMessageData.addedParticipants) {
					if (user.userFbId != Utils.BOT_ID) {
						this.initUserEco({
							userID: user.userFbId,
							threadID, Threads, Utils
						});
					}
				}
				break;
			case 'log:unsubscribe':
				if (event.logMessageData.leftParticipantFbId != Utils.BOT_ID) {
					this.delUserEco({
						userID: event.logMessageData.leftParticipantFbId,
						threadID, Threads, Utils,
					})
				}
				break;
			default:
				break;

		}
	} catch (err) {
		console.log(err);
	}
}

module.exports.initUserEco = async function ({ userID, threadID, Threads, Utils }) {
	
	try {
		const economySystem = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/economySystem.json`);
		const threadData = await Threads.getData(threadID);
		const settings = threadData.data;
		const economy = threadData.economy;
		const inventory = threadData.inventory;
	
		economy[userID] = new Object(economySystem.userConfig);
		inventory[userID] = {};
		Utils.logger(`Initialize Economy for user ${userID}`, 'economy');
	
		await Threads.setData(threadID, { economy, inventory });
	} catch (e) {
		console.log(__filename, 'TRIES TO INITIALIZE USER ECONOMY BUT THREAD DATA WASN\'T INITIALIZE YET', e);
	}
}

module.exports.delUserEco = async function ({ userID, threadID, Threads, Utils }) {
	
	try {
		const economySystem = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/economySystem.json`);
		const threadData = await Threads.getData(threadID);
		const settings = threadData.data;
		const economy = threadData.economy;
		const inventory = threadData.inventory;
	
		delete economy[userID];
		delete inventory[userID];
		Utils.logger(`Delete Economy for user ${userID}`, 'economy');
	
		await Threads.setData(threadID, { economy, inventory });
	} catch (e) {
		console.log(__filename, 'TRIES TO DELETE USER ECONOMY BUT THREAD DATA WASN\'T INITIALIZE', e);
	}
}