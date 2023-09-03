module.exports.config = {
	name: 'banned',
	version: '1.0.0',
	credits: 'Hadestia',
	cooldowns: 0,
	hasPermssion: 2,
	commandCategory: 'ownership',
	description: 'Manage banned Users or Groups.',
	usages: '[ ban-(user/group) | unban-(user/group) | check | list ] [ id | this-group | @mention ] | [ ... ]',
	envConfig: {
		requiredArgument: 1
	}
}

const databaseConfig = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/databaseConfig.json`);
const textFormat = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/utils/textFormat.js`);

module.exports.run = async function ({ api, args, event, Utils, Users, Banned, Threads }) {
	
	const timezone = require('moment-timezone').tz('Asia/Manila').format('MM-DD-YYYY @HH:mm A');
	const { threadID, messageID, mentions } = event;
	const command = args.shift(); // get command type

	function send(msg) {
		return api.sendMessage(msg, threadID, ()=>{}, messageID);
	}
	
	function sendBanNotice(msg, reason, id) {
		return api.sendMessage(textFormat('banned', 'bannedNoticeMessage', msg, (reason) ? `reason: "${reason}."` : ''), id, (e, i) => {});
	}

	if (!['ban-user', 'ban-group', 'unban-user', 'unban-group', 'check', 'list'].includes(command)) {
		return send(composeError('Invalid command type.'));
	}
	
	const successProcess = [];
	
	switch (command) {
		////////// BAN USER //////////
		case 'ban-user': {
			// return if no reason detected
			if (!(args.join(' ')).match(/\|/g)) {
				send(composeError('Reason cannot found.'));
				break;
			}
			const splitInput = args.join(' ').split('|');
			const reason = (splitInput.pop()).trim();
			let isError = false;
			// if mention
			if (Object.keys(mentions).length > 0) {
				
				for (const userID in mentions) {
					const userName = (mentions[userID]).replace('@', '');
					try {
						const hasRecord = await Banned.hasRecord(userID);
						if (!hasRecord) {
							await setBan(userID, userName, reason, false, Banned, Users, Threads);
							sendBanNotice('You have been banned from using this bot.', reason, userID);
							successProcess.push(userName);
						} else {
							send(composeError(`User: ${userName} has already had a ban record.`));
						}
					} catch (err) {
						//failProcess.push(userName);
						send(composeError(err));
						isError = true
						break;
					}
				}
			// if by id
			} else {
				const targets = (((splitInput[0]).replace('ban-user', '')).trim()).split(/\s+/g);
				for (const targetID of targets) {
					try {
						if (!parseInt(targetID)) {
							send(composeError(`Invalid, expected User ID, got string: ${targetID}`));
							break;
						}
						
						let userInfo = await api.getUserInfoV2(targetID);
						let userName = (userInfo) ? userInfo.name : 'Facebook User';
						const hasRecord = await Banned.hasRecord(targetID);
						
						if (!hasRecord) {
							await setBan(targetID, userName, reason, false, Banned, Users, Threads);
							sendBanNotice('You have been banned from using this bot.', reason, targetID);
							successProcess.push(userName);
						} else {
							send(composeError(`User: ${userName} has already had a ban record.`));
						}
					} catch (err) {
						send(composeError(err));
						isError = true
						break;
					}
				}
			}
			
			//
			if (!isError && successProcess.length > 0) {
				api.sendMessage(textFormat('success', 'successfulFormat', `Successfully Banned User(s):\n-${await successProcess.join('\n-')}`), threadID, messageID);
			}
			break;
		}
		
		
		////////// BAN GROUP //////////
		case 'ban-group': {
			// return if no reason detected
			if (!(args.join(' ')).match(/\|/g)) {
				send(composeError('Reason cannot found.'));
				break;
			}
			const splitInput = args.join(' ').split('|');
			const reason = (splitInput.pop()).trim();
			let isError = false;
			
			const targets = (((splitInput[0]).replace('ban-group', '')).trim()).split(/\s+/g);
			for (const targetID of targets) {
				try {
					if (!parseInt(targetID)) {
						send(composeError(`Invalid, expected Group ID, got string: ${targetID}`));
						break;
					}
					let threadInfo = await Threads.getInfo(targetID);
					let threadName = (threadInfo) ? threadInfo.threadName : 'No Group Name';
					const hasRecord = await Banned.hasRecord(targetID);
					
					if (!hasRecord) {
						await setBan(targetID, threadName, reason, true, Banned, Users, Threads);
						sendBanNotice('An Admin just banned this group from using this bot.', reason, targetID);
						successProcess.push(threadName);
					} else {
						send(composeError(`Group: ${threadName} has already had a ban record.`));
					}
				} catch (err) {
					send(composeError(err));
					isError = true
					break;
				}
			}
			
			if (!isError && successProcess.length > 0) {
				api.sendMessage(textFormat('success', 'successfulFormat', `Successfully Banned Group(s):\n-${await successProcess.join('\n-')}`), threadID, messageID);
			}
		
			break;
		}
		
		
		////////// UNBAN USER //////////
		case 'unban-user': {
			const splitInput = args.join(' ').split('|');
			let isError = false;
			
			if (Object.keys(mentions).length > 0) {
				
				for (const userID in mentions) {
					const userName = (mentions[userID]).replace('@', '');
					try {
						const hasRecord = await Banned.hasRecord(userID);
						if (hasRecord) {
							await deleteBan(userID, false, Banned, Users, Threads);
							sendBanNotice('An Admin just unbanned you from using this bot.', null, userID);
							successProcess.push(userName);
						} else {
							send(composeError(`User: ${userName} has no ban record.`));
						}
					} catch (err) {
						//failProcess.push(userName);
						send(composeError(err));
						isError = true
						break;
					}
				}
			// if by id
			} else {
				const targets = (((splitInput[0]).replace('unban-user', '')).trim()).split(/\s+/g);
				for (const targetID of targets) {
					try {
						if (!parseInt(targetID)) {
							send(composeError(`Invalid, expected User ID, got string: ${targetID}`));
							break;
						}
						
						let userInfo = await api.getUserInfoV2(targetID);
						let userName = (userInfo) ? userInfo.name : 'Facebook User';
						const hasRecord = await Banned.hasRecord(targetID);
						
						if (hasRecord) {
							await deleteBan(targetID, false, Banned, Users, Threads);
							sendBanNotice('An Admin just unbanned you from using this bot, You may now use this service.', null, targetID);
							successProcess.push(userName);
						} else {
							send(composeError(`User: ${userName} has no ban record.`));
						}
					} catch (err) {
						send(composeError(err));
						isError = true
						break;
					}
				}
			}
			
			if (!isError && successProcess.length > 0) {
				api.sendMessage(textFormat('success', 'successfulFormat', `Successfully Unbanned User(s):\n-${await successProcess.join('\n-')}`), threadID, messageID);
			}
			
			break;
		}
		
		
		////////// UNBAN GROUP //////////
		case 'unban-group': {
			const splitInput = args.join(' ').split('|');
			let isError = false;
			
			const targets = (((splitInput[0]).replace('unban-group', '')).trim()).split(/\s+/g);
			for (const targetID of targets) {
				try {
					if (!parseInt(targetID)) {
						send(composeError(`Invalid, expected Group ID, got string: ${targetID}`));
						break;
					}
					let threadInfo = await Threads.getInfo(targetID);
					let threadName = (threadInfo) ? threadInfo.threadName : 'No Group Name';
					const hasRecord = await Banned.hasRecord(targetID);
					
					if (hasRecord) {
						await deleteBan(targetID, true, Banned, Users, Threads);
						sendBanNotice('An Admin just unban this group, You all may now use this service.', null, targetID);
						successProcess.push(threadName);
					} else {
						send(composeError(`Group: ${threadName} has no ban record.`));
					}
				} catch (err) {
					send(composeError(err));
					isError = true
					break;
				}
			}
			
			if (!isError && successProcess.length > 0) {
				api.sendMessage(textFormat('success', 'successfulFormat', `Successfully Unbanned Group(s):\n-${await successProcess.join('\n-')}`), threadID, messageID);
			}
			break;
		}
		
		
		////////// CHECK RECORD //////////
		case 'check': {
			//const splitInput = args.join(' ').split('|');
			if (args.length == 0) {
				send(composeError('Invalid target, target cannot be emptied.'));
				break;
			}
			// if mention type
			if (Object.keys(mentions).length > 0) {
				
				for (const userID in mentions) {
					handleBanChecking(userID, api, send, threadID, messageID, Banned);
				}
				
			} else {
				for (const targetID of args) {
					try {
						if (!parseInt(targetID)) {
							send(composeError(`Invalid, expected ID, got string: ${targetID}`));
							break;
						}
						handleBanChecking(targetID, api, send, threadID, messageID, Banned);
					} catch (err) {
						send(composeError(err));
						break;
					}
				}
			}
			break;
		}
		default: {
			break;
		}
	}
}

function composeError (msg) {
	return textFormat('error', 'errOccured', msg);
}

function createCaseNum () {
	return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
}

async function setBan(ID, name, reason, isGroup, Banned, Users, Threads) {
	try {
		const timezone = require('moment-timezone').tz('Asia/Manila').format('MM-DD-YYYY @HH:mm');
		if (isGroup) {
			let thread = await Threads.getData(ID);
			const data = thread.data;
			data.isBanned = true;
								
			data.banned.caseID = createCaseNum();
			data.banned.reason = reason;
			data.banned.dateIssued = timezone;
		
			const bannedData = data.banned;
			bannedData.name = name;
			bannedData.isGroup = true;
		
			await Threads.setData(ID, { data });
			await Banned.setData(ID, { data: bannedData });
		} else {
			let user = await Users.getData(ID);
			const data = user.data;
			data.isBanned = true;
								
			data.banned.caseID = createCaseNum();
			data.banned.reason = reason;
			data.banned.dateIssued = timezone;
			
			const bannedData = data.banned;
			bannedData.name = name;
			bannedData.isGroup = false;
		
			await Users.setData(ID, { data });
			await Banned.setData(ID, { data: bannedData });
		}
		return;
	} catch (e) {
		throw new Error(e);
	}
}

async function deleteBan (ID, isGroup, Banned, Users, Threads) {
	try {
		if (isGroup) {
			let thread = await Threads.getData(ID);
			const data = thread.data;
			data.isBanned = false;
			data.banned = new Object(databaseConfig.group_data_config.banned);
			
			await Threads.setData(ID, { data });
			await Banned.delData(ID);
		} else {
			let user = await Users.getData(ID);
			const data = user.data;
			data.isBanned = false;
			data.banned = new Object(databaseConfig.user_data_config.banned);
			
			await Users.setData(ID, { data });
			await Banned.delData(ID);
		}
		return;
	} catch (e) {
		throw new Error(e);
	}
}

async function handleBanChecking(ID, api, send, threadID, messageID, Banned) {
	const hasRecord = await Banned.hasRecord(ID);
	if (hasRecord) {
		const { data: record } = await Banned.getData(ID);
		api.sendMessage(
			textFormat(
				'banned', 'bannedRecordInfo',
				record.caseID,
				ID,
				record.name,
				(record.isGroup) ? 'Yes' : 'No',
				record.reason,
				record.dateIssued
			),
			threadID,
			()=>{},
			messageID
		);
	} else {
		send(composeError(`User/Group: ${ID} has no ban record.`));
	}
}