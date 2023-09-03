//////// ECONOMY: GROUP ECONOMY FEATURE BY HADESTIA ///////

const economySystem = require(`${global.HADESTIA_BOT_CLIENT.mainPath}/json/economySystem.json`);

module.exports.config = {
	name: 'economy-settings',
	version: '1.0.1',
	hasPermssion: 3,
	commandCategory: 'administration',
	usages: '[ currency | add-money | remove-money | work-cooldown | set-wage ] < ... >',
	description: 'Manage Economy settings.',
	credits: 'Hadestia',
	cooldowns: 60,
	aliases: [ 'eco' ],
	envConfig: {
		needUserData: true,
		needGroupData: true,
		requiredArgument: 2,
		groupCommandOnly: true
	}
}

/*module.exports.handleEvent = async function ({ event, Threads }) {
	
	try {
		// make a global function for eco initialization (this is to make sure all user on the thread had it)
		// this will be called on every economy run commands
		global.initializeUserEconomy || (global.initializeUserEconomy = async function (senderID, threadID) {
			const threadData = await Threads.getData(threadID);
			const economy = threadData.economy;
			const inventory = threadData.inventory;
		
			economy[senderID] || (economy[senderID] = economySystem.userConfig);
			inventory[senderID] || (inventory[senderID] = {});
		
			for (const prop in economySystem.userConfig) {
				economy[senderID][prop] || (economy[senderID][prop] = economySystem.userConfig[prop]);
			}
		
			await Threads.setData(threadID, { economy, inventory });
		});
		
	} catch {
		global.logger(err, 'error');
		global.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage('HANDLE EVENT: '+ Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
	}
}*/

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix, Threads }) {
	
	const { threadID, messageID, senderID } = event;
	
	// get group data
	const threadData = await Threads.getData(threadID);
	const settings = threadData.data;
	const economy = threadData.economy;
	const inventory = threadData.inventory;
	
	const command = (args.shift()).toLowerCase();
	const currency = settings.default_currency || economySystem.config.default_currency; 
	
	const recheckEconomy = (id) => {
		if (!economy[id]) {
			economy[id] = economySystem.userConfig;
		}
		if (!inventory[id]) {
			inventory[id] = {};
		}
		
		const ecoTotal = economy[id].hand + economy[id].bank;
		return { userEconomyTotal: ecoTotal, userEconomy: economy[id], userInventory: inventory[id] };
	}
	
	const getUserName = async (id, name) => {
		const owner = await Utils.getUserInfo(id) || {};
		const ownerName = await Utils.fancyFont.get((name && (name).split(' ')[0]) || (owner.name) ? (owner.name == 'Facebook User') ? owner.name : (owner.name).split(' ')[0] : 'Facebook User', 1);
		return ownerName;
	}
	
	const userMoneyToMuch = (id, toAdd = 0) => {
		return (economy[id].hand + economy[id].bank + toAdd) > 1000000000;
	}
	
	const userHadThatMoney = (id, account, amount) => {
		return economy[id][account] >= amount;
	}
	
	const formatCurrency = (amount) => {
		return `${currency}${amount.toLocaleString('en-US')}`;
	}
	
	switch (command) {
		////// CURRENCY /////
		case 'currency': 
			if (args.length == 0) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Include a currency you want to set.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			settings.default_currency = args[0];
			api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Group currency has been set to "${args[0]}".`), threadID, messageID);
			break;
			
			
		////// ADD MONEY /////
		case 'add-money':
			if (args.length < 2) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Must include the target user via mention or "me" followed by the amount to set.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			let amount = (args.join(' ')).match(/\d+/g);
			if (!amount) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid input, set an amount to set.'), threadID, Utils.autoUnsend, messageID);
				break;
			} else if (Math.abs(parseInt(amount[0])) <= 0) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid amount, amount cannot be less than or equal to zero.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			amount = Math.abs(parseInt(amount[0]));
			
			if (Object.keys(event.mentions).length > 0) {
				for (let i = 0; i < Object.keys(event.mentions).length; i++) {
					const id = Object.keys(event.mentions)[i];
					await recheckEconomy(id);
				
					if (userMoneyToMuch(id, amount)) {
						api.sendMessage(Utils.textFormat('error', 'errOccured', 'The maximum amount of money for each user was 1 Billion.'), threadID, Utils.autoUnsend, messageID);
						break;
					}
				
					economy[id].bank += amount;
					api.sendMessage(Utils.textFormat('success', 'successfulFormat', `${formatCurrency(amount)} was added to ${await getUserName(id, Object.values(event.mentions)[0].replace('@', ''))}'s bank.`), threadID, Utils.autoUnsend, messageID);
				}
				break;
			} else if ((args[0]).toLowerCase() == 'me') {
				await recheckEconomy(senderID);
				
				if (userMoneyToMuch(senderID, amount)) {
					api.sendMessage(Utils.textFormat('error', 'errOccured', 'The maximum amount of money for each user was 1 Billion.'), threadID, Utils.autoUnsend, messageID);
					break;
				}

				economy[senderID].bank += amount;
				api.sendMessage(Utils.textFormat('success', 'successfulFormat', `${formatCurrency(amount)} was added to your bank.`), threadID, Utils.autoUnsend, messageID);
				break;
				
			} else {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Must include the target user via mention or "me" followed by the amount to set.'), threadID, Utils.autoUnsend, messageID);
				break;
			}

			break;
		
		////// REMOVE MONEY /////
		case 'remove-money':
			if (args.length < 2) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Must include the target user via mention or "me" followed by the amount to remove or "all" to remove all the money he/she had.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			const joinedArgs = (args.join(' ')).toLowerCase();
			let typeAmount = (joinedArgs).match(/\d+|all/g);
			let accountType = (joinedArgs).match(/cash|bank/g);
			
			
			if (!typeAmount) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid input, set an amount to set or "all" to remove all the money.'), threadID, Utils.autoUnsend, messageID);
				break;
			} else if (typeAmount[0] !== 'all' && !accountType) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid account type, include "cash" if you want to remove user\'s money on hand or "bank" for user\'s money in bank.'), threadID, Utils.autoUnsend, messageID);
				break;
			} else if (typeAmount[0] !== 'all' && parseInt(typeAmount[0]) <= 0) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid amount, amount can be "all" or number that was not equal to zero.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			if (typeAmount[0] !== 'all' && !['hand', 'bank', 'cash'].includes(accountType[0])) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid account type, include "cash" if you want to remove user\'s money on hand or "bank" for user\'s money in bank.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			if (Object.keys(event.mentions).length > 0) {
				for (let i = 0; i < Object.keys(event.mentions).length; i++) {
					
					const id = Object.keys(event.mentions)[i];
					const userName = await getUserName(id, Object.values(event.mentions)[i].replace('@', ''));
				
					await recheckEconomy(id);
				
					if (typeAmount[0] == 'all') {
						economy[id].hand = 0;
						economy[id].bank = 0;
						api.sendMessage(Utils.textFormat('success', 'successfulFormat', `${userName}'s money has been reset to ${currency}0.`), threadID, Utils.autoUnsend, messageID);
					} else {
				
						const amount = Math.abs(parseInt(typeAmount[0]));
				
						if (['hand','cash'].includes(accountType[0])) {
							if (!userHadThatMoney(id, 'hand', amount)) {
								api.sendMessage(Utils.textFormat('error', 'errOccured', `Coudn't remove ${formatCurrency(amount)} on ${userName}'s hand. This user currently have ${formatCurrency(economy[id].hand)}.`), threadID, Utils.autoUnsend, messageID);
								break;
							}
							economy[id].hand -= amount;
							api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Removed ${formatCurrency(amount)} on ${userName}'s hand.`), threadID, messageID);
						} else if (accountType[0] == 'bank') {
							if (!userHadThatMoney(id, 'bank', amount)) {
								api.sendMessage(Utils.textFormat('error', 'errOccured', `Coudn't remove ${formatCurrency(amount)} on ${userName}'s bank. This user currently have ${formatCurrency(economy[id].bank)}.`), threadID, Utils.autoUnsend, messageID);
								break;
							}
							economy[id].bank -= amount;
							api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Removed ${formatCurrency(amount)} on ${userName}'s bank.`), threadID, messageID);
						}
					}
				}
				break;
			} else if ((args[0]).toLowerCase() == 'me') {
				await recheckEconomy(senderID);
				
				const userName = await getUserName(senderID, null);
				
				if (typeAmount[0] == 'all') {
					economy[senderID].hand = 0;
					economy[senderID].bank = 0;
					api.sendMessage(Utils.textFormat('success', 'successfulFormat', `${userName}'s money has been reset to ${currency}0.`), threadID, messageID);
					break;
				}
				
				const amount = Math.abs(parseInt(typeAmount[0]));
				
				if (['hand','cash'].includes(accountType[0])) {
					if (!userHadThatMoney(senderID, 'hand', amount)) {
						api.sendMessage(Utils.textFormat('error', 'errOccured', `Coudn't remove ${formatCurrency(amount)} on ${userName}'s hand. This user currently have ${formatCurrency(economy[senderID].hand)}.`), threadID, Utils.autoUnsend, messageID);
						break;
					}
					economy[senderID].hand -= amount;
					api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Removed ${formatCurrency(amount)} on ${userName}'s hand.`), threadID, messageID);
					break;
				} else if (accountType[0] == 'bank') {
					if (!userHadThatMoney(senderID, 'bank', amount)) {
						api.sendMessage(Utils.textFormat('error', 'errOccured', `Coudn't remove ${formatCurrency(amount)} on ${userName}'s bank. This user currently have ${formatCurrency(economy[senderID].bank)}.`), threadID, Utils.autoUnsend, messageID);
						break;
					}
					economy[senderID].bank -= amount;
					api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Removed ${formatCurrency(amount)} on ${userName}'s bank.`), threadID, messageID);
					break;
				}
				break;
			} else {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Must include the target user via mention or "me" followed by the amount to set and account type if needed.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			break;
			
		////// SET WAGE /////
		case 'set-wage':
			if (args.length < 2) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Must include two amount for minimum & maximum wages for work command.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			let wages = (args.join(' ')).match(/\d+/g);
			
			if (!wages) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid input, wages must be a number.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			const min = parseInt(wages[0]);
			const max = parseInt(wages[1]);
			
			if (min <= 0 || max <= 0) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Wages cannot be less than or equal to zero'), threadID, Utils.autoUnsend, messageID);
				break;
			} else if (min > 300000 || max > 300000) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Wages cannot be greater than 300 thousand.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			// if minimum wage was greater than maximum wage or equal
			if (min >= max) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Minimum wage cannot be greater than or equal to maximum wage.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			
			settings.work_min_wage = min;
			settings.work_max_wage = max;
			api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Economy wages has been set from ${currency}${min.toLocaleString('en-US')} to ${currency}${max.toLocaleString('en-US')}`), threadID, Utils.autoUnsend, messageID);
			break;
			
		////// SET WORK COOLDOWN /////
		case 'work-cooldown':
			let seconds = (args.join(' ')).match(/\d+/g);
			if (!seconds) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Invalid input, cooldown must be a seconds.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			const cooldown = parseInt(seconds[0]);
			const cdInText = Utils.getRemainingTime(cooldown);
			
			if (cooldown < 300 || cooldown > 604800) {
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'Cooldown must not be greater than 5 minutes or greater than 7 days.'), threadID, Utils.autoUnsend, messageID);
				break;
			}
			settings.work_cooldown = cooldown * 1000;
			
			api.sendMessage(Utils.textFormat('success', 'successfulFormat', `Work command cooldown was set to: ${cdInText}.`), threadID, Utils.autoUnsend, messageID);
			break;
			
		/////// SETTINGS /////
		case 'settings':
			let msgBody = '';
			for (const settName in settings) {
				if (economySystem.config[settName]) {
					msgBody += `${await Utils.fancyFont.get(settName.replace(/_/g, '-'), 1)}:\n${settings[settName]}\n\n`;
				}
			}
			
			api.sendMessage(Utils.textFormat('economy', 'viewEcoSettings', msgBody), threadID, Utils.autoUnsend, messageID);
			
			break;
			
		////// DEFAULT /////
		default:
			returns.invalid_usage();
			break;
	}
	
	await Threads.setData(threadID, { data: settings, economy: economy });
}