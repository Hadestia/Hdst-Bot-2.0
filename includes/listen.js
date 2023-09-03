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
					Info = await Threads.getInfo(threadID);
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


	// DEFINE DATLICH PATH
	const datlichPath = __dirname + '/../modules/commands/cache/datlich.json';

	// FUNCTION HOẠT ĐỘNG NHƯ CÁI TÊN CỦA NÓ, CRE: DUNGUWU
	const monthToMSObj = {
		1: 31 * 24 * 60 * 60 * 1000,
		2: 28 * 24 * 60 * 60 * 1000,
		3: 31 * 24 * 60 * 60 * 1000,
		4: 30 * 24 * 60 * 60 * 1000,
		5: 31 * 24 * 60 * 60 * 1000,
		6: 30 * 24 * 60 * 60 * 1000,
		7: 31 * 24 * 60 * 60 * 1000,
		8: 31 * 24 * 60 * 60 * 1000,
		9: 30 * 24 * 60 * 60 * 1000,
		10: 31 * 24 * 60 * 60 * 1000,
		11: 30 * 24 * 60 * 60 * 1000,
		12: 31 * 24 * 60 * 60 * 1000
	};
	
	const checkTime = (time) => new Promise((resolve) => {
		
		time.forEach((e, i) => time[i] = parseInt(String(e).trim()));
		
		const getDayFromMonth = (month) => (month == 0) ? 0 : (month == 2) ? (time[2] % 4 == 0) ? 29 : 28 : ([1, 3, 5, 7, 8, 10, 12].includes(month)) ? 31 : 30;
		
		if (time[1] > 12 || time[1] < 1) resolve('Tháng của bạn có vẻ không hợp lệ');
		if (time[0] > getDayFromMonth(time[1]) || time[0] < 1) resolve('Ngày của bạn có vẻ không hợp lệ');
		if (time[2] < 2022) resolve('You live at the Kỷ nguyên nào thế giới?');
		if (time[3] > 23 || time[3] < 0) resolve('Giờ của bạn có vẻ không hợp lệ');
		if (time[4] > 59 || time[3] < 0) resolve('Phút của bạn có vẻ không hợp lệ');
		if (time[5] > 59 || time[3] < 0) resolve('Giây của bạn có vẻ không hợp lệ');
		
		yr = time[2] - 1970;
		yearToMS = (yr) * 365 * 24 * 60 * 60 * 1000;
		yearToMS += ((yr - 2) / 4).toFixed(0) * 24 * 60 * 60 * 1000;
		monthToMS = 0;
		
		for (let i = 1; i < time[1]; i++) {
			monthToMS += monthToMSObj[i];
		}
		
		if (time[2] % 4 == 0) {
			monthToMS += 24 * 60 * 60 * 1000;
		}
		
		dayToMS = time[0] * 24 * 60 * 60 * 1000;
		hourToMS = time[3] * 60 * 60 * 1000;
		minuteToMS = time[4] * 60 * 1000;
		secondToMS = time[5] * 1000;
		oneDayToMS = 24 * 60 * 60 * 1000;
		timeMs = yearToMS + monthToMS + dayToMS + hourToMS + minuteToMS + secondToMS - oneDayToMS;
		
		resolve(timeMs);
	});


	const tenMinutes = 10 * 60 * 1000;

	Utils.logger.loader(`====== ${Date.now() - global.HADESTIA_BOT_CLIENT.timeStart}ms ======`);
	
	const checkAndExecuteEvent = async () => {

		/*smol check*/
		if (!fs.existsSync(datlichPath)) {
			fs.writeFileSync(datlichPath, JSON.stringify({}, null, 4));
		}
		
		var data = JSON.parse(fs.readFileSync(datlichPath));

		//GET CURRENT TIME
		var timePH = moment().tz('Asia/Manila').format('DD/MM/YYYY_HH:mm:ss');
		
		timePH = timePH.split('_');
		timePH = [...timePH[0].split('/'), ...timePH[1].split(':')];

		let temp = [];
		let phMS = await checkTime(timePH);
		
		const compareTime = e => new Promise(async (resolve) => {
			let getTimeMS = await checkTime(e.split('_'));
			if (getTimeMS < phMS) {
				if (phMS - getTimeMS < tenMinutes) {
					data[boxID][e]['TID'] = boxID;
					temp.push(data[boxID][e]);
					delete data[boxID][e];
				} else delete data[boxID][e];
				fs.writeFileSync(datlichPath, JSON.stringify(data, null, 4));
			};
			resolve();
		})

		await new Promise(async (resolve) => {
			for (boxID in data) {
				for (e of Object.keys(data[boxID])) await compareTime(e);
			}
			resolve();
		})
		
		for (el of temp) {
			try {
				
				var all = (await Threads.getInfo(el['TID'])).participantIDs;
				
				all.splice(all.indexOf(api.getCurrentUserID()), 1);
				
				var body = el.REASON || 'Everybody',
					mentions = [],
					index = 0;

				for (let i = 0; i < all.length; i++) {
					if (i == body.length) body += ' ‍ ';
					mentions.push({
						tag: body[i],
						id: all[i],
						fromIndex: i - 1
					});
				}
				
			} catch (e) {
				return console.log(e);
			}
			
			var out = { body, mentions }
			
			if ('ATTACHMENT' in el) {
				
				out.attachment = [];
				
				for (a of el.ATTACHMENT) {
					
					let getAttachment = (await axios.get(encodeURI(a.url), {
						responseType: 'arraybuffer'
					})).data;
					
					fs.writeFileSync(__dirname + `/../modules/commands/cache/${a.fileName}`, Buffer.from(getAttachment, 'utf-8'));
					out.attachment.push(fs.createReadStream(__dirname + `/../modules/commands/cache/${a.fileName}`));
				}
				
			}
			
			console.log(out);
			
			if ('BOX' in el) { await api.setTitle(el['BOX'], el['TID']); }
			
			api.sendMessage(out, el['TID'], () => ('ATTACHMENT' in el) ? el.ATTACHMENT.forEach(a => fs.unlinkSync(__dirname + `/../modules/commands/cache/${a.fileName}`)) : '');
		}

	}
	
	setInterval(checkAndExecuteEvent, tenMinutes / 10);
	
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