//////// DEPOSIT: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'deposit',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '< amount | all >',
	description: 'Deposit cash on hand to bank.',
	credits: 'Hadestia',
	cooldowns: 5,
	aliases: [ 'dep' ],
	envConfig: {
		needUserData: true,
		needGroupData: true,
		requiredArgument: 1,
		groupCommandOnly: true
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix, Threads }) {

	const { threadID, messageID, senderID } = event;
	
	try {
		
		const threadData = await Threads.getData(threadID);
		const economy = threadData.economy;

		if (!economy[senderID]) {
			economy[senderID] = Utils.economySystem.userConfig;
		}
		
		const currency = threadData.data.default_currency || Utils.economySystem.config.default_currency;
		const moneyOnHand = economy[senderID].hand;
		const moneyOnHandText = (moneyOnHand).toLocaleString('en-US');
		
		if (moneyOnHand <= 0) return api.sendMessage(Utils.textFormat('error', 'errOccured', 'You don\'t have any money to deposit.'), threadID, Utils.autoUnsend, messageID);
		
		if ((args[0]).toLowerCase() == 'all') {
			// transfer cash to bank
			economy[senderID].bank += moneyOnHand;
			economy[senderID].hand = 0;
			var amount = moneyOnHand;
			
		} else {
			var amount = parseInt(args[0]);
			if (!amount) return returns.invalid_usage();
			amount = Math.abs(amount); // make negative numbers as positive

			if (amount > moneyOnHand) return api.sendMessage(Utils.textFormat('error', 'errOccured', `You don't have that much money to deposit. You currently have ${currency}${moneyOnHandText} on hand.`), threadID, Utils.autoUnsend, messageID);
			
			economy[senderID].bank += amount;
			economy[senderID].hand -= amount;
		}
		const amountText = (amount).toLocaleString('en-US');
		await Threads.setData(threadID, { economy });
		return api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Deposited ${currency}${amountText} in bank.`), threadID, messageID);
		
	} catch (err) {
		//returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		console.log(err, 'error');
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
	
}