const { exec, execSync, spawn } = require('child_process');

const textFormat = require('./utils/textFormat.js');

const logger = require('./utils/log.js');

const chalk = require('chalk');

const cron = require('node-cron');

// AUTO DELETE CACHE ========>

exec('find cache/ -maxdepth 1 -type f -delete', (error, stdout, stderr) => {

	if (error) {

		console.log(`auto delete cache error: ${error.message}`);

		return;

	}

	if (stderr) {

		console.log(`auto delete cache stderr: ${stderr}`);

		return;

	}

	console.log(chalk.bold.hex("#00FF00")("[ AUTO CLEAR CACHE ] ❯ ") + chalk.hex("#00FF00")("Successfully delete cache"))

});

//========= Require all variable need use =========//

const { readdirSync, readFileSync, createReadStream, writeFileSync, existsSync, mkdirSync, unlinkSync, rm } = require('fs-extra');
	
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;

const listbuiltinModules = require('module').builtinModules;

const { join, resolve } = require('path');

const login = require('fb-chat-support'); //require('node-ainzfb-new');

const utils = require('./utils');

//////////// INSTANTIATE GLOBAL VARIABLES & FUNCTIONS

logger.loader('Intializing Global Variables...');

global.HADESTIA_BOT_CONFIG = new Object();

// former: GLOBAL.CLIENT

global.HADESTIA_BOT_CLIENT = new Object({

	commands: new Map(),

	commandEnvConfig: new Object(),

	eventEnvConfig: new Object(),

	commandAliases: new Map(),

	events: new Map(),

	cooldowns: new Map(),

	eventRegistered: new Array(),

	messageReplyRegistered: new Array(),

	handleReaction: new Array(),

	handleReply: new Array(),

	mainPath: process.cwd(),

	configPath: new String()

});

// former: GLOBAL.DATA

global.HADESTIA_BOT_DATA = new Object({

	allThreadID: new Map(),

	allUserID: new Map(),

	language: new Object()

});

//========= Find and get variable from Config =========//

let configValue;

try {

	global.HADESTIA_BOT_CLIENT.configPath = join(global.HADESTIA_BOT_CLIENT.mainPath, 'json/config.json');

	configValue = require(global.HADESTIA_BOT_CLIENT.configPath);

	logger.loader('Found file config: config.json');

} catch {

	if (existsSync(global.HADESTIA_BOT_CLIENT.configPath.replace(/\.json/g, '') + '.temp')) {

		configValue = readFileSync(global.HADESTIA_BOT_CLIENT.configPath.replace(/\.json/g, '') + '.temp');

		configValue = JSON.parse(configValue);

		logger.loader(`Found: ${global.HADESTIA_BOT_CLIENT.configPath.replace(/\.json/g,'') + '.temp'}`);

	} else return logger.loader('config.json not found!', 'error');

}

try {

	for (const key in configValue) global.HADESTIA_BOT_CONFIG[key] = configValue[key];



	logger.loader('Config Loaded!');

} catch {

	return logger.loader('Can\'t load file config!', 'error');

}

const { Sequelize, sequelize } = require('./includes/database');

writeFileSync(global.HADESTIA_BOT_CLIENT.configPath + '.temp', JSON.stringify(global.HADESTIA_BOT_CONFIG, null, 4), 'utf8');

//========= Load language use =========//

const langFile = (readFileSync(`${__dirname}/languages/${global.HADESTIA_BOT_CONFIG.language || 'en'}.lang`, { encoding: 'utf-8' }))
	.split(/\r?\n|\r/);

const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');

for (const item of langData) {

	const getSeparator = item.indexOf('=');

	const itemKey = item.slice(0, getSeparator);

	const itemValue = item.slice(getSeparator + 1, item.length);

	const head = itemKey.slice(0, itemKey.indexOf('.'));

	const key = itemKey.replace(head + '.', '');

	const value = itemValue.replace(/\\n/gi, '\n');

	if (typeof global.HADESTIA_BOT_DATA.language[head] == 'undefined') global.HADESTIA_BOT_DATA.language[head] = new Object();

	global.HADESTIA_BOT_DATA.language[head][key] = value;

}

const getText = function(...args) {

	const langText = global.HADESTIA_BOT_DATA.language;

	if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Not found key language: ${args[0]}`;



	var text = langText[args[0]][args[1]];

	for (var i = args.length - 1; i > 0; i--) {

		const regEx = RegExp(`%${i}`, 'g');

		text = text.replace(regEx, args[i + 1]);

	}

	return text;

}

//console.log(getText('mirai', 'foundPathAppstate'))

/// APP STATE FINDER ///

/*

try {

    var appStateFile = resolve(join(global.HADESTIA_BOT_CLIENT.mainPath, global.HADESTIA_BOT_CONFIG.APPSTATEPATH || 'json/appstate.json'));

    var appState = require(appStateFile);

    logger.loader(getText('mirai', 'foundPathAppstate'))

} catch {

    return logger.loader(getText('mirai', 'notFoundPathAppstate'), 'error');

    

}

*/

//========= Login account and start Listen Event =========//

const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

async function onBot({ models: botModel }) {

	console.log('START ON BOT');

	const loginData = {};

	loginData.appState = JSON.parse(process.env.APPSTATE);

	login(loginData, async (loginError, loginApiData) => {

		if (loginError) {

			if (loginError.err == 'login-approval') {

				logger('Enter Authentication Code: ', 'error');

				rl.on('line', (line) => {

					loginError.continue(line);

					rl.close();

				})

			} else {

				logger(JSON.stringify(loginError), `ERROR`);

				return;

			}

		}

		loginApiData.setOptions(global.HADESTIA_BOT_CONFIG.FCAOption);

		//writeFileSync(appStateFile, JSON.stringify(loginApiData.getAppState(), null, '\x09'))

		//global.HADESTIA_BOT_CONFIG.version = '1.2.14'
		
		function handleInnerModuleDirectory(path, handleObject) {
			
			const directory = readdirSync(path).filter(name => !name.includes('cache') && !name.includes('noprefix'));
			
			for (const value of directory) {
				
				const newPath = join(path, value);
				
				if (value.endsWith('.json')) {
					handleObject(newPath);
				// assuming it was a directory
				} else {
					handleInnerModuleDirectory(newPath, handleObject)
				}
			}
		}
		
		global.HADESTIA_BOT_CLIENT.timeStart = new Date()
			.getTime(),

			// COMMANDS FOLDER
		
			function() {
				
				const rootPath = global.HADESTIA_BOT_CLIENT.mainPath + '/modules/';
				
				// Load modules: command & event folder
				const moduleTypes = readdirSync(rootPath).filter(dir => dir.includes('commands') || dir.includes('events'));
					
				for (const type of moduleTypes) {
	
					//const categories = readdirSync(join(rootPath, type));
					handleInnerModuleDirectory(join(rootPath, type), function (objectPath) {
							
							const objects = require(objectPath);
							
							for (const obj of objects) {
								
								const type = obj.type.trim().toLowerCase();
								// HANDLE COMMAND TYPE OBJECTS
								if (type == 'commands') {
									
									console.log(obj);
									
								} else (type == 'events') {
								// ELSE EVENT TYPE OBJECTS
									console.log(obj);
									
								}
								
							}
							
					});
					
				}
				
			}();

		logger.loader(getText('mirai', 'finishLoadModule', global.HADESTIA_BOT_CLIENT.commands.size, global.HADESTIA_BOT_CLIENT.events.size))

		logger.loader('=== ' + (Date.now() - global.HADESTIA_BOT_CLIENT.timeStart) + 'ms ===')

		writeFileSync(global.HADESTIA_BOT_CLIENT.configPath, JSON.stringify(global.HADESTIA_BOT_CONFIG, null, 4), 'utf8')

		unlinkSync(global.HADESTIA_BOT_CLIENT.configPath + '.temp');

		const listenerData = {};

		listenerData.api = loginApiData;

		listenerData.models = botModel;

		const listener = await require('./includes/listen')(listenerData);

		function listenerCallback(error, message) {

			if (error) return logger(getText('mirai', 'handleListenError', JSON.stringify(error)), 'error');

			if (['presence', 'typ', 'read_receipt'].some(data => data == message.type)) return;

			if (global.HADESTIA_BOT_CONFIG.DeveloperMode == !![]) console.log(message);

			return listener(message);

		};

		global.HADESTIA_BOT_DATA.handleListen = loginApiData.listenMqtt(listenerCallback);

		try {

			const ban = require('./scripts/checkBan.js');

			await ban.checkBan(loginApiData, getText, logger);

		} catch (error) {

			return logger(error, 'error');

		};

		if (!global.checkBan) {

			logger(getText('mirai', 'warningSourceCode'), '[ GLOBAL BAN ]');

		}

		const gmt = require('moment-timezone');

		const momentt = gmt.tz('Asia/Manila');

		const time = momentt.format('HH:mm:ss');



		// notify every admin

		const botAdmins = global.HADESTIA_BOT_CONFIG.ADMINBOT;

		for (const admin of botAdmins) {

			loginApiData.sendMessage(textFormat('system', 'botLogActivate', time), admin);

		}

	});

}

//========= Connecting to Database =========//

(async () => {

	try {

		await sequelize.authenticate();

		const authentication = {};

		authentication.Sequelize = Sequelize;

		authentication.sequelize = sequelize;

		const models = require('./includes/database/model')(authentication);

		const botData = {};

		botData.models = models;

		logger(getText('mirai', 'successConnectDatabase'), '[ DATABASE ]');

		onBot(botData);

	} catch (error) {

		logger(getText('mirai', 'successConnectDatabase', JSON.stringify(error)), '[ DATABASE ]');

	}

	console.log(chalk.bold.hex('#eff1f0')
		.bold('================== SUCCES ====================='));

})();