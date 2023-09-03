module.exports.config = {
	name: 'avatar',
	version: '1.0.0',
	hasPermssion: 0,
	cooldowns: 20,
	commandCategory: 'edited_images',
	description: 'Generate anime avatar by giving information needed.',
	usages: '< avatar ID(1-800)> | <color name> | <name> | <signature>\nsample: "$avatar 1 | pink | hadestia | hdst"',
	envConfig: {
		requiredArgument: 6,
		inProcessReaction: true
	},
	dependencies: {
		'axios': '',
		'fs-extra': ''
	},
	credits: 'Joshua Sy for API'
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix }) {
	
	const { threadID, messageID, senderID } = event;
	const axios = require('axios');
	const fs = require('fs-extra');
	
	const division = (args.join(' ')).split(/\|/g);
	for (const i in division) { division[i] = division[i].trim(); }
	
	let id = parseInt(division[0]);
	const in_synText = Utils.textFormat('error', 'errOccured', 'Avatar ID must be a number ranges 1 - 800');

	if (!id) {
		Utils.sendReaction.failed(api, event);
		api.sendMessage(in_synText, threadID, messageID);
		return returns.remove_usercooldown();
	} else if (id < 1 || id > 800) {
		Utils.sendReaction.failed(api, event);
		api.sendMessage(in_synText, threadID, messageID);
		return returns.remove_usercooldown();
	}
	
	const link = encodeURI(`https://sim.ainz-project.repl.co/canvas/avtwibu?id=${id - 1}&color=${division[1]}&name=${division[2]}&subname=${division[3]}`);
	const path = `${Utils.ROOT_PATH}/cache/${(link.split('/')).pop()}.png`;
	const avatar = (await axios.get(link, { responseType: 'arraybuffer' })).data;
	
	fs.writeFileSync(path, Buffer.from(avatar, 'utf-8'));
	return api.sendMessage(
		{
			body: '',
			attachment: fs.createReadStream(path)
		},
		threadID,
		async (e, i) => {
			if (fs.existsSync(path)) {
				fs.unlinkSync(path);
			}
			if (e) {
				Utils.sendReaction.failed(api, event);
				Utils.logModuleErrorToAdmin(e, __filename, event);
				return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', e), threadID, messageID);
			}
			Utils.sendReaction.success(api, event);
		},
		messageID
	);
			
}