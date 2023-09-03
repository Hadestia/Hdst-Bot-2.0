//////// ROB: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'rob',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '<@mention>',
	description: 'Earning money would be so easy if we could just rob money from others, Unless you get caught.',
	credits: 'Hadestia',
	cooldowns: 0,
	envConfig: {
		requiredArgument: 1,
		needGroupData: true,
		groupCommandOnly: true
	},
	min_fined: 5000,
	max_fined: 10000
}

module.exports.run = async function ({ api, args, event, returns, Utils, Threads }) {
	
	const { threadID, messageID, senderID } = event;
	const dateNow = Date.now();

	try {
		const { data, economy } = await Threads.getData(threadID);
		data.rob_cooldown = data.rob_cooldown || Utils.economySystem.config.rob_cooldown; // 1hr default

		if (Object.keys(event.mentions).length > 0) {
			
			const targetID = Object.keys(event.mentions)[0];
			const targetName = await Utils.fancyFont.get(((Object.values(event.mentions)[0].replace('@', '')).split(' '))[0], 1);
			
			const thisUserEco = economy[senderID] || Utils.economySystem.userConfig;
			const targetEco = economy[targetID] || Utils.economySystem.userConfig;
			const thisUserMoney = thisUserEco.hand + thisUserEco.bank;
			
			if (dateNow < thisUserEco.rob_cooldown) {
				return returns.user_in_cooldown(thisUserEco.rob_cooldown, dateNow);
			}
			
			const isLucky = (Math.random() >= ((thisUserMoney < 0) ? data.rob_fail_probability + 0.2 : data.rob_fail_probability));
			const moneyCanTake = (targetEco.hand <= 20) ? targetEco.hand : Math.floor(targetEco.hand * data.rob_success_probability);
			// User can rob
			if (isLucky) {
				if (targetEco.hand <= 0) {
					const response = (Utils.economySystem.robFailedUserNoMoney).replace('${user}', targetName);
					api.sendMessage(Utils.textFormat('error', 'errOccured', response), threadID, messageID);
				} else {
					targetEco.hand -= moneyCanTake;
					thisUserEco.hand += moneyCanTake;
					api.sendMessage(Utils.textFormat('success', 'successfulFormat', `You robbed ${data.default_currency}${moneyCanTake.toLocaleString('en-US')} from ${targetName}.`), threadID, messageID);
				}
			} else {
				const fined = Math.floor(Math.random() * (this.config.min_fined - this.config.max_fined + 1)) + this.config.min_fined;
				const response = (Utils.economySystem.robFailedBeingCaught)
					.replace('${user}', targetName)
					.replace('${fined}', `${data.default_currency}${fined.toLocaleString('en-US')}`);
						
				thisUserEco.hand -= fined;
				api.sendMessage(Utils.textFormat('error', 'errOccured', response), threadID, messageID);
			}
			
			thisUserEco.rob_cooldown = Date.now() + data.rob_cooldown;
			economy[senderID] = thisUserEco;
			economy[targetID] = targetEco;
			
			await Threads.setData(threadID, { data, economy });
			
		} else {
			return returns.invalid_usage();
		}
		
	} catch (err) {
		
	}
}