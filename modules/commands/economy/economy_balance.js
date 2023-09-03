//////// BALANCE: GROUP ECONOMY FEATURE BY HADESTIA ///////

module.exports.config = {
	name: 'balance',
	version: '3.0.1',
	hasPermssion: 0,
	commandCategory: 'economy',
	usages: '',
	description: 'View your balance.',
	credits: 'Hadestia',
	cooldowns: 5,
	aliases: [ 'bal' ],
	envConfig: {
		needUserData: true,
		needGroupData: true,
		groupCommandOnly: true
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix, Users, Threads }) {

	const leaderboard = require('./economy_leaderboard.js');
	
	const { threadID, messageID, senderID } = event;
	
	try {
		const threadData = await Threads.getData(threadID);
		const economy = threadData.economy;
		
		let ID, NAME;
		// if message reply
		if (event.type == 'message_reply') {
			ID = event.messageReply.senderID;
			
		// if @mention
		} else if (Object.keys(event.mentions).length > 0) {
			ID = Object.keys(event.mentions)[0];
			NAME = Object.values(event.mentions)[0].replace('@', '');
		}
		ID = (!ID) ? senderID : ID;
		
		if (!economy[ID]) {
			economy[ID] = Utils.economySystem.userConfig;
			await Threads.setData(threadID, { economy });
		}
		
		// GET CURRENT USER LEADERBOARD POSITION
		const leaderboards = await leaderboard.sortLeaderboard(ID, economy, '', Users, Utils);
		
		const currency = threadData.data.default_currency || Utils.economySystem.config.default_currency;
	
		const owner = await Utils.getUserInfo(ID) || {};
		const ownerName = await Utils.fancyFont.get((NAME && (NAME).split(' ')[0]) || (owner.name) ? (owner.name == 'Facebook User') ? owner.name : (owner.name).split(' ')[0] : 'Facebook User', 1);
		
		const formatOnHand = (economy[ID].hand).toLocaleString('en-US');
		const formatOnBank = (economy[ID].bank).toLocaleString('en-US');
		const formatTotal = (economy[ID].hand + economy[ID].bank).toLocaleString('en-US');
		
		return api.sendMessage(Utils.textFormat('economy', 'cmdBalance', ownerName, leaderboards.userPosition, currency, formatOnHand, formatOnBank, formatTotal), threadID, messageID);
		
	} catch (err) {
		returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		console.log(err, 'error');
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
	
}