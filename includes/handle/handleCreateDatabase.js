module.exports = function({ Utils, Users, Threads, Banned }) {
	
	const databaseSystem = require(`${Utils.ROOT_PATH}/json/databaseConfig.json`); 
	const economySystem = require(`${Utils.ROOT_PATH}/json/economySystem.json`); 
	
	
	return async function ({ event }) {
		
		return new Promise(async function (resolve, reject) {
			
			// check if automatic DB creation was set
     	   if (!global.HADESTIA_BOT_CONFIG.autoCreateDB) {
				resolve(true);
				return;
			}
        
     	   let { senderID, threadID } = event;

     	   senderID = String(senderID);
			threadID = String(threadID);
		
    	    try {
				const inputData = {
					threadID,
					userID: senderID,
					databaseSystem,
					economySystem,
					Utils,
					Users,
					Threads,
					Banned
				}
		    
				// ####### IF GROUP CHAT ####### //
				if (event.isGroup && !global.HADESTIA_BOT_DATA.allThreadID.has(threadID)) {
					await handleGroupData(inputData);
        	    }
			
        	    if (!global.HADESTIA_BOT_DATA.allUserID.has(senderID)) {
           	 	let userName = `@user${senderID}`;
            	    try {
             	   	const info = await Users.getInfo(senderID);
						userName = info.name;
						inputData.userName = userName;
            	    } catch (e) {}
          	  	await handleUserData(inputData);
        	    }
            
         	   resolve(true);

    	    } catch (err) {  	
				reject(err);
     	   }
		});
	}
	/*
    return async function({ event }) {
    	
		const { allThreadID, allUserID } = global.HADESTIA_BOT_DATA;
		// check if automatic DB creation was set
        if (!global.HADESTIA_BOT_CONFIG.autoCreateDB) { return; }
        
        let { senderID, threadID } = event;

        senderID = String(senderID);
		threadID = String(threadID);
		
        try {
			const inputData = {
				threadID,
				userID: senderID,
				databaseSystem,
				economySystem,
				Utils,
				Users,
				Threads,
				Banned
			}
		    
			// ####### IF GROUP CHAT ####### //
			if (event.isGroup && !allThreadID.has(threadID)) {
				await handleGroupData(inputData);
            }
			
            if (!allUserID.has(senderID)) {
            	let userName = `@user${senderID}`;
                try {
                	const info = await Users.getInfo(senderID);
					userName = info.name;
					inputData.userName = userName;
                } catch (e) {}
            	await handleUserData(inputData);
            }
            
            return true;

        } catch (err) {  	
			console.log(err);
			throw err;
        }
    }*/
}

async function handleUserData({ userID, userName, databaseSystem, economySystem, update, Utils, Users, Threads, Banned }) {
	
	const chalk = require('chalk');
	const job = ["FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366", "FFFF66", "FF00FF", "66FF99", "00CCFF", "FF0099", "FF0066", "008E97", "F58220", "38B6FF", "7ED957", "97FFFF", "00BFFF", "76EEC6", "4EEE94", "98F5FF", "AFD788", "00B2BF", "9F79EE", "00FA9A"];

	const random = job[Math.floor(Math.random() * job.length)];
    const random1 = job[Math.floor(Math.random() * job.length)];
    const random2 = job[Math.floor(Math.random() * job.length)];
    
    const credentials = await Users.getData(userID) || {};
    const data = typeof(credentials.data) == 'undefined' ? {} : credentials.data;
    const name_of_user = userName || credentials.name || `@user${userID}`;
    
    let changesCount = 0;
    
    for (const key in databaseSystem.user_data_config) {
    	if (typeof(data[key]) == 'undefined') {
    		data[key] = databaseSystem.user_data_config[key];
		}
    }
	// IF USER WAS BANNED
	const bannedUserData = await Banned.getData(userID);
	if (bannedUserData) {
		const bd = bannedUserData.data || {};
		const banned = {
			name: name_of_user,
			caseID: bd.caseID || -1,
			reason: bd.reason || databaseSystem.user_data_config.banned.reason,
			dateIssued: bd.dateIssued || databaseSystem.user_data_config.banned.dateIssued
		}
		data.banned = banned;
		await Banned.setData(userID, { data: banned });
	}
	// SAVE
	await Users.setData(userID, { name: name_of_user, data });
	
	if (!global.HADESTIA_BOT_DATA.allUserID.has(userID)) {
		global.HADESTIA_BOT_DATA.allUserID.set(userID, true);
	}

    if (!update) {
		Utils.logger(Utils.getText('handleCreateDatabase', 'newUser', chalk.hex("#" + random)(`New users: `) + chalk.hex("#" + random1)(`${name_of_user}`) + " || " + chalk.hex("#" + random2)(`${userID}`)), '[ USER ]');
	} else {
		Utils.logger(`Updated User: ${name_of_user}\n${userID}`, 'database');
	}
	return true;
}

async function handleGroupData({ threadID, databaseSystem, economySystem, update, Utils, Users, Threads, Banned }) {
	
	try {
		const chalk = require('chalk');
		const notFound = ['undefined', 'null'];
		const job = ["FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366", "FFFF66", "FF00FF", "66FF99", "00CCFF", "FF0099", "FF0066", "008E97", "F58220", "38B6FF", "7ED957", "97FFFF", "00BFFF", "76EEC6", "4EEE94", "98F5FF", "AFD788", "00B2BF", "9F79EE", "00FA9A"];

		const random = job[Math.floor(Math.random() * job.length)];
  	  const random1 = job[Math.floor(Math.random() * job.length)];
   	 const random2 = job[Math.floor(Math.random() * job.length)];
  	  // set initial data for thread information on DB
		// get group chat information
		const threadInfo = {}
  	  const threadIn4 = await Threads.getInfo(threadID);
    	threadInfo.threadName = threadIn4.threadName;
		threadInfo.adminIDs = threadIn4.adminIDs;
		threadInfo.nicknames = threadIn4.nicknames;

		const credentials = await Threads.getData(threadID) || {};
   	 let inventory = (typeof(credentials.inventory) == 'undefined') ? {} : credentials.inventory;
  	  let economy = (typeof(credentials.economy) == 'undefined') ? {} : credentials.economy;
   	 let data = (typeof(credentials.data) == 'undefined') ? {} : credentials.data;
		let afk = (typeof(credentials.afk) == 'undefined') ? {} : credentials.afk;
	
		// default config
		for (const item in databaseSystem.group_data_config) {
			if (typeof(data[item]) == 'undefined') {
				data[item] = databaseSystem.group_data_config[item];
			}
		}

		// default configuration for economy system for this group
		for (const item in economySystem.config) {
			if (typeof(data[item]) == 'undefined') {
				data[item] = economySystem.config[item];
			}
		}
				
		// IF THREAD WAS BANNED
		const bannedGroupData = await Banned.getData(threadID);
		if (bannedGroupData || data.isBanned) {
			const bd = bannedGroupData.data || {};
			const banned = {
				name: threadIn4.threadName,
				caseID: bd.caseID || -1,
				reason: bd.reason || databaseSystem.group_data_config.banned.reason,
				dateIssued: bd.dateIssued || databaseSystem.group_data_config.banned.dateIssued
			}
			data.banned = banned;
			await Banned.setData(threadID, { data: banned });
		}
	
		for (singleData of threadIn4.userInfo) {
			// sets each member a initial data for economy & inventory
			const userID = String(singleData.id);
			const userEco = typeof(economy[userID]) == 'undefined' ? {} : economy[userID];
			const userName = singleData.name;
		
			for (const key in economySystem.userConfig) {
				userEco[key] = userEco[key] || economySystem.userConfig[key];
			}
			economy[userID] = userEco;
			inventory[userID] = typeof(inventory[userID]) == 'undefined' ? {} : inventory[userID];
		
     	   if (!global.HADESTIA_BOT_DATA.allUserID.has(userID)) {
				await handleUserData({ userID, userName, databaseSystem, economySystem, update, Utils, Users, Threads, Banned });
			}
		}
		
		// SAVE
		await Threads.setData(threadID, { threadInfo, data, economy, inventory, afk });
		if (!global.HADESTIA_BOT_DATA.allThreadID.has(threadID)) {
			global.HADESTIA_BOT_DATA.allThreadID.set(threadID, true);
		}
	
		if (!update) {
			Utils.logger(Utils.getText('handleCreateDatabase', 'newThread', chalk.hex("#" + random)(`New group: `) + chalk.hex("#" + random1)(`${threadID}`) + "  ||  " + chalk.hex("#" + random2)(`${threadIn4.threadName}`)), '[ THREAD ]');
		} else {
			Utils.logger(`Updated Thread: ${threadIn4.threadName}\n${threadID}`, 'database');
		}
	} catch (err) {
		await Threads.delData(threadID);
	}
}

module.exports.handleUserData = handleUserData;
module.exports.handleGroupData = handleGroupData;