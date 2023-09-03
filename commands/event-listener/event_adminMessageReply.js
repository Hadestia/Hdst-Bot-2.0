module.exports.config = {
	name: 'admin-reply-message',
	usages: '',
	version: '1.0.3',
	commandCategory: 'hidden',
	description: 'Admin Utilities',
	hasPermssion: 2,
	credits: 'Hadestia'
}

// nothing to do here this is a hidden command
module.exports.run = function ({ api, args, event }) {}

module.exports.handleMessageReply = async function ({ api, event, ignore_adminMessageReply, Utils, Users, Threads }) {
	
	if (!event.messageReply) return;

	try {
		const { ADMINBOT, PREFIX } = global.HADESTIA_BOT_CONFIG;
		
		if (!event.body.startsWith(PREFIX) && !ignore_adminMessageReply.includes(event.body.toLowerCase())) {
			
			const { messageReply, threadID, messageID, senderID, body } = event;
			if (messageReply.senderID !== Utils.BOT_ID) return;
			if (messageReply.body.indexOf('𝗔𝗻𝗼𝗻𝘆𝗺𝗼𝘂𝘀 𝗠𝗲𝘀𝘀𝗮𝗴𝗲') !== -1) return;
			
			const replyBody = messageReply.body;
		
			// dont track replies within admins conversation (DM)
			if (!ADMINBOT.includes(threadID)) {
			
				const group = await Threads.getInfo(threadID) || {};
				const sender_name = await Users.getNameUser(senderID);
			
				// contruct message that will send to admin
				const message = Utils.textFormat('events', 'eventMessageReplyToAdmin', (event.isGroup) ? group.threadName || '<No Data>' : sender_name, sender_name, body, messageReply.body, threadID, messageID);
			
				for (const adminID of ADMINBOT) {
					api.sendMessage(
						message, adminID,
						(e) => {
							if (replyBody.indexOf('𝗔𝗱𝗺𝗶𝗻 𝗿𝗲𝗽𝗹𝘆') !== -1) {
								if (e) return Utils.sendReaction.failed(api, event);
								return Utils.sendReaction.success(api, event);
							}
						}
					);
				}
				return;
			
			} else {
			
				const replyBody = messageReply.body;
				// console.log(replyBody);
				if (replyBody.indexOf('𝚝𝚛𝚊𝚌𝚔-𝚒𝚍') === -1) return;
			
				const recipient = replyBody.split('\n');
				// get message id & thread id where the message came from
				const track_id = recipient.pop() || '';
				const thread_id = recipient.pop() || '';
			
				//const recipient = global.logMessageReplyTrack.get(trackId) || {};
				
			
				if (thread_id == '' || track_id == '') {
					return api.sendMessage(`Couldn't get recipient IDs`, threadID);
				}
			
				// decide who will handle admin response
			
				//# handle admin reply to bot report
				if (replyBody.indexOf('𝗔𝗱𝗺𝗶𝗻 𝗿𝗲𝗽𝗹𝘆') !== -1 || replyBody.indexOf('𝗕𝗼𝘁 𝗥𝗲𝗽𝗼𝗿𝘁') !== -1) {
					return api.sendMessage(
						Utils.textFormat('events', 'eventAdminReply', body), thread_id,
						(err) => {
							if (err) return Utils.sendReaction.failed(api, event);
							Utils.sendReaction.success(api, event);
						},
						track_id
					);
				//# handle admin reply normal
				} else if (replyBody.indexOf('𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝗿𝗲𝗽𝗹𝘆') !== -1) {
					return api.sendMessage(
						body, thread_id, (err) => {
						if (err) return Utils.sendReaction.failed(api, event);
							Utils.sendReaction.success(api, event);
						},
						track_id
					);
				}
			}
		}
	} catch (err) {
		console.log(err);
		Utils.logModuleErrorToAdmin(err, __filename, event);
	}
}