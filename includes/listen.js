module.exports = async function({ api, models }) {
	
	const fs = require('fs');
	const moment = require('moment-timezone');
	const cron = require('node-cron');
	const axios = require('axios');
	
	const Users = require('./controllers/controller_users')({ models, api }),
		Threads = require('./controllers/controller_threads')({ models, api }),
		Banned = require('./controllers/controller_banned')({ models, api });
	
	const iutil = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/scripts/utils.js`);
	const Utils = await iutil({ api, Users, Banned, Threads });
	
	const databaseSystem = require('../json/databaseConfig.json');
	const economySystem = require('../json/economySystem.json'); 
	const handleDB = require('./handle/handleCreateDatabase');

	///////// DO RE-CHECKING DATABASE
	await (async function() {
		//setInterval(function () {
			api.markAsReadAll((err) => {
				if (err) return console.error('Error [Mark as Read All]: ' + err)
			});
		//}, 10000);
		
		try {
			
			//const handleCreateDatabase = require('./handle/handleCreateDatabase');
			Utils.logger(Utils.getText('listen', 'startLoadEnvironment'), '[ DATABASE ]');
			
			let users = await Users.getAll(['userID', 'name', 'data', 'experience']),
				threads = await Threads.getAll(['threadID', 'threadInfo', 'data', 'economy', 'afk', 'inventory']);
				
			for (const GroupData of threads) {
				
				let Info;
				const threadID = String(GroupData.threadID);

				try {
					const Info = await Threads.getInfo(threadID);
				} catch (e) { };
				
				if (GroupData.data && Info) {
					// auto leave inactive(amag) groups
					if (Info.timestamp) {
						const dateNow = Date.now();
						const diff = Math.abs(dateNow - Info.timestamp);
						if (diff >= 432000000) {
							const howLong = Utils.getRemainingTime(diff/1000);
							api.sendMessage(
								Utils.textFormat('events', 'eventInactiveGroupNotice', howLong),
								threadID,
								async (e) => {
									api.removeUserFromGroup(Utils.BOT_ID, threadID, (e)=>{});
									api.deleteThread(threadID, (e)=>{});
									await Threads.delData(threadID);
								}
							);
						} else {
							// only updates when there's an update
							if (Utils.BOT_IS_UPDATED) {
								await handleDB.handleGroupData({ update: true, threadID, databaseSystem, economySystem, Utils, Users, Threads, Banned });
							} else {
								if (!global.HADESTIA_BOT_DATA.allThreadID.has(threadID)) {
									global.HADESTIA_BOT_DATA.allThreadID.set(threadID, true);
								}
								
								if (GroupData.isBanned) {
									const banned = GroupData.banned;
									const data = {
										isGroup: true,
										name: Info.threadName,
										caseID: banned.caseID || -1,
										reason: banned.reason || '<reason not set>',
										dateIssued: banned.dateIssued || '<unknown date>'
									}
									await Banned.setData(threadID, { data });
								}
							}
						}
					} else {
						await Threads.delData(threadID);
					}
				}
			}
			
			Utils.logger.loader(Utils.getText('listen', 'loadedEnvironmentThread'));
			
			for (const UserData of users) {
				
				const userID = String(UserData.userID);
				
				if (UserData.data) {
					if (Utils.BOT_IS_UPDATED) {
						handleDB.handleUserData({ update: true, userID, userName: UserData.name, databaseSystem, economySystem, Utils, Users, Threads, Banned });
					} else {
						if (!global.HADESTIA_BOT_DATA.allUserID.has(userID)) {
							global.HADESTIA_BOT_DATA.allUserID.set(userID, true);
						}
						
						if (UserData.isBanned) {
							const name = await Users.getNameUser(userID);
							const banned = UserData.banned;
							const data = {
								name,
								isGroup: false,
								caseID: userData.data.banned.caseID || -1,
								reason: userData.data.banned.reason || '<reason not set>',
								dateIssued: userData.data.banned.dateIssued || '<unknown date>'
							}
							await Banned.setData(userID, { data });
						}
					}
				} else {
					try { await Users.delData(userID); } catch (e) {}
				}
			}
			
			Utils.logger.loader(Utils.getText('listen', 'loadedEnvironmentUser'))
			Utils.logger(Utils.getText('listen', 'successLoadEnvironment'), '[ DATABASE ]');
			return;
		} catch (error) {
			console.log(error);
			return Utils.logger.loader(Utils.getText('listen', 'failLoadEnvironment', error), 'error');
		}
		
	}());
	
	const { autoRestart, PREFIX, BOTNAME, ADMINBOT } = global.HADESTIA_BOT_CONFIG;
	
	/////// BOT AUTO RESTART 
	if (autoRestart && autoRestart.status) {
		cron.schedule (`0 0 */${autoRestart.every} * * *`, async () => {
			const timezone = moment.tz('Asia/Manila');
			const time_now = timezone.format('HH:mm:ss');
			for (const admin of ADMINBOT) {
	  	  	await api.sendMessage(Utils.textFormat('system', 'botLogRestart', time_now), admin);
			}
			process.exit(1);
		},{
			scheduled: true,
			timezone: 'Asia/Manila'
		});
	}
	
	Utils.logger(`${Utils.BOT_ID} - [ ${PREFIX} ] • ${(!BOTNAME) ? 'This bot was forked & modified from original made by CatalizCS and SpermLord' : BOTNAME}`, '[ BOT INFO ]');
	
	///////////////////////////////////////////////
	//========= Require all handle need =========//
	//////////////////////////////////////////////
	
	const handleInputs = {
		api,
		models,
		Utils,
		Users,
		Banned,
		Threads
	};

	const handleCommand = require('./handle/handleCommand')(handleInputs);
	
	const handleCommandEvent = require('./handle/handleCommandEvent')(handleInputs);
	
	const handleCommandMessageReply = require('./handle/handleCommandMessageReply')(handleInputs);
	
	const handleReply = require('./handle/handleReply')(handleInputs);
	
	const handleReaction = require('./handle/handleReaction')(handleInputs);
	
	const handleEvent = require('./handle/handleEvent')(handleInputs);
	
	const handleCreateDatabase = handleDB(handleInputs);
	
	Utils.logger.loader(`====== ${Date.now() - global.HADESTIA_BOT_CLIENT.timeStart}ms ======`);
	
	/// COMMANDS AND EVENTS MODULE LATE INITIALIZATION ///
	const { events, commands } = global.HADESTIA_BOT_CLIENT;
	const ignore_adminMessageReply = [];
	// # Commands Late Init
	for (const [key, module] of commands.entries()) {
		try {
			if (module.config.ignoreAdminMessageReply) {
				for (const text of module.config.ignoreAdminMessageReply) {
					ignore_adminMessageReply.push(text.toLowerCase());
				}
			}
			
			if (module.lateInit) {
				Utils.logger(`Command Module Late Init: ${key}`, 'lateInit');
				module.lateInit({ api, models, Utils, Users, Banned, Threads });
			}
		} catch (error) {
			throw new Error(error);
		}
	}
		
	// # Events Late Init
	for (const [key, module] of events.entries()) {
		try {
			if (module.lateInit) {
				Utils.logger(`Event Module Late Init: ${key}`, 'lateInit');
				module.lateInit({ api, models, Utils, Users, Banned, Threads });
			}
		} catch (error) {
			throw new Error(error);
		}
	}


	//////////////////////////////////////////////////
	//========= Send event to handle need =========//
	/////////////////////////////////////////////////

	return async (event) => {
		
		event.body = (event.body !== undefined) ? (event.body).normalize('NFKD') : '';
		
        const input = { event, ignore_adminMessageReply }
        
		switch (event.type) {
			
			case 'message':
				
			case 'message_reply':
			
				handleCommandMessageReply(input);
				
			case 'message_unsend':
			
				handleCreateDatabase(input).then(() => {
				
					handleCommand(input);
				
					handleReply(input);
				
					handleCommandEvent(input);
					
				}).catch(console.error);

				break;
				
			case 'event':
			
				handleEvent(input);
				
				break;
				
			case 'message_reaction':
			
				handleReaction(input);
				
				break;
			
			default:
			
				break;
		
		}
	};
};

//THIZ BOT WAS MADE BY ME(CATALIZCS) AND MY BROTHER SPERMLORD - DO NOT STEAL MY CODE (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯in