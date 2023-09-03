module.exports.config = {
	name: 'event-auto-ban',
	version: '1.0.0',
	hasPermssion: 0,
	description: 'Event Listener to ban users.',
	commandCategory: 'hidden',
	credits: 'Hadestia',
	usages: '',
	envConfig: {
		handleEvent_allowDirectMessages: true
	}
}

module.exports.handleEvent = async function ({ api, event, Utils, Users, Banned }) {
	
	const { body, threadID, senderID, messageID } = event;
	const { ADMINBOT } = global.HADESTIA_BOT_CONFIG;
	
	const autobanData = require(`${Utils.ROOT_PATH}/json/autoResponse.json`);

	if (autobanData.autoban_bot_checker) {
		for (const item of autobanData.autoban_bot_checker.matches) {
			if ((body.toLowerCase()).indexOf(item) !== -1) {
				
				if (ADMINBOT.includes(senderID)) {
					return Utils.sendReaction.custom(api, event, '\uD83D\uDE0F');
				}
				
				try {
					const timezone = require('moment-timezone').tz('Asia/Manila').format('MM-DD-YYYY @HH:mm A');
				
					const randomCaseID = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
					const userData = await Users.getData(senderID);
					const userName = await Users.getNameUser(senderID);
					if (!userData) { throw 'User not Initialize'; }
					
					const data = userData.data;
					const banned = {};
					
					data.isBanned = true;
					banned.isGroup = false;
					banned.name = userName;
					banned.caseID = randomCaseID;
					banned.reason = 'Suspected as other bot.';
					banned.dateIssued = timezone;
					
					data.banned = banned;
					
					api.sendMessage(
						{
							body: Utils.textFormat('events', 'eventOtherBotDetected', userName),
							mentions: [ { tag: userName, id: senderID }]
						},
						threadID,
						(e) => {
							console.log(e)
						},
						messageID
					);
					
					await Users.setData(senderID, { data });
					await Banned.setData(senderID, { data: banned });
				
					return;
				} catch (err) {
					console.log('AUTO BAN BOT', err);
				}
			}
		}
	}
}

module.exports.run = function () {}