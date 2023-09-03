module.exports.config = {
	name: 'roll',
	version: '1.0.0',
	hasPermssion: 0,
	commandCategory: 'random',
	credits: 'Hadestia',
	cooldowns: 0,
	description: 'A simple rolling dice game, will return a random number from 1 - 6 or a random number up to the given range.',
	usages: '[ range(number) ]'
}

module.exports.run = function ({ api, args, event, Utils }) {
	
	const range = parseInt(args[0] || '6');
	
	if (range < 6) {
		api.sendMessage(Utils.textFormat('error', 'errOccured', 'You may want to make it higher :|'), event.threadID, event.messageID);
		return Utils.sendReaction.failed(api, event);
	} else if (range > 1000000) {
		api.sendMessage(Utils.textFormat('error', 'errOccured', 'That\'s a huge number. What you want to do with it?'), event.threadID, event.messageID);
		return Utils.sendReaction.failed(api, event);
	}
	
	let pick = Math.floor(Math.random() * range);
	pick = (pick == 0) ? pick + 1 : pick;
	return api.sendMessage(`${pick}`, event.threadID, event.messageID);
}