//////// BEG: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'beg-money',
	version: '1.0.1',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '',
	description: 'Beg some money from Hadestia. let\'s see if he was generous to give you.',
	credits: 'Hadestia',
	cooldowns: 0,
	aliases: [ 'beg' ],
	envConfig: {
		groupCommandOnly: true,
		needUserData: true,
		needGroupData: true
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix, Threads }) {

	const { threadID, messageID, senderID } = event;
	
	try {
		const threadData = await Threads.getData(threadID);
		const economy = threadData.economy;
		
		const currency = threadData.data.default_currency || Utils.economySystem.config.default_currency;
		const minWage = Utils.economySystem.default.beg_min_salary;
		const maxWage = Utils.economySystem.default.beg_max_salary;
		
		// if user was in cooldown
		if (Date.now() < economy[senderID].beg_cooldown) {
			
			const timeA = new Date(economy[senderID].beg_cooldown);
			const timeB = new Date(Date.now());
			const countdown = await Utils.getRemainingTime(Math.abs(timeA - timeB)/1000)
			return api.sendMessage(
				`Quit begging, You may ask me money again in ${countdown}.`,
				threadID,
				Utils.autoUnsend,
				messageID
			);
		}
		
		const randomSalary = Math.floor(Math.random() * (maxWage - minWage + 1)) + minWage;
		const randomSuccessResponse = (Utils.economySystem.begResponseSuccess[Math.floor(Math.random() * (Utils.economySystem.begResponseSuccess).length)]).replace('${salary}', `${currency}${randomSalary.toLocaleString('en-US')}`);
		const randomFailedResponse = Utils.economySystem.begResponseFailed[Math.floor(Math.random() * (Utils.economySystem.begResponseFailed).length)];
		
		// set time for user for his/her next session
		economy[senderID].beg_cooldown = (Date.now() + Utils.economySystem.default.beg_cooldown);

		// if user was in debt just a lil consideration will do :)
		if (economy[senderID].hand < 0) {
			
			economy[senderID].hand += randomSalary;
			api.sendMessage(randomSuccessResponse, threadID, messageID);
			
		} else {
			// do the probability
			if (Math.random() <= Utils.economySystem.default.beg_success_rate) {
				
				economy[senderID].hand += randomSalary;
				api.sendMessage(randomSuccessResponse, threadID, messageID);
				
			} else {
				api.sendMessage(randomFailedResponse, threadID, messageID);
			}
		}
		await Threads.setData(threadID, { economy });
		
	} catch (err) {
		console.log(err, 'error');
		//returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
	
}