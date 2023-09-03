module.exports = function({ api, models, Utils, Users, Threads, Banned }) {

    const stringSimilarity = require('string-similarity');
	const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const moment = require('moment-timezone');

    return async ({ event }) => {
    	
    	const time = moment.tz('Asia/Manila').format('HH:MM:ss DD/MM/YYYY');
		const { allowInbox, adminOnly, isMaintenance, allowCommandSimilarity, PREFIX, ADMINBOT, DeveloperMode } = global.HADESTIA_BOT_CONFIG;
		const { commands, cooldowns, commandAliases, commandEnvConfig } = global.HADESTIA_BOT_CLIENT;
		const { allThreadID } = global.HADESTIA_BOT_DATA;
        
        let { body, mentions, senderID, threadID, messageID } = event;
        senderID = String(senderID);
		threadID = String(threadID);
        
        const bannedUserData = await Banned.getData(senderID);
        const bannedGroupData = await Banned.getData(threadID);
        const groupData = await Threads.getData(threadID);
        const userData = await Users.getData(senderID);
        // Intial values For Group & User Data (to avoid undefined type)
		let threadSetting = {},
			threadInfo = {};
			
		let groupBannedCommands = [],
			userBannedCommands = [];

		if (groupData) {
			groupBannedCommands = groupData.data.bannedCommands;
			threadSetting = groupData.data;
			threadInfo = groupData.threadInfo;
		}
		
		if (userData) {
			userBannedCommands = userData.data.bannedCommands;
		}
		
		// ## HANDLE BOT PREFIX ## //
		const botMent = (mentions && Object.keys(mentions).length > 0 && Object.keys(mentions)[0] == Utils.BOT_ID) ? (Object.values(mentions)[0]).replace('@', '') : Utils.BOT_ID;
		let PREFIX_FINAL = (threadSetting.hasOwnProperty('PREFIX')) ? threadSetting.PREFIX : PREFIX;
        const prefixRegex = new RegExp(`^(<@!?${senderID}>|\@${botMent}|${escapeRegex(PREFIX_FINAL)})\\s*`);
        
		if (!prefixRegex.test(body)) return;
		
        if (bannedUserData || bannedGroupData || !allowInbox && senderID == threadID) {
            if (!ADMINBOT.includes(senderID.toString())) {
				// User is banned?
                if (bannedUserData) {             	
                    const { caseID, reason, dateIssued } = bannedUserData.data;
                    if (reason.toLowerCase().indexOf('other bot') !== -1) return;
                    
                    return api.sendMessage(Utils.textFormat('events', 'eventUserBannedForBot', caseID, reason, dateIssued), threadID, async (err, info) => {
						if (err) return;
                        await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                        return api.unsendMessage(info.messageID);
                    }, messageID);
                } else {
					// Group is banned?
                    if (bannedGroupData) {
                        const { caseID, reason, dateIssued } = bannedGroupData.data || {};
                        return api.sendMessage(
							Utils.textFormat('events', 'eventThreadBannedForBot', caseID, reason, dateIssued),
							threadID,
							async (err, info) => {
								if (err) return;
                            	await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                            	return api.unsendMessage(info.messageID);
                        	},
							messageID
						);
                    }
                }
            }
        }
        //commandName
        const [matchedPrefix] = body.match(prefixRegex);
        const userWholeInput = body.slice(matchedPrefix.length).trim();
		const args = userWholeInput.split(/\s+/);
		
		//delete the mention about this bot if user used mentioning this bot as prefix
		if (Object.keys(mentions).length >= 1 && Object.keys(mentions)[0] === Utils.BOT_ID) {
			delete event.mentions[Utils.BOT_ID];
		}
		
		// send under maintenance response
    	if (isMaintenance && !ADMINBOT.includes(senderID)) {
    		return api.sendMessage(Utils.textFormat('system', 'botUnderMaintenance'), threadID, messageID);
		}
		
		if (args[0] == '' && !args[1]) {
			// response that's my prefix
			return api.sendMessage(Utils.textFormat('system', 'botPoked', PREFIX_FINAL, PREFIX_FINAL), threadID, messageID);
		}
        // accept command with spacing
        commandName = (args.length > 1 && args[0] === '') ? args[1] : args.shift().toLowerCase();
		
        let command = (commandAliases.has(commandName)) ? commands.get(commandAliases.get(commandName)) : commands.get(commandName);
        // Absolute User Input
		const absolute_userInput = userWholeInput.slice(commandName.length).trim();

        if (!command && allowCommandSimilarity) {
			var allCommandName = [];
			const commandValues = commands['keys']();
    	    for (const cmd of commandValues) {
				allCommandName.push(cmd);
			}
    	    const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
    	    if (checker.bestMatch.rating >= 0.9) {
				command = commands.get(checker.bestMatch.target);
			}
        }
        
        // If no command Found
		if (!command) return api.sendMessage(Utils.textFormat('cmd', 'cmdNotFound', PREFIX_FINAL), threadID, Utils.autoUnsend, messageID);
        
        // Commands Env Config;
        const cmdEnvConfig = commandEnvConfig[command.config.name] || command.config.envConfig || {};
        
        // if command needs Data fetching and it's not yet initialize
        if ((event.isGroup && cmdEnvConfig.needGroupData && !groupData) || (cmdEnvConfig.needUserData && !userData)) {
        	return api.sendMessage(Utils.textFormat('error', 'errOccured', 'Group/User data was initializing, Pls try again later. :)'), threadID, Utils.autoUnsend, messageID);
        }
        
        // Handle commands available only for Groups
		if (!event.isGroup && cmdEnvConfig.groupCommandOnly) {
			Utils.sendReaction.failed(api, event);
			return api.sendMessage(
				Utils.textFormat('system', 'commandAvailableOnGCOnly'),
				threadID, Utils.autoUnsend, messageID
			);
		}
        
        // check user has banned commands
        if (groupBannedCommands.length > 0 || userBannedCommands.length > 0) {
            if (!ADMINBOT.includes(senderID)) {
                if (groupBannedCommands.includes(command.config.name)) {
                    return api.sendMessage(Utils.textFormat('events', 'eventThreadBannedForCommand', command.config.name), threadID, Utils.autoUnsend, messageID);
				}
                if (userBannedCommands.includes(command.config.name)) {
                    return api.sendMessage(Utils.textFormat('events', 'eventUserBannedForCommand', command.config.name), threadID, Utils.autoUnsend, messageID);
				}
            }
        }

		// Handle NSFW commands
        if (command.config.commandCategory.toLowerCase() == 'nsfw' && !threadSetting.allowNSFW && !ADMINBOT.includes(senderID)) {
            return api.sendMessage(Utils.getText('handleCommand', 'threadNotAllowNSFW'), threadID, Utils.autoUnsend, messageID);
		}

		var eligible = false;
		var cmdPerm = command.config.hasPermssion;
		var requiredArgs = (command.config.envConfig) ? command.config.envConfig.requiredArgument || 0 : 0;
		
		let is_admin_group;
		let is_admin_bot = ADMINBOT.includes(String(senderID));
		let is_bot_owner = ADMINBOT[0] == String(senderID);
		try {
			is_admin_group = (event.isGroup) ? threadInfo.adminIDs.find(el => el.id == senderID) : false;
		} catch (err) {
			console.log(err);
			Utils.sendReaction.failed(api, event);
			Utils.logModuleErrorToAdmin(err, __filename, event);
			return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, PREFIX_FINAL), threadID, Utils.autoUnsend, messageID);
		}
		
		// command Under maintenance?
		if (cmdEnvConfig.disabled && !is_admin_bot) {
			return api.sendMessage(Utils.textFormat('cmd', 'cmdWasDisabled'), threadID, messageID);
		}
		
		if (cmdPerm == 1) {
			eligible = (is_admin_group) ? true : false;
		} else if (cmdPerm == 2) {
			eligible = (is_admin_bot) ? true : false;
		} else if (cmdPerm == 3) {
			eligible = (is_admin_bot || is_admin_group) ? true : false;
		} else if (cmdPerm == 0) {
			eligible = true;
		} else if (cmdPerm == -1) {
			eligible = is_bot_owner && true;
		}
		
		if (args.length < requiredArgs) {
			return api.sendMessage(Utils.textFormat('cmd', 'cmdWrongUsage', `${PREFIX_FINAL}${command.config.name} ${command.config.usages}`), threadID, Utils.autoUnsend, messageID);
			// setTimeout(() => { api.unsendMessage(info.messageID) }, 10 * 1000);
		}
		
		const permCallback = (err) => {
			console.log(err);
			Utils.sendReaction.failed(api, event);
			Utils.logModuleErrorToAdmin(err, __filename, event);
			return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, PREFIX_FINAL), threadID, Utils.autoUnsend, messageID);
		}
		
        if (!eligible) {
        	const permTxt = Utils.textFormat('system', 'perm' + cmdPerm)
			return api.sendMessage(
				Utils.textFormat('cmd', 'cmdPermissionNotEnough', permTxt),
				threadID, Utils.autoUnsend, messageID
			);
		}
		
		if (cmdEnvConfig.inProcessReaction) {
			Utils.sendReaction.inprocess(api, event);
		}

        if (!HADESTIA_BOT_CLIENT.cooldowns.has(command.config.name)) {
			HADESTIA_BOT_CLIENT.cooldowns.set(command.config.name, new Map());
		}

        const timestamps = HADESTIA_BOT_CLIENT.cooldowns.get(command.config.name);
        const expirationTime = (command.config.cooldowns || 1) * 1000;
        const userCooldown = (timestamps.get(senderID) || 0) + expirationTime;

		const userInCooldown = (timer, currentDate) => {
			const timeA = new Date(timer);
			const timeB = new Date(currentDate);
			
			const remaining = Utils.getRemainingTime(Math.abs(timeA - timeB)/1000);
			Utils.sendReaction.cooldown(api, event);
			api.sendMessage(
				Utils.textFormat('cmd', 'cmdUserCooldown', remaining),
				threadID, Utils.autoUnsend, messageID
			);
		}
		
		// User in cooldown?
        if (!is_admin_bot && Date.now() < userCooldown) {
        	const timeA = new Date(userCooldown);
			const timeB = new Date(Date.now());
			const remaining = Utils.getRemainingTime(Math.abs(timeA - timeB)/1000);
			if (remaining !== '') {
				Utils.sendReaction.cooldown(api, event);
				return api.sendMessage(
					Utils.textFormat('cmd', 'cmdUserCooldown', remaining),
					threadID, Utils.autoUnsend, messageID
				);
			}
		}
		
        const logMessageError = (err) => {
        	if (err) return console.error(`${command.config.name}: ${err}`);
        }

        try {
        	
        	if (DeveloperMode) {
				const now = Date.now();
				const time2 = moment.tz('Asia/Manila').format('HH:MM:ss MM/DD/YYYY');
                Utils.logger(Utils.getText('handleCommand', 'executeCommand', time2, commandName, senderID, threadID, args.join(' '), (now - Date.now())), '[ DEV MODE ]');
			}
			
			const returns = {};
			returns.user_in_cooldown = userInCooldown;
			returns.remove_usercooldown = function () {
				try { timestamps.delete(senderID); } catch {}
			}
			
			returns.invalid_usage = function () {
				returns.remove_usercooldown();
				Utils.sendReaction.failed(api, event);
				api.sendMessage(
					Utils.textFormat('cmd', 'cmdWrongUsage', `\n${PREFIX_FINAL}${command.config.name} ${command.config.usages}\nAlternatively you can use "${PREFIX_FINAL}help ${command.config.name}" for more information.`),
					threadID, Utils.autoUnsend, messageID
				);
			}
			
			returns.inaccessible_outside_gc = function () {
				Utils.sendReaction.failed(api, event);
				api.sendMessage(
					Utils.textFormat('system', 'commandAvailableOnGCOnly'),
					event.threadID,
					global.autoUnsend,
					event.messageID
				);
				//return END_TYPING && END_TYPING();
			}

            const Obj = {};

            Obj.api = api;
            
            Obj.args = args;

            Obj.event = event;

            Obj.models = models;
            
            Obj.body = absolute_userInput;
            
            Obj.Utils = Utils;

            Obj.Users = Users;
            
            Obj.Banned = Banned;

            Obj.Threads = Threads;
            
            Obj.returns = returns;
            
            Obj.Prefix = PREFIX_FINAL;

            Obj.textFormat = Utils.textFormat;
            
            Obj.logMessageError = logMessageError;
			
			Obj.getText = Utils.getModuleText(command, event);
			
			Obj.alias = commandName; // to determine what alias user used to run this command

			if (!is_admin_bot) timestamps.set(senderID, Date.now());
			
            return command.run(Obj);
            
        } catch (e) {
			Utils.sendReaction.failed(api, event);
            return api.sendMessage(Utils.getText('handleCommand', 'commandError', commandName, e), threadID);
        }
    }
}