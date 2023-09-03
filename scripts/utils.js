module.exports = async function ({ api, Users, Banned, Threads }) {
	
	const fs = require('fs-extra');
	const util = require('../utils');
	
	const sendReaction = require('../utils/sendReaction.js'),
		textFormat = require('../utils/textFormat.js'),
		fancyFont = require('../utils/localFont.js'),
		editGif = require('../utils/editGif.js'),
		logger = require('../utils/log.js');
	
	const databaseSystem = require('../json/databaseConfig.json'),
		economySystem = require('../json/economySystem.json');
	
	const isUpdated = fs.readFileSync(`${global.HADESTIA_BOT_CLIENT.mainPath}/cache/keep/!asset-has-update.txt`, { encoding: 'utf-8' });

	const Utils = {};
	/// CONSTANTS...
	Utils.BOT_ID = api.getCurrentUserID();
	Utils.BOT_NAME = global.HADESTIA_BOT_CONFIG.BOTNAME;
	Utils.ROOT_PATH = global.HADESTIA_BOT_CLIENT.mainPath;
	Utils.BOT_FULLNAME = await Users.getNameUser(Utils.BOT_ID);
	Utils.BOT_IS_UPDATED = isUpdated == 'true';
	
	// FUNCTIONS...
	for (const func in util) Utils[func] = util[func];
	
	Utils.databaseSystem = databaseSystem;
	Utils.economySystem = economySystem;
	Utils.sendReaction = sendReaction;
	Utils.textFormat = textFormat;
	Utils.fancyFont = fancyFont;
	Utils.editGif = editGif;
	Utils.logger = logger;
	
	// Alternative getUserInfo function
	Utils.getUserInfo = Users.getInfo;
	
	// just prevent crash when message was not sent and doesn't have callback function
	Utils.safeMessage = function (content, threadID, messageID, callback) {
		api.sendMessage(
			content,
			threadID,
			callback || function (e, i) {},
			messageID || null
		);
	}
	
	Utils.setBotNickname = async function (prefix, custom, threadID) {
		api.changeNickname(
			Utils.textFormat('system', 'botNicknameSetup', (prefix || global.HADESTIA_BOT_CONFIG.PREFIX), await Utils.fancyFont.get((custom || `${(Utils.BOT_FULLNAME.split(' '))[0]} Bot`), 1)),
			threadID,
			Utils.BOT_ID
		);
	}
	
	Utils.initBotJoin = async function (threadID, welcome_msg = true) {
		Utils.setBotNickname(null, null, threadID);
		if (welcome_msg) {
			const messageBody = `${Utils.textFormat('events', 'eventBotJoinedConnected', global.HADESTIA_BOT_CONFIG.BOTNAME, global.HADESTIA_BOT_CONFIG.PREFIX)}\n\n${Utils.textFormat('cmd', 'cmdHelpUsageSyntax', global.HADESTIA_BOT_CONFIG.PREFIX, Utils.BOT_FULLNAME)}`;
			// send a startup mesaage
			return api.sendMessage(
				messageBody,
				threadID,
				() => {}
			);
		}
	}
	
	Utils.sendRequestError = async function (err, event, prefix) {
		api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err.message, prefix), event.threadID, ()=>{}, event.messageID);
	}
	
	Utils.hasPermission = async function (senderID, threadID, permission, preferInfo, callback) {
		
		const isGroup = senderID !== threadID;
		let eligible = false;
		
		try {
			preferInfo = preferInfo || await Threads.getInfo(threadID);
			const { ADMINBOT } = global.HADESTIA_BOT_CONFIG;
			const threadInfo = (isGroup) ? (preferInfo) ? preferInfo : false : false;
			const is_admin_group = (isGroup) ? (threadInfo) ? threadInfo.adminIDs.find(el => el.id == senderID) : false : false;
			const is_admin_bot = ADMINBOT.includes(senderID);

			if (permission == 1) {
				// only group admin
				eligible = is_admin_group;
			} else if (permission == 2) {
				// only bot admin
				eligible = is_admin_bot;
			} else if (permission == 3) {
				// group & bot admin
				eligible = is_admin_bot || is_admin_group;
			} else if (permission == 0) {
				// any one
				eligible = true;
			} else if (permission == -1) { 
				// owner only
				eligible = ADMINBOT[0] == senderID;
			}
		} catch (err) {
			(callback) ? callback(err) : console.log(err);
			return false;
		}
		return eligible;
	}
	
	Utils.logModuleErrorToAdmin = async function (err, filename, event) {
		console.error(filename, err);
		let name = '<DIRECT MESSAGE>';
		if (event.isGroup) {
			const data = await Threads.getData(event.threadID);
			name = (data) ? data.threadInfo.threadName : 'Uninitialize Group';
		}
		for (const admin of global.HADESTIA_BOT_CONFIG.ADMINBOT) {
			api.sendMessage(Utils.textFormat('events', 'eventModulesErrorToAdmin', filename, err, name || 'No Data', event.threadID, event.senderID), admin);
		}
	}
	
	Utils.autoUnsend = async function (err, info, delay = 120) {
		if (err) return console.log('AUTO UNSEND MESSAGE:', err);
		await new Promise(resolve => setTimeout(resolve, delay * 1000));
		return api.unsendMessage(info.messageID);
	}
	
	Utils.getModuleText = function (module = {}, event) {
    	if (!module.language) return function () {};
       
        return function (...values) {
        	if (!module.language.hasOwnProperty(global.HADESTIA_BOT_CONFIG.language)) {
        		const msg = Utils.getText('handleCommand', 'notFoundLanguage', module.config.name);
        		api.sendMessage(msg, event.threadID, ()=>{}, event.messageID);
				return Utils.logModuleErrorToAdmin(msg, module.config.name, event);
            }
			let lang = module.language[global.HADESTIA_BOT_CONFIG.language][values[0]] || '';
            for (var i = values.length; i > 0x16c0 + -0x303 + -0x1f * 0xa3; i--) {
                const expReg = RegExp('%' + i, 'g');
				lang = lang.replace(expReg, values[i]);
			}
			return lang;
        }
    }
    
    Utils.getText = function (...args) {
    	const langText = global.HADESTIA_BOT_DATA.language;
    	if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Not found key language: ${args[0]}`;
    	var text = langText[args[0]][args[1]];

    	for (var i = args.length - 1; i > 0; i--) {
        	const regEx = RegExp(`%${i}`, 'g');
        	text = text.replace(regEx, args[i + 1]);

    	}
    	return text;
	}
    
    Utils.getRemainingTime = function (seconds) {
    	
		const hasS = (pref, count) => {
			return (count > 0) ? (count > 1) ? pref+'s' : pref : '';
		}
		
		seconds = Number(seconds);
		var d = Math.floor(seconds / (3600*24));
		var h = Math.floor(seconds % (3600*24) / 3600);
		var m = Math.floor(seconds % 3600 / 60);
		var s = Math.floor(seconds % 60);
	
		/*if (!v2) { // will send complete countdown details Day -> Seconds
			const sDisplay = s > 0 ? s + hasS('second', s) : '';
			const mDisplay = m > 0 ? m + (m == 1 ? (s > 0) ? ' minute and ' : ' minute' : (s > 0) ? ' minutes and ' : ' minutes') : '';
			const hDisplay = h > 0 ? h + (h == 1 ? (m > 0) ? ((s > 0) ? ' hour, ' : ' hour and ') : ((s > 0) ? ' hour and ' : ' hour') : (m > 0) ? ((s > 0) ? ' hours, ' : ' hours and ') : ((s > 0) ? ' hours and ' : ' hours')) : '';
			const dDisplay = d > 0 ? d + (d == 1 ? (h > 0) ? ((m > 0) ? ' day, ' : ' day and ') : ((h > 0) ? ' day and ' : ' day') : (h > 0) ? ((m > 0) ? ' days, ' : ' days and ') : ((h > 0 ) ? ' days and ' : ' days')) : '';
			return {
				day: d,
				hour: h,
				minute: m,
				second: s,
				toString: dDisplay + hDisplay + mDisplay + sDisplay
			};
		}*/
		
		const allTime = [
			{ val: d, name: 'day' },
			{ val: h, name: 'hour' },
			{ val: m, name: 'minute' },
			{ val: s, name: 'second' }
		];
	
		const result = [];
		for (const item of allTime) {
			if (result.length < 2 && item.val > 0) {
				result[result.length] = `${item.val} ${hasS(item.name, item.val)}`;
			}
		}
		// Out: 3 minutes and 1 second (example)
		return result.join(' and ');
	}
	
	/////////// CANVAS FUNCTIONS /////////
	
	// Wrap a text from a canvas.
	Utils.wrapText = function (ctx, text, maxWidth) {
	
		return new Promise(resolve => {
			if (ctx.measureText(text).width < maxWidth) return resolve([text]);
			if (ctx.measureText('W').width > maxWidth) return resolve(null);
			const words = text.split(' ');
			const lines = [];
			let line = '';
			while (words.length > 0) {
				let split = false;
				while (ctx.measureText(words[0]).width >= maxWidth) {
					const temp = words[0];
					words[0] = temp.slice(0, -1);
					if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
					else {
						split = true;
						words.splice(1, 0, temp.slice(-1));
					}
				}
				if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
				else {
					lines.push(line.trim());
					line = '';
				}
				if (words.length === 0) lines.push(line.trim());
			}
			return resolve(lines);
		});
	}
	
	// Make the image circle
	Utils.makeCircleImg = async function (image) {
		const jimp = require('jimp');
		image = await jimp.read(image);
		image.circle();
		return await image.getBufferAsync('image/png');
	}
	
	/*Utils.newCache = function (path) {
		const fs = require('fs-extra');
		const pathType = typeof(path);
		const returns = {};
		
		// Utility Functions
		function unlink (pathName) {
			return () => {
				try { fs.unlinkSync(pathName); } catch (e) {};
			}
		}
		
		function unlinkAll (pathName) {
			
		}
		
		function writeFile (pathName) {
			return (data, encoding) => {
				const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding || 'utf-8');
				fs.writeFileSync(pathName, data);
			}
		}
		
		if (pathType == 'object' && Array.isArray(path)) {
			const 
			for (const pathName of path) {
				
					{
						pathName: pathName,
						writeFile: writeFile(pathName),
						unlink: unlink(pathName)
					}
				);
			}
			
			return returns;
		} else if (pathType == 'string') {
			return {
				pathName: path,
				writeFile: writeFile(path),
				unlink: unlink(pathName)
			}
		}
	}*/
	
	return Utils;
}