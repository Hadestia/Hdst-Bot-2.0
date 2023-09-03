//////// WORK: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'work',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '',
	description: 'Earn some money',
	credits: 'Hadestia',
	cooldowns: 0,
	aliases: [ 'earn' ],
	envConfig: {
		needGroupData: true,
		groupCommandOnly: true
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix, Threads }) {
	
	const { threadID, messageID, senderID } = event;
	const dateNow = Date.now();
	
	try {
		const threadData = await Threads.getData(threadID);
		const economy = threadData.economy;
		const inventory = threadData.inventory;
		
		const expirationTime = (threadData.data.work_cooldown || Utils.economySystem.config.work_cooldown); // 20 minutes default

		if (dateNow < economy[senderID].work_cooldown) {
			return returns.user_in_cooldown(economy[senderID].work_cooldown, dateNow);
		}
		
		const currency = threadData.data.default_currency || Utils.economySystem.config.default_currency;
		const minWage = threadData.data.work_min_wage || Utils.economySystem.config.work_min_wage || 500;
		const maxWage = threadData.data.work_max_wage || Utils.economySystem.config.work_max_wage || 1000;
	
		const randomSalary = Math.floor(Math.random() * (maxWage - minWage + 1)) + minWage;
	
		// save data first
		economy[senderID].hand = economy[senderID].hand + randomSalary;
		economy[senderID].work_cooldown = Date.now() + expirationTime;
		await Threads.setData(threadID, { economy });
		
		const formatSalary = randomSalary.toLocaleString('en-US');
		const messageResponse = (Utils.economySystem.workResponse[Math.floor(Math.random() * (Utils.economySystem.workResponse).length)]).replace('${salary}', `${currency}${formatSalary}`);
		
		return api.sendMessage( messageResponse, threadID, messageID);
		
	} catch (err) {
		Utils.sendReaction.failed(api, event);
		console.log(err, 'error');
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
	
}