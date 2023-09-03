//////// WITHDRAW: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'withdraw',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '< amount | all >',
	description: 'Withdraw cash from bank.',
	credits: 'Hadestia',
	cooldowns: 5,
	aliases: [ 'with' ],
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
		const moneyOnBank = economy[senderID].bank;
		const moneyOnBankText = (moneyOnBank).toLocaleString('en-US');

		if (moneyOnBank <= 0) return api.sendMessage(Utils.textFormat('error', 'errOccured', `You don\'t have any money to withdraw. You currently have ${currency}${moneyOnBankText} in the bank.`), threadID, Utils.autoUnsend, messageID);
		
		if ((args[0]).toLowerCase() == 'all') {
			// withdraw all from bank
			economy[senderID].bank = 0;
			economy[senderID].hand += moneyOnBank;
			var amount = moneyOnBank;
			
		} else {
			var amount = parseInt(args[0]);
			if (!amount) return returns.invalid_usage();
			amount = Math.abs(amount); // make negative numbers as positive
			
			if (amount > moneyOnBank) return api.sendMessage(Utils.textFormat('error', 'errOccured', `You don't have that much money to withdraw. You currently have ${currency}${moneyOnBankText} in the bank.`), threadID, Utils.autoUnsend, messageID);
			// withdraw certain amount from bank
			economy[senderID].bank -= amount;
			economy[senderID].hand += amount;
		}
		
		const amountText = (amount).toLocaleString('en-US');
		await Threads.setData(threadID, { economy });
		return api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Withdrew ${currency}${amountText} from bank`), threadID, messageID);
	} catch (err) {
		//returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		console.log(err, 'error');
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
	
}