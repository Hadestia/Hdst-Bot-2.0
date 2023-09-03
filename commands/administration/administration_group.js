module.exports.config = {
	name: 'group-set',
	version: '2.0.0',
	hasPermssion: 3,
	commandCategory: 'administration',
	description: 'Sets specific type for a group/thread',
	usages: '< info | prefix | name | admin | bot-updates | auto-response | auto-resend | anti-change | anti-join | anti-out > [ ... ]',
	credits: 'Hadestia',
	cooldowns: 10,
	aliases: [ 'group' ],
	envConfig: {
		requiredArgument: 1,
		needGroupData: true,
		groupCommandOnly: true
	}
}

const validTypes = [
	'bot-updates',
	'auto-response',
	'auto-resend',
	'anti-change',
	'anti-join',
	'anti-out',
	'prefix',
	'admin',
	'name',
	'info',
	'add'
];

module.exports.run = async function ({ api, args, alias, event, returns, Utils, Threads, Prefix }) {
	
	const { threadID, messageID, senderID } = event;
	
	const threadInfo = await api.getThreadInfo(threadID);
	const commandType = args.shift();
	
	if (!commandTypeValid(commandType)) return api.sendMessage(Utils.textFormat('group', 'groupCmdGroupInvalidCommandType', validTypes.join(' | ')), threadID, messageID);
	
	// get group data
	const GROUP_DATA = (await Threads.getData(threadID)).data;	
	//console.log(GROUP_DATA)
	// execute switch statement 
	switch (commandType) {
		// bot prefix
		case 'prefix':
			if (args.length > 0) {
				GROUP_DATA.PREFIX = args[0];
				Utils.setBotNickname(GROUP_DATA.PREFIX, null, threadID);
				api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Bot prefix for this group was set to "${GROUP_DATA.PREFIX}".`), threadID, Utils.autoUnsend, messageID)
			} else {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Prefix cannot be a blank or invalid character.'), threadID, Utils.autoUnsend, messageID);
			}
			break;
		// group name
		case 'name':
			api.setTitle(
				args.join(' '),
				threadID,
				(err) => {
					if (err) {
						Utils.sendReaction.failed(api, event);
						Utils.logModuleErrorToAdmin(err, __filename, threadID, senderID);
						return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err), threadID, messageID);
					}
					Utils.sendReaction.success(api, event);
				}
			);
			break;
		// group admin
		case 'admin':
			setAdminStatus({ Utils, threadInfo, returns, api, args, event });
			break;
			
		// add user to the group
		case 'add':
			handleAddUserToGroup({ Utils, threadInfo, api, args, event, returns, textFormat, Prefix })
			break;
			
		// set nickname
		case 'set-nn':
		
			break;
		
		// group settings (SEE GROUP SETTINGS)
		case 'info':
			const databaseConfig = require(`${Utils.ROOT_PATH}/json/databaseConfig.json`);
			let settings_body = '';
			// group settings
			for (const setting_name in GROUP_DATA) {
				const value_type = typeof(GROUP_DATA[setting_name]);
				if (databaseConfig.all_settings_name[setting_name] && value_type == 'boolean') {
					const data_name = databaseConfig.all_settings_name[setting_name];
					const value = (GROUP_DATA[setting_name]) ? Utils.textFormat('reaction', 'execSuccess') : Utils.textFormat('reaction', 'execFailed');
					settings_body += `[${value}] : ${await Utils.fancyFont.get(data_name, 1)}\n`;
				}
			}
			
			const bannedCommands = (GROUP_DATA.bannedCommands.length > 0) ? ` -•${await GROUP_DATA.bannedCommands.join('\n -• ')}` : await Utils.fancyFont.get('<no banned commands found>', 6);
			
			api.sendMessage(
				Utils.textFormat(
					'group', 'groupViewInfoSettings',
					threadInfo.adminIDs.length,
					threadInfo.participantIDs.length,
					GROUP_DATA.PREFIX || global.HADESTIA_BOT_CONFIG.PREFIX,
					(threadInfo.approvalMode) ? 'On' : 'Off',
					threadInfo.messageCount,
					settings_body,
					bannedCommands
				),
				threadID,
				() => {},
				messageID
			);
			break;
			
		// anti out state
		case 'anti-out':
			GROUP_DATA.antiout = !GROUP_DATA.antiout;
			(GROUP_DATA.antiout) ?
				api.sendMessage(Utils.textFormat('success', 'successfulFormat', 'Anti out mode was turned on.'), threadID, Utils.autoUnsend, messageID) :
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Anti out mode was turned off.'), threadID, Utils.autoUnsend, messageID);
			break;
		case 'anti-join':
			GROUP_DATA.antijoin = !GROUP_DATA.antijoin;
			(GROUP_DATA.antijoin) ?
				api.sendMessage(Utils.textFormat('success', 'successfulFormat', 'Anti join mode was turned on.'), threadID, Utils.autoUnsend, messageID) :
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Anti join mode was turned off.'), threadID, Utils.autoUnsend, messageID);
			break;
			
		case 'auto-response':
			GROUP_DATA.auto_response_listener = !GROUP_DATA.auto_response_listener;
			api.sendMessage(
				Utils.textFormat('cmd', `eventAutoResponse${(GROUP_DATA.auto_response_listener) ? 'On' : 'Off'}`),
				threadID,
				Utils.autoUnsend,
				messageID
			);
			break;
			
		case 'anti-change':
			GROUP_DATA.guard = !GROUP_DATA.guard;
			(GROUP_DATA.guard) ?
				api.sendMessage(Utils.textFormat('success', 'successfulFormat', 'Anti group change mode was turned on.'), threadID, Utils.autoUnsend, messageID) :
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Anti group change mode was turned off.'), threadID, Utils.autoUnsend, messageID);
			break
		
		case 'auto-resend': 
			GROUP_DATA.auto_resend_msg = !GROUP_DATA.auto_resend_msg;
			(GROUP_DATA.auto_resend_msg) ?
				api.sendMessage(Utils.textFormat('success', 'successfulFormat', 'Auto resend unsent messages mode was turned on.'), threadID, Utils.autoUnsend, messageID) :
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Auto resend unsent messages mode was turned off.'), threadID, Utils.autoUnsend, messageID);
			break;
		
		case 'bot-updates':
			GROUP_DATA.receive_update = !GROUP_DATA.receive_update;
			api.sendMessage(
				Utils.textFormat('system', `botUpdate${(GROUP_DATA.receive_update == true) ? 'On' : 'Off'}`),
				threadID, Utils.autoUnsend, messageID
			);
			break;
			
		default:
			break;
			
	}
	const data = GROUP_DATA;
	await Threads.setData(threadID, { data });
}

// =============== CHECKER FUNCTIONS =============== // 

function commandTypeValid(cmd) {
	return validTypes.includes(cmd.toLowerCase())
}

// =============== COMMANDS FUNCTIONS =============== //

async function handleAddUserToGroup({ Utils, threadInfo, api, args, event, returns, Prefix }) {
	
	const { threadID, messageID } = event;
	var { participantIDs, approvalMode, adminIDs } = threadInfo;
	var participantIDs = participantIDs.map(e => parseInt(e));
	
	
	// handle message reply// this is for when anti out was turned off and a user left the group and they want to add him/her back.
	// they don't need to get the id of that person and just proceed replying on his/her last chat and run the commnad.
	if (event.type === 'message_reply') {
		return adduser(event.messageReply.senderID);
	} else {
		if (args.length === 0) {
			// return invalid syntax
			return api.sendMessage(
				Utils.textFormat('group', 'groupCmdAddInvalidSyntax', Prefix),
				threadID, messageID
			);
		}
		
		for (const id of args) {
			adduser(id);
		}
	}
	
	// some detections
	async function adduser(id) {
		// check user id
		if (!id.length === 15) return api.sendMessage(Utils.textFormat('error', 'errInvalidUserID'), threadID, messageID);
		
		const target = await Utils.getUserInfo(id);
		// id = parseInt(id);
		
		if (participantIDs.includes(id)) {
			
			return out(Utils.textFormat('group', 'groupAddUserAlreadyInGroup', target.name || 'user'));
			
		} else {
			
			const admins = adminIDs.map(e => parseInt(e.id));
			
			try {
				
				await api.addUserToGroup(id, threadID);
				
			} catch {
				
				return out(Utils.textFormat('group', 'groupAddUserAddedFailed', target.name || 'user'));
			}
			
			if (approvalMode === true && !admins.includes(botID)) {
				
				return out(Utils.textFormat('group', 'groupAddUserAddToPending', target.name || 'member'));
				
			} else {
				
				return out(Utils.textFormat('group', 'groupAddUserAddedSuccess', target.name || 'member'))
			}
		}
	}
}

async function setAdminStatus({ Utils, threadInfo, returns, api, args, event }) {
	
	const { threadID, messageID, senderID } = event;
	const admins = (threadInfo.adminIDs).map(e => parseInt(e.id));
	//const user_is_admin = admins.includes(event.senderID);
	const bot_is_admin = threadInfo.adminIDs.find(e => e.id == api.getCurrentUserID());
	
	
	let matchedState = (args.join(' ').toLowerCase()).match(/add|remove|promote|demote/g);
	// if no matching state
	if (!matchedState) {
		returns.remove_usercooldown();
		return api.sendMessage(Utils.textFormat('group', 'groupCmdGroupInvalidAdminState'), threadID, messageID);
	}
	
	let state = (['promote', 'add'].includes(matchedState[0])) ? true :
		(['demote', 'remove'].includes(matchedState[0])) ? false : undefined;
	
	// return if command user is not an admin
	/*if (!user_is_admin) {
		api.sendMessage(Utils.textFormat('cmd', 'cmdPermissionNotEnough', 'Group Administrators'), event.threadID, event.messageID);
		return returns.remove_usercooldown();
	}*/
	if (!bot_is_admin) {
		api.sendMessage(Utils.textFormat('group', 'groupBotNeedsAdminPerm', 'Group Administrators'), event.threadID, event.messageID);
		return returns.remove_usercooldown();
	}

	// promote user if message reply
	if (event.type == 'message_reply') {
		//const user_is_admin = threadInfo.adminIDs.find(i => i.id == event.messageReply.senderID);
		api.changeAdminStatus(
			threadID,
			event.messageReply.senderID, state,
			(err) => {
				if (err) {
					Utils.logModuleErrorToAdmin(err, __filename, threadID, senderID);
					return Utils.sendReaction.failed(api, event);
				}
				return Utils.sendReaction.success(api, event); 
			}
		);
		
	} else {

		// promote user(s) if mentioned
		if (Object.keys(event.mentions).length > 0) {
			
			// promote each users that are mention
			for (let i = 0; i < Object.keys(event.mentions).length; i++) {
			
				//const name = Object.values(event.mentions)[i].replace('@', '');
				const id = Object.keys(event.mentions)[i];
				
				api.changeAdminStatus(
					threadID,
					id, state,
					(err) => {
						if (err) {
							Utils.logModuleErrorToAdmin(err, __filename, threadID, senderID);
							return Utils.sendReaction.failed(api, event);
						}
						return Utils.sendReaction.success(api, event); 
					}
				);
				
			}
		} else {
			return api.sendMessage(Utils.textFormat('group', 'groupCmdGroupAdminNoParam'), threadID, messageID);
		}
		
	}
}