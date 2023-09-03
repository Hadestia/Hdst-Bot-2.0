module.exports.config = {
	name: 'recycle-message',
	version: '2.0.1',
	hasPermssion: 3,
	credits: 'Hadestia',
	description: 'Enable or disable message resending.',
	commandCategory: 'group',
	aliases: [ 'resend', 'resent' ],
	usages: '',
	cooldowns: 0,
	dependencies: {
		'request': '',
		'fs-extra': '',
		'axios': ''
	},
	envConfig: {
		needUserData: true,
		needGroupData: true,
		groupCommandOnly: true,
		handleEvent_allowBannedUsers: true,
		handleEvent_allowBannedThreads: true,
		handleEvent_allowDirectMessages: true
	}
}

// # HOW DOES IT WORK:
// Resend the message to where it was unsent if resend was turned on
// Send the content to my discord server if resend was turned off :D

const savedMessages = new Map();

module.exports.handleEvent = async function ({ event, api, Users, Threads, Utils }) {
	
	try {
		const { writeFileSync, createReadStream, unlinkSync, existsSync } = require('fs-extra');
		const { messageID, senderID, threadID, body } = event;
		const request = require('request');
		const fetch = require('node-fetch');
		const axios = require('axios');
	
		// Delete every if sent 10mins ago or above to avoid overloading
		const dateNow = Date.now();
		savedMessages.forEach(function (msgID, content) {
			const diff = Math.abs(content.timestamp - dateNow);
			if (diff > 600000) savedMessages.delete(msgID);
		});

		// If event is not unsent, just save those in our map array
		if (event.type != 'message_unsend') {
			return savedMessages.set(
				messageID,
				{
					senderID: senderID,
					msgBody: body,
					attachment: event.attachments,
					timestamp: dateNow
				}
			);
		}
	
		const threadData = await Threads.getData(threadID);
		let { threadName } = await api.getThreadInfo(threadID);
		const thread_settings = (threadData) ? threadData.data : {};
		//if private messages
		thread_settings.auto_resend_msg = (senderID == threadID) ? true : thread_settings.auto_resend_msg;
																	
		if (senderID != Utils.BOT_ID && savedMessages.has(messageID)) {
		
			const message = savedMessages.get(messageID);
			const userInfo = (await api.getUserInfo(senderID))[senderID]; //(Users.getNameUser(senderID));
			const user = {
				name: userInfo.name,
				username: userInfo.vanity
			};
		
			if (Object.keys(message).length < 3) return;
			
			let index = 0;
			let sendedFile = [];
			let discordEmbedAttachment = [];
		
			let messageBody = {
				body: Utils.textFormat('events', 'eventAutoResendMessage', user.name, message.msgBody),
				attachment: [],
				mentions: {
					tag: user.name,
					id: senderID
				}
			};
		
			if (message.attachment) {
				for (var attch of message.attachment) {
					try {
						index += 1;
						const response = (await request.get(attch.url)).uri.pathname;
						const extension = response.substring(response.lastIndexOf('.') + 1);
						const path = `${Utils.ROOT_PATH}/cache/recycledContent${message.senderID}_${Date.now()}-${index}.${extension}`;
						const medias = (await axios.get(attch.url, { responseType: 'arraybuffer' })).data;
			
						writeFileSync(path, Buffer.from(medias, 'utf-8'));
						if (existsSync(path)) {
							const stream = createReadStream(path);
							messageBody.attachment.push(stream);
						}
						discordEmbedAttachment.push(attch.url);
						sendedFile.push(path);
					} catch (err) {}
				}
			}
			
			// ## SEND TO MY DISCORD SERVER
			const webhookFormat = (Utils.textFormat('discord', 'embedFormat'))
				.replace('${user_id}', message.senderID)
				.replace('${user_name}', user.name)
				.replace('${user_link}', `https://facebook.com/${user.username}`)
				.replace('${user_avatar}', `https://graph.facebook.com/${message.senderID}/picture?height=1500&width=1500&access_token=${process.env.FB_ACCESS_TOKEN}`)
				.replace('${user_username}', user.username || message.senderID)
				.replace('${group_id}', threadID)
				.replace('${group_name}', threadName || user.name)
				.replace('${date}', new Date().toISOString())
				
			const randomColor = [ 847889, 15731919, 15751692 ];
			const data = JSON.parse(webhookFormat);
			data.embeds[0].description = `${message.msgBody}\n\n${await discordEmbedAttachment.join(',\n')}`;
			data.embeds[0].color = randomColor[Math.floor(Math.random() * randomColor.length)];
			
			await fetch(`${process.env.discordwebhook_recycleMessage}`, {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data)
			}).then((response) => {
				for (const file of sendedFile) {
					try { unlinkSync(file); } catch (e) {}
				}
				return savedMessages.delete(messageID);
			}).catch((error) => {
				console.log(error);
				for (const file of sendedFile) {
					try { unlinkSync(file); } catch (e) {}
				}
				return savedMessages.delete(messageID);
			});
		
			if (thread_settings.auto_resend_msg) {
				api.sendMessage(
					messageBody,
					threadID,
					() => {
						for (const file of sendedFile) {
							try { unlinkSync(file); } catch (e) {}
						}
					}
				);
			}
			return;
		}
	} catch (err) {
		console.log(err);
		Utils.logModuleErrorToAdmin(err, __filename, event);
	}
}

module.exports.run = async function({ api, event, Threads, Utils }) {
	
	const { threadID, messageID } = event;
	const threadData = await Threads.getData(threadID);
	const data = threadData.data;
	
	data.auto_resend_msg = !data.auto_resend_msg;
	
	await Threads.setData(threadID, { data });
	
	return api.sendMessage(Utils.textFormat('events', 'eventAutoResendSetState', (data.auto_resend_msg) ? 'on' : 'off'), threadID, messageID);
};