const categories = [ 'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe' ];
const nsfw = [ 'waifu', 'neko' ];

module.exports.config = {
	name: 'anime',
	version: '1.0.0',
	hasPermssion: 0,
	description: `Gives a random anime depending on a given category. Available categories are:\n(${categories.join(', ')}).\nUse "-nsfw" tag after the category name for NSFW results, However the only available categories for this are:\n(${nsfw.join(', ')})`,
	commandCategory: 'media',
	usages: '<category> [ -nsfw ]',
	cooldowns: 5,
	credits: '© rest API owner',
	dependencies: {
		'axios': '',
		'fs-extra': ''
	},
	envConfig: {
		requiredArgument: 1
	}
}

module.exports.run = async function ({ api, args, event, body, returns, Utils, Prefix, Threads }) {
	
	const { threadID, messageID, senderID } = event;
	const request = args[0].toLowerCase();
	const tag = (body.toLowerCase().indexOf('-nsfw') !== -1) ? 'nsfw' : 'sfw';
	
	const axios = require('axios');
	const fs = require('fs-extra');
	
	if (tag == 'sfw') {
		if (!categories.includes(request)) {
			api.sendMessage(
				Utils.textFormat('error', 'errOccured', `Invalid category, use \`${Prefix}help ${this.config.name}\` to view available categories.`),
				threadID, messageID
			);
			return returns.remove_usercooldown();
		}
	} else {
		const is_bot_admin = await Utils.hasPermission(senderID, threadID, 2);
		if (event.isGroup) {
			const { data } = await Threads.getData(threadID) || { data: {} };
			if (!data.allowNSFW && !is_bot_admin) {
				api.sendMessage(
					Utils.textFormat('error', 'errOccured', 'You group doesn\'t allow NSFW contents.'),
					threadID, messageID
				);
				return returns.remove_usercooldown();
			}
		}
		
		if (!nsfw.includes(request)) {
			api.sendMessage(
				Utils.textFormat('error', 'errOccured', `Invalid category, use \`${Prefix}help ${this.config.name}\` to view available categories.`),
				threadID, messageID
			);
			return returns.remove_usercooldown();
		}
	}
	
	await axios.get(`https://api.waifu.pics/${tag}/${request}`).then(async (res) => {
		const link = res.data.url;
		const path = `${Utils.ROOT_PATH}/cache/animeReq-${senderID}@${(link.split('/')).pop()}`;
		await Utils.downloadFile(link, path).then(() => {
			api.sendMessage(
				{
					body: `Here's your request: ${link}`,
					attachment: fs.createReadStream(path)
				},
				threadID,
				() => fs.unlinkSync(path),
				messageID
			);
		}).catch((err) => {
			api.sendMessage(Utils.textFormat('error', 'errProcessUnable'), threadID, messageID);
			return returns.remove_usercooldown();
		})
	}).catch((err) => {
		console.log(err);
		returns.remove_usercooldown();
    	Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	});
}