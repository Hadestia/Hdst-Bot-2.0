//////// GIVE: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'give-money',
	version: '1.0.1',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '<@mention> <amount | all>',
	description: 'Give money to someone.',
	credits: 'Hadestia',
	aliases: [ 'give' ],
	cooldowns: 60,
	envConfig: {
		needUserData: true,
		needGroupData: true,
		requiredArgument: 2,
		groupCommandOnly: true
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix, Threads }) {

	const { threadID, messageID, senderID } = event;
	
	try {
		const threadData = await Threads.getData(threadID);
		const economy = threadData.economy;
		
		const currency = threadData.data.default_currency || Utils.economySystem.config.default_currency;
		
		let ID, NAME;
		let amount = (args.join(' ').toLowerCase()).match(/\d+|all/g);
		
		if (!amount) {
			returns.remove_usercooldown();
			return api.sendMessage(Utils.textFormat('error', 'errOccured', `Invalid amount, include the amount you want to give.`), threadID, Utils.autoUnsend, messageID);
		};
		
		// @mention
		if (Object.keys(event.mentions).length > 0) {
			ID = Object.keys(event.mentions)[0];
			NAME = Object.values(event.mentions)[0].replace('@', '');
		} else {
			return returns.invalid_usage();
		}
		
		amount = (amount[0] == 'all') ? (economy[senderID].hand > 0) ? economy[senderID].hand : 0 : Math.abs(parseInt(amount[0]));
		// if 0 or not enough
		if (amount == 0 || economy[senderID].hand < amount) {
			returns.remove_usercooldown();
			return api.sendMessage(Utils.textFormat('economy', 'noHandMoney', currency, (economy[senderID].hand).toLocaleString('en-US')), threadID, Utils.autoUnsend, messageID);
		}
		
		// get names
		const recipient = await Utils.getUserInfo(ID) || {};
		const recipientName = (NAME && (NAME).split(' ')[0]) || (recipient.name) ? (recipient.name == 'Facebook User') ? recipient.name : (recipient.name).split(' ')[0] : 'Facebook User';
		
		// ## Process
		// transfer to recipient
		economy[ID].hand += amount;
		economy[senderID].hand -= amount;
		
		await Threads.setData(threadID, { economy });
		return api.sendMessage(
			{
				body: Utils.textFormat('success', 'successfulFormat', `@${recipientName} has received your ${currency}${amount.toLocaleString('en-US')}.`),
				mentions: [{ tag: `@${recipientName}`, id: ID }]
			},
			threadID,
			Utils.autoUnsend,
			messageID
		);
	} catch (err) {
		returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		console.log(err, 'error');
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
	
}