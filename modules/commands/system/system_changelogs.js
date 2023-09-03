module.exports.config = {
	name: 'changelog',
	version: '2.0.1',
	usages: '[ set ]',
	description: 'Enable or Disable receiving patch notes, Or view patch notes.',
	commandCategory: 'system',
	credits: 'Hadestia',
	hasPermssion: 0,
	cooldowns: 30,
	envConfig: {
		needGroupData: true
	}
}

module.exports.lateInit = async function ({ api, Threads, Utils }) {
	
	const { readFileSync, writeFileSync } = require('fs-extra');
    const isUpdated = readFileSync(`${Utils.ROOT_PATH}/cache/keep/!asset-has-update.txt`, { encoding: 'utf-8' });
	const assets = require(`${Utils.ROOT_PATH}/json/!asset-update.json`);
	const { ADMINBOT, PREFIX } = global.HADESTIA_BOT_CONFIG;
	
	global.BOT_VERSION = assets.VERSION;
	// Notify each group about the patch notes
	if (isUpdated == 'true') {
    	try {
    	
    		const allThreads = await Threads.getAll(['threadID', 'data']);
			for (const thread of allThreads) {
				
				const data = thread.data;
				const threadID = String(thread.threadID);
				const threadPrefix = data.PREFIX || PREFIX;
				
				if (data.receive_update) {
					api.sendMessage(
						`Bot has been updated to version: ${assets.VERSION}\nrun "${threadPrefix}changelog" to see full details.\n\nYou can also use "${threadPrefix}group bot-updates" to turn on/off this notification.`,
						threadID,
						async (err) => {
							// if this fails that means its an old thread data
							// that probably bot was not a member anymore
							if (err) {
								await Threads.delData(threadID);
							}
						}
					);
				}
			}
			// notify admins too
			for (const admin of ADMINBOT) {
				api.sendMessage(Utils.textFormat('system', 'botUpdateFormat', assets.VERSION, assets.CHANGELOGS), admin);
			}
			
		} catch (e) {
        	//logger (e);
			console.log(`BOT update notif: ${e}`, 'warn');
		}
	}
	
	await writeFileSync(`${Utils.ROOT_PATH}/cache/keep/!asset-has-update.txt`, 'false', 'utf-8');
}

module.exports.run = async function ({ api, args, event, returns, Utils, Threads }) {
	
	const { threadID, messageID } = event;

	if (args.length > 0) {
		
		if (!args[0] == 'set') {
			return returns.invalid_usage();
		}
		
		// if has argument and not GC
		if (!event.isGroup) {
			return api.sendMessage(Utils.textFormat('system', 'botUpdateSettingOnlyGC'), threadID, ()=>{}, messageID);
		}
		
		try {
			const { data } = await Threads.getData(threadID);
			data.receive_update = !data.receive_update;
		
			await Threads.setData(threadID, { data });

			return api.sendMessage(
				Utils.textFormat('system', `botUpdate${(data.recieve_update == true) ? 'On' : 'Off'}`),
				threadID, Utils.autoUnsend, messageID
			);
		} catch (e) {
			return Utils.sendReaction.failed(api, event);
		}
	}
	
	// const { threadID, messageID } = event;
	const asset = await require('../../json/!asset-update.json');
	
	return api.sendMessage(
		Utils.textFormat('system', 'botUpdateFormat', asset.VERSION, asset.CHANGELOGS),
		threadID,
		(err) => {
			if (err) return Utils.sendReaction.failed(api, event);
			return Utils.sendReaction.success(api, event);
		},
		messageID
	)
}