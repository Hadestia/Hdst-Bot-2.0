module.exports.config = {
	name: 'pending',
	version: '2.2.3',
	credits: 'Hadestia',
	hasPermssion: 2,
	usages: '< group | user >',
	replyUsages: '< c | cancel > < all | index | [indexes] >\n< a | accept > < all | index | [indexes] >',
	description: 'Manage bot\'s pending messages.',
	commandCategory: 'ownership',
	cooldowns: 0,
	envConfig: {
		requiredArgument: 1,
		inProcessReaction: true
	}
}

module.exports.handleReply = async function({ api, event, returns, handleReply, Utils, Banned, Threads }) {
	
    if (event.senderID !== handleReply.author) {
		return api.sendMessage(Utils.textFormat('error', 'errCommandReplyInteractionFailed'), event.threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, event.messageID);
    }
    
    const { body, threadID, messageID } = event;
    const items = [];
    
    const args = body.split(' ');
    const mode = (args.shift()).toLowerCase();
    
    let seeLog = false;
    // get option if want to return the log
    if (args.indexOf('-log:true') !== -1) {
		//args.splice(args.indexOf('-log:true'), 1);
		seeLog = true;
	}
    // ['1'[, ...n]] or 'all' or null
    let task = (args.join(' ').match(/(\d+)/g) !== null) ? args.join(' ').match(/(\d+)/g) : (args.includes('all')) ? 'all' : null;
    
    if (args.length === 0 || task === null) {
    	Utils.sendReaction.failed(api, event);
		return returns.invalid_reply_syntax();
	}
    // CANCEL ///////
	if (['c', 'cancel'].indexOf(mode) !== -1) {
	    if (typeof(task) === 'object') {
			// loop through selected indexes to cancel
			for (const index of task) {
				const position = parseInt(index);
				if (!isValidPosition(position)) return api.sendMessage(`position out of range: ${position}`, threadID);
				//console.log(position)
				const data = handleReply.pending[position - 1];
				disconnectBot(data, data.isGroup);
				items.push(data.threadName || data.name || '--Unknown');
			}
		} else {
			if (task === 'all') {
				for (const index in handleReply.pending) {
					const data = handleReply.pending[index];
					disconnectBot(data, data.isGroup)
					items.push(data.threadName || data.name || '--Unknown');
				}
			}
		}
		if (items.length != 0) {
			if (seeLog) {
				let msg = '';
				for (const name of items) {
					msg += `${name}\n`;
				}
			
				api.sendMessage(
					Utils.textFormat('system', 'botMessagePendingRefused', (handleReply.isGroup) ? ((items.length > 1) ? 'Groups' : 'Group') : ((items.length > 1) ? 'Users' : 'User'), msg),
					threadID, messageID
				);
			}
			Utils.sendReaction.success(api, event);
			return returns.delete_data();
		}
	// ACCEPT ////////
	} else if (['a', 'accept'].indexOf(mode) !== -1) {
		if (typeof(task) === 'object') {
			// loop through selected indexes to accept
			for (const index of task) {
				const position = parseInt(index);
				if (!isValidPosition(position)) return api.sendMessage(`position out of range: ${position}`, threadID);
				//console.log('positiob ' + position);
				const data = handleReply.pending[position - 1];
				connectBot(data, data.isGroup);
				items.push(data.threadName || data.name || '--Unknown');
			}
		} else {
			if (task === 'all') {
				for (const index in handleReply.pending) {
					const data = handleReply.pending[index];
					connectBot(data, data.isGroup);
					items.push(data.threadName || data.name || '--Unknown');
				}
			}
		}
		if (items.length != 0) {
			if (seeLog) {
				let msg = '';
				for (const name of items) {
					msg += `${name}\n`;
				}
				api.sendMessage(
					Utils.textFormat('system', 'botMessagePendingApproved', (handleReply.isGroup) ? ((items.length > 1) ? 'Groups' : 'Group') : ((items.length > 1) ? 'Users' : 'User'), msg),
					threadID, messageID
				);
			}
			Utils.sendReaction.success(api, event);
			return returns.delete_data();
		}
	} else {
		Utils.sendReaction.failed(api, event);
		return returns.invalid_reply_syntax();
	}
    
    function isValidPosition(pos) {
    	return pos >= 1 && pos <= handleReply.pending.length;
    }
    
    function threadIsBanned(obj, reason, date) {
    	return api.sendMessage(Utils.textFormat('events', 'eventBotJoinedBannedThread', reason, date), obj.threadID, (e)=>{});
    }
    
    async function connectBot(obj) {
    	const bannedData = await Banned.getData(obj.threadID);
    	if (!bannedData) {
    		Utils.initBotJoin(obj.threadID);
    	} else {
    		const reason = bannedData.data.reason;
    		const date = bannedData.data.dateIssued;
    		await threadIsBanned(obj, reason, date);
    		if (obj.isGroup) {
				api.removeUserFromGroup(Utils.BOT_ID, obj.threadID, (e)=>{});
				const data = await Threads.getData(obj.threadID);
				if (data) {
					await Threads.delData(obj.threadID);
				}
    		}
    		return api.deleteThread(obj.threadID, (e)=>{});
    	}
    }
    
    async function disconnectBot(obj) {
    	const bannedData = await Banned.getData(obj.threadID);
		if (bannedData) {
			const reason = bannedData.data.reason;
    		const date = bannedData.data.dateIssued;
    		await threadIsBanned(obj, reason, date);
    		if (obj.isGroup) {
				api.removeUserFromGroup(Utils.BOT_ID, obj.threadID, (e)=>{});
				const data = await Threads.getData(obj.threadID);
				if (data) {
					await Threads.delData(obj.threadID);
				}
			}
		} else {
    		if (obj.isGroup) {
    			api.sendMessage(
					Utils.textFormat('events', 'eventBotDeclinedGroup'),
					obj.threadID,
					(e)=>{
						api.removeUserFromGroup(Utils.BOT_ID, obj.threadID, (e)=>{});
					}
				);
    		}
    	}
    	return api.deleteThread(obj.threadID, (e)=>{});
    }
}

module.exports.run = async function({ api, args, event, returns, Utils }) {
	
	const { threadID, messageID, senderID } = event;
    const commandName = this.config.name;
    const mode = args.shift().toLowerCase();
    const replyTimeout = Date.now() + 60000;   
    
    var msg_item = '', index = 0;
	
	if (!['thread', 'group', 'user'].includes(mode)) return returns.invalid_usage();
	
	
    try {
		var spam = await api.getThreadList(20, null, ['OTHER']) || [];
		var pending = await api.getThreadList(20, null, ['PENDING']) || [];
	} catch (e) {
		api.sendMessage(e, threadID, messageID);
		Utils.logModuleErrorToAdmin(e, __filename, threadID, senderID);
		//return api.sendMessage(getText('cantGetPendingList'), threadID, messageID)
		return Utils.sendReaction.failed(api, event);
	}
	
	if (mode == 'thread' || mode == 'group') {
		try {
			const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

    		for (const single of list) {
    			index += 1;
    			msg_item += `${Utils.textFormat('system', 'botMessagePendingItemFormat', index, single.threadID, single.name)}\n\n`;
			}
	
  		  if (list.length != 0) {
				return api.sendMessage(
					Utils.textFormat('system', 'botMessagePendingListFormat', msg_item, list.length),
					threadID,
					(err, info) => {
						if (err) return console.log(err);
						global.HADESTIA_BOT_CLIENT.handleReply.push({
            				name: commandName,
            				messageID: info.messageID,
            				author: event.senderID,
            				pending: list,
            				isGroup: true,
            				timeout: replyTimeout
						});
						Utils.autoUnsend(err, info, 60);
					},
					messageID
				);
			} else {
				return api.sendMessage(Utils.textFormat('system', 'botMessagePendingNoData'), threadID, messageID);
			}
		} catch (e) {
			Utils.sendReaction.failed(api, event);
			console.log(e);
		}
	} else if (mode === 'user') {
		try {
			const list = [...spam, ...pending].filter(group => !group.isGroup);
			//this is to filter available user (some of user from pending was delete or inavailable, which the main cuz of crash when using getUserInfoV2)
			const available = []; 
			
    		for (const single of list) {
    			await api.getUserInfo(single.threadID).then((result) => {
    				const user = result[single.threadID];
    				index += 1;
    				msg_item += `${Utils.textFormat('system', 'botMessagePendingItemFormat', index, single.threadID, user.name || 'Facebook User')}\n\n`;
    
					available[available.length] = {
						isGroup: single.isGroup,
						threadID: single.threadID,
						name: single.name
					}
				}).catch((err) => {
					//api.deleteThread(single.threadID, (e)=>{});
				});
			}
  		  if (available.length != 0) {
				return api.sendMessage(
					Utils.textFormat('system', 'botMessagePendingListFormat', msg_item, list.length),
					threadID,
					(err, info) => {
						if (err) return console.log(err);
						global.HADESTIA_BOT_CLIENT.handleReply.push({
            				name: commandName,
            				messageID: info.messageID,
            				author: event.senderID,
            				pending: available,
            				isGroup: false,
            				timeout: replyTimeout
						});
						Utils.autoUnsend(err, info, 60);
					},
					messageID
				);
			} else {
				return api.sendMessage(Utils.textFormat('system', 'botMessagePendingNoData'), threadID, messageID);
			}
		} catch (e) {
			Utils.sendReaction.failed(api, event);
			console.log(e);
		}
	}
}