module.exports.config = {
	name: 'coin-flip',
	version: '1.0.4',
	hasPermssion: 0,
	commandCategory: 'gambling',
	credits: 'Hadestia',
	cooldowns: 0,
	description: 'A toss coin game same as "toss" but with the involvement of money. Max bet for this game was 5,000 due to higher chances of winning by 50%.',
	usages: '[heads/tails] <bet>',
	aliases: [ 'cf', 'flip' ],
	envConfig: {
		requiredArgument: 2,
		needGroupData: true
	},
	gamble: {
		min_bet: 100,
		max_bet: 5000
	}
}

module.exports.run = async function ({ api, args, event, Utils, Threads }) {
	
	const { threadID, messageID, senderID } = event;
	const { data, economy } = await Threads.getData(threadID);
	
	const result = (res, msg) => api.sendMessage(Utils.textFormat('gamblingSystem', 'normalResult', res, msg), threadID, messageID);
	
	let place = args[0].toLowerCase();
	let bet = parseInt(args[1]);
	
	const userMoney = economy[senderID].hand

	if (!['heads', 'tails'].includes(place)) { return api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid place of bet. only accept: `heads` or `tails`.'), threadID, messageID); }
	if (!bet) return err('Invalid amount of bet, Bet must be a number ranges 100 - 5000.');
	if (bet < this.config.gamble.min_bet) { return api.sendMessage(Utils.textFormat('gamblingSystem', 'errNotEnoughBet', data.default_currency, this.config.gamble.min_bet), threadID, messageID); }
	if (bet > this.config.gamble.max_bet) { return api.sendMessage(Utils.textFormat('gamblingSystem', 'errExceedBet', data.default_currency, this.config.gamble.max_bet), threadID, messageID); }
	if (userMoney < bet) { return api.sendMessage(Utils.textFormat('gamblingSystem', 'errOnlyHadMoneyHand', data.default_currency, userMoney.toLocaleString('en-US')), threadID, messageID); }
	
	const outcome = Math.floor(Math.random() * 2);
	
	if (outcome == 0 && place == 'heads') {
		economy[senderID].hand += bet;
		result('Heads', `Congratulations You won! +${data.default_currency}${bet.toLocaleString('en-US')}`);
	} else if (outcome == 1 && place == 'tails') {
		economy[senderID].hand += bet;
		result('Tails', `Congratulations You won! +${data.default_currency}${bet.toLocaleString('en-US')}`);
	} else {
		const what = ['Heads', 'Tails'][outcome];
		result(what, `You lose ${data.default_currency}${bet.toLocaleString('en-US')}`);
		economy[senderID].hand -= bet;
	}
	
	await Threads.setData(threadID, { economy });
}