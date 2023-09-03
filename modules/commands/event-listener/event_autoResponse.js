module.exports.config = {
    name: 'auto-response',
    version: '1.0.4',
    credits: 'Hadestia', // pls don't change my credit as for my effort for this work.
    description: 'turned on to automatically response into any matched messages installed in the system.',
    commandCategory: 'hidden',
    hasPermssion: 3,
    usages: '',
    envConfig: {
    	groupCommandOnly: true,
		handleEvent_allowBannedUsers: true,
		handleEvent_allowBannedThreads: true,
		handleEvent_allowDirectMessages: true
	}
}

module.exports.handleEvent = async ({ api, event, Utils, Users, Threads }) => {
	
	const { body, mentions, threadID, messageID, senderID } = event;
	
	const threadData = await Threads.getData(threadID);
	const threadSettings = (threadData) ? threadData.data : {};
	
	const dictionary = require('../../json/autoResponse.json');
	const senderBody = body.toLowerCase();
	
	if (senderBody === 'prefix') {
		return api.sendMessage((await constructMessage(api, event, 'Hey!, looking for me? This is my prefix\n❱ ${prefix} ❰', Users, Threads)), threadID, messageID);
	}
	
	//if private messages
	threadSettings.auto_response_listener = (senderID == threadID) ? true : threadSettings.auto_response_listener;
	
	const { ADMINBOT } = global.HADESTIA_BOT_CONFIG;
	if (!threadSettings.auto_response_listener || ADMINBOT[0] == senderID) return;
	
	// Ignore messages with bot prefix
	if (senderBody.startsWith(threadSettings.PREFIX || global.HADESTIA_BOT_CONFIG.PREFIX)) {
		return;
	// avoid interaction if user mentioned this bot, (mentioning bot can also be a prefix for command (see handleCommand.js))
	} else if (senderBody.startsWith('@')) {
		if (Object.keys(mentions).length === 1 && Object.values(mentions)[0] === Utils.BOT_ID) {
			return;
		}
	}
	
	for (const type in dictionary) {
		
		const typeProperty = dictionary[type];
		
		if (typeProperty.single_message_only) {
			
			for (const match of typeProperty.matches) {
				if (senderBody === match) {
					const responseText = typeProperty.response[Math.floor(Math.random() * typeProperty.response.length)];
					const toSend = await constructMessage(api, event, responseText, Users, Threads);
					(typeProperty.do_not_reply) ? api.sendMessage(toSend, threadID) : api.sendMessage(toSend, threadID, messageID);
					return;
				}
			}
			
		} else if (typeProperty.required_mention && event.type === 'message_reply') {
			try { // sometimes it the message was deleted that causing error
				if (event.messageReply.senderID == api.getCurrentUserID()) {
					for (const match of typeProperty.matches) {
						if (hasMatchedString(senderBody, match)) {
							const responseText = typeProperty.response[Math.floor(Math.random() * typeProperty.response.length)];
							const toSend = await constructMessage(api, event, responseText, Users, Threads);
							(typeProperty.do_not_reply) ? api.sendMessage(toSend, threadID) : api.sendMessage(toSend, threadID, messageID);
							return;
						}
					}
				}
			} catch (err) {}
		} else if (typeProperty.stand_alone) {
			for (const match of typeProperty.matches) {
				if (hasMatchedString(senderBody, match)) {
					const responseText = typeProperty.response[Math.floor(Math.random() * typeProperty.response.length)];
					const toSend = await constructMessage(api, event, responseText, Users, Threads);
					(typeProperty.do_not_reply) ? api.sendMessage(toSend, threadID) : api.sendMessage(toSend, threadID, messageID);
					return; 
				}
			}
		} else if (typeProperty.reaction) {
			for (const match of typeProperty.matches) {
				if (hasMatchedString(senderBody, match)) {
					const responseText = typeProperty.response[Math.floor(Math.random() * typeProperty.response.length)];
					return Utils.sendReaction.custom(api, event, responseText);
				}
			}
		}
	}
}

module.exports.run = async function ({ api, event, Threads, Utils }) {
	
	const { threadID, messageID } = event;
	const threadData = await Threads.getData(threadID);
	let data = threadData.data;
	
	data.auto_response_listener = !data.auto_response_listener;
	
	const state = data.auto_response_listener;
	// update data
	await Threads.setData(threadID, { data });
	// send response
	return api.sendMessage(
		Utils.textFormat('cmd', `eventAutoResponse${(state) ? 'On' : 'Off'}`),
		threadID,
		Utils.autoUnsend,
		messageID
	);
}

async function constructMessage(api, event, text, Users, Threads) {
	
	const moment = require('moment-timezone');
	const hour = moment.tz('Asia/Manila').format('HH');
	
	const threadData = await Threads.getData(event.threadID);
	const threadSetting = threadData.data;
	
	const botPrefix = (threadSetting.hasOwnProperty('PREFIX')) ? threadSetting.PREFIX : global.HADESTIA_BOT_CONFIG.PREFIX;
	// get user name
	const sender = await Users.getNameUser(event.senderID);
	const single_name = sender.split(' ');
	
	let greeting = (
		(hour === 12) ? 'Good noon' :
		(hour >= 0 && hour < 11) ? 'Good morning' :
		(hour >= 11 && hour < 18) ? 'Good afternoon' :
		(hour >= 18 && hour <= 24) ? 'Good evening' : ''
	);
	
	// replace text
	let result = text.replace('${meridiem}', greeting)
		.replace('${prefix}', botPrefix);
		//.replace();
		//...
	
	// check if needs mentioning
	if (result.indexOf('${mention}') !== -1) {
		return { body: result.replace('${mention}', single_name[0]), mentions: [{ tag: single_name[0], id: event.senderID }] };
	} else {
		return { body: result };
	}
}

function hasMatchedString(str, ref) {
	ref = ref.replace(/\${_}/g, ' ');
	return str.indexOf(ref) !== -1;
}