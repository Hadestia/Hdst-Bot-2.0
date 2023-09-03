	module.exports.config = {
	name: 'baybayin',
	version: '1.0.0',
	hasPermssion: 0,
	credits: 'Joshua Sy',
	description: 'A Filipino ancient writing system, it translates text to Baybayin writings.',
	usages: '<text>',
	commandCategory: 'education',
	cooldowns: 5,
	envConfig: {
		requiredArgument: 1
	}
}

module.exports.run = async ({ api, event, args, Utils }) => {
	
	const axios = require('axios');
	let text = args.join(' ');
	
	await axios.get(`https://api-baybayin-transliterator.vercel.app/?text=${text}`).then((res) => {
		var a = res.data.baybay;
		api.sendMessage(`${a}`, event.threadID, event.messageID);
		return Utils.sendReaction.success(api, event);
	}).catch((err) => {
		api.sendMessage(Utils.textFormat('error', 'errProcessUnable'), event.threadID, event.messageID);
		return Utils.sendReaction.failed(api, event);
	});
}