module.exports.config = {
    name: 'slot-machine',
    version: '1.0.0',
    hasPermssion: 0,
    credits: 'Mirai Team, beautify by Hadestia',
    description: 'A hard gambling game to earn more money?',
    commandCategory: 'gambling',
    usages: '< bet/all >',
    aliases: [ 'slot' ],
    cooldowns: 5,
    envConfig: {
    	requiredArgument: 1,
		needGroupData: true,
		groupCommandOnly: true
	},
	gamble: {
		min_bet: 20
	}
};

/*module.exports.languages = {
    "vi": {
        "missingInput": "[ SLOT ] Số tiền đặt cược không được để trống hoặc là số âm",
        "moneyBetNotEnough": "[ SLOT ] Số tiền bạn đặt lớn hơn hoặc bằng số dư của bạn!",
        "limitBet": "[ SLOT ] Số coin đặt không được dưới 50$!",
        "returnWin": "🎰 %1 | %2 | %3 🎰\nBạn đã thắng với %4$",
        "returnLose": "🎰 %1 | %2 | %3 🎰\nBạn đã thua và mất %4$"
    },
    "en": {
        "missingInput": "[ SLOT ] The bet money must not be blank or a negative number",
        "moneyBetNotEnough": "[ SLOT ] The money you betted is bigger than your balance!",
        "limitBet": "[ SLOT ] Your bet is too low, the minimum is 50$",
        "returnWin": "🎰 %1 | %2 | %3 🎰\nYou won with %4$",
        "returnLose": "🎰 %1 | %2 | %3 🎰\nYou lost and loss %4$"
    }
}*/

module.exports.run = async function({ api, event, args, returns, Utils, Prefix, Threads }) {
	
    const { threadID, messageID, senderID } = event;
    const Gambling = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/textFormat.json`).gamblingSystem;
    const economySystem = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/economySystem.json`);
    
    const message = (msg) => { api.sendMessage(msg, threadID, messageID) };
    
    // Get user economy
    try {
    	
    	const slotItems = Gambling.slotItems;
    	const threadData = await Threads.getData(threadID);
		const economy = threadData.economy;
		const data = threadData.data;
		
		const moneyOnHand = economy[senderID].hand;
		const currency = threadData.data.default_currency || economySystem.config.default_currency;
		
		const minimumBet = this.config.gamble.min_bet;
		
		let bet = args[0].toLowerCase();
		let betAmount = (bet == 'all') ? moneyOnHand : Math.abs(parseInt(bet));
		
		// money not enough
		if (!betAmount) {
    		returns.remove_usercooldown();
    		return message(Utils.textFormat('error', 'errOccured', 'Invalid amount of bet. Put an amount or put `all` to spend all your money on hand.'));
   	 } else if (betAmount < minimumBet) {
    		returns.remove_usercooldown();
	    	return message(Utils.textFormat('gamblingSystem', 'errNotEnoughBet', currency, minimumBet));
  	  } else if (moneyOnHand < betAmount || (bet == 'all' && moneyOnHand <= minimumBet)) {
			returns.remove_usercooldown();
			return message(Utils.textFormat('gamblingSystem', 'errOnlyHadMoneyHand', currency, moneyOnHand));
		}
		
		var number = [], win = false;
		
		for (i = 0; i < 3; i++) {
			number[i] = Math.floor(Math.random() * slotItems.length);
		}
		
 	   if (number[0] == number[1] && number[1] == number[2]) {
      	  betAmount *= 9;
        	win = true;
  	  } else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
        	betAmount *= 2;
       	 win = true;
   	 }
   
   	 switch (win) {
        	case true: {
        		economy[senderID].hand += betAmount;
        		message(Utils.textFormat('gamblingSystem', 'slotResult', slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], `Congratulations, You won ${currency}${betAmount}.`));
           	 break;
       	 }
     	   case false: {
          	  economy[senderID].hand -= betAmount;
				message(Utils.textFormat('gamblingSystem', 'slotResult', slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], `Sorry, You loss ${currency}${betAmount}. Better luck next time.`));
            	break;
        	}
    	}
    	await Threads.setData(threadID, { economy });
    	return;
    } catch (err) {
    	returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		console.log(err, 'error');
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return message(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix));
    }
}
