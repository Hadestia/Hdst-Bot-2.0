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
					

				/* for (const command of listCommands) {
					console.log(command);

					try {
					
						var module = require(global.HADESTIA_BOT_CLIENT.mainPath + '/modules/commands/' + command);

						// process module rules

						if (!module.config || !module.run || !module.config.commandCategory) throw new Error(getText('mirai', 'errorFormat'));

						if (global.HADESTIA_BOT_CLIENT.commands.has(module.config.name || '')) throw new Error(getText('mirai', 'nameExist'));

						if (!module.languages || typeof module.languages != 'object' || Object.keys(module.languages)
							.length == 0) logger.loader(getText('mirai', 'notFoundLanguage', module.config.name), 'warn');

						if (module.config.dependencies && typeof module.config.dependencies == 'object') {

							for (const reqDependencies in module.config.dependencies) {

								const reqDependenciesPath = join(__dirname, 'modules', 'other_nodemodules', 'node_modules', reqDependencies);

								try {

									//if (!global.nodemodule.hasOwnProperty(reqDependencies)) {

									if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) {

										//global.nodemodule[reqDependencies] = require(reqDependencies);

										const sample = require(reqDependencies);

									} else {

										//global.nodemodule[reqDependencies] = require(reqDependenciesPath);

										const sample = require(reqDependenciesPath);

									}

									//}



								} catch (e) {

									var check = false;

									var isError;

									logger.loader(getText('mirai', 'notFoundPackage', reqDependencies, module.config.name), 'warn');

									execSync('npm ---package-lock false --save install' + ' ' + reqDependencies + (module.config.dependencies[reqDependencies] == '*' || module.config.dependencies[reqDependencies] == '' ? '' : '@' + module.config.dependencies[reqDependencies]), {

										'stdio': 'inherit',

										'env': process['env'],

										'shell': true,

										'cwd': __dirname

									});

									for (let i = 1; i <= 3; i++) {

										try {

											//require['cache'] = {};

											//if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) global['nodemodule'][reqDependencies] = require(reqDependencies);

											//else global['nodemodule'][reqDependencies] = require(reqDependenciesPath);

											check = true;

											break;

										} catch (error) {

											isError = error;

										}

										//if (check || !isError) break;

									}

									if (!check || isError) throw getText('mirai', 'cantInstallPackage', reqDependencies, module.config.name, isError);

								}

							}

							logger.loader(getText('mirai', 'loadedPackage', module.config.name));

						}

						if (module.config.envConfig) try {

							for (const envConfig in module.config.envConfig) {

								if (typeof global.HADESTIA_BOT_CLIENT.commandEnvConfig[module.config.name] == 'undefined') global.HADESTIA_BOT_CLIENT.commandEnvConfig[module.config.name] = {};

								global.HADESTIA_BOT_CLIENT.commandEnvConfig[module.config.name][envConfig] = module.config.envConfig[envConfig];

							}

							logger.loader(getText('mirai', 'loadedConfig', module.config.name));

						}
						catch (error) {

							throw new Error(getText('mirai', 'loadedConfig', module.config.name, JSON.stringify(error)));

						}

						if (module.onLoad) {

							try {

								const moduleData = {};

								moduleData.api = loginApiData;

								moduleData.models = botModel;

								module.onLoad(moduleData);

							} catch (_0x20fd5f) {

								throw new Error(getText('mirai', 'cantOnload', module.config.name, JSON.stringify(_0x20fd5f)), 'error');

							};

						}

						if (module.handleEvent) global.HADESTIA_BOT_CLIENT.eventRegistered.push(module.config.name);

						if (module.handleMessageReply) global.HADESTIA_BOT_CLIENT.messageReplyRegistered.push(module.config.name);



						// also Register command aliases if has

						if (module.config.aliases) {

							for (const alias of module.config.aliases) {

								global.HADESTIA_BOT_CLIENT.commandAliases.set(alias, module.config.name);

							}

						}



						global.HADESTIA_BOT_CLIENT.commands.set(module.config.name, module);

						logger.loader(getText('mirai', 'successLoadModule', module.config.name));



					} catch (error) {

						if (error) throw error;

						logger.loader(getText('mirai', 'failLoadModule', module.config.name, error), 'error');

					};

				}

			}(),

			// EVENTS FOLDER

			function() {

				const events = readdirSync(global.HADESTIA_BOT_CLIENT.mainPath + '/modules/events')
					.filter(event => event.endsWith('.js') && !global.HADESTIA_BOT_CONFIG.eventDisabled.includes(event));

				for (const ev of events) {

					console.log(ev);

					try {

						var event = require(global.HADESTIA_BOT_CLIENT.mainPath + '/modules/events/' + ev);

						if (!event.config || !event.run) throw new Error(getText('mirai', 'errorFormat'));

						if (global.HADESTIA_BOT_CLIENT.events.has(event.config.name) || '') throw new Error(getText('mirai', 'nameExist'));



						if (event.config.dependencies && typeof event.config.dependencies == 'object') {

							for (const dependency in event.config.dependencies) {

								const _0x21abed = join(__dirname, 'modules', 'other_nodemodules', 'node_modules', dependency);

								try {

									//if (!global.nodemodule.hasOwnProperty(dependency)) {

									if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) {

										// if these sample fails: will undergo package installing

										//global.nodemodule[dependency] = require(dependency);

										const sample = require(dependency);

									} else {

										//global.nodemodule[dependency] = require(_0x21abed);

										const sample = require(_0x21abed);

									}

									//}

								} catch (e) {

									let check = false;

									let isError;

									logger.loader(getText('mirai', 'notFoundPackage', dependency, event.config.name), 'warn');

									execSync('npm --package-lock false --save install' + dependency + (event.config.dependencies[dependency] == '*' || event.config.dependencies[dependency] == '' ? '' : '@' + event.config.dependencies[dependency]), {

										'stdio': 'inherit',

										'env': process['env'],

										'shell': true,

										'cwd': __dirname

									});



									for (let i = 1; i <= 3; i++) {

										try {

											//require['cache'] = {};

											//if (global.nodemodule.includes(dependency)) break;

											//if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) global.nodemodule[dependency] = require(dependency);

											//else global.nodemodule[dependency] = require(_0x21abed);

											check = true;

											break;

										} catch (error) {

											isError = error;

										}

										//if (check || !isError) break;

									}

									if (!check || isError) throw getText('mirai', 'cantInstallPackage', dependency, event.config.name);

								}

							}

							logger.loader(getText('mirai', 'loadedPackage', event.config.name));

						}

						if (event.config.envConfig) try {

							for (const _0x5beea0 in event.config.envConfig) {

								if (typeof global.HADESTIA_BOT_CLIENT.eventEnvConfig[event.config.name] == 'undefined') {

									global.HADESTIA_BOT_CLIENT.eventEnvConfig[event.config.name] = {};

								} else {

									global.HADESTIA_BOT_CLIENT.eventEnvConfig[event.config.name][_0x5beea0] = event.config.envConfig[_0x5beea0] || '';

								}

							}



							logger.loader(getText('mirai', 'loadedConfig', event.config.name));

						}
						catch (error) {

							throw new Error(getText('mirai', 'loadedConfig', event.config.name, JSON.stringify(error)));

						}

						if (event.onLoad) try {

							const eventData = {};

							eventData.api = loginApiData;

							eventData.models = botModel;

							event.onLoad(eventData);

						}
						catch (error) {

							throw new Error(getText('mirai', 'cantOnload', event.config.name, JSON.stringify(error)), 'error');

						}

						global.HADESTIA_BOT_CLIENT.events.set(event.config.name, event);

						logger.loader(getText('mirai', 'successLoadModule', event.config.name));

					} catch (error) {

						logger.loader(getText('mirai', 'failLoadModule', event.config.name, error), 'error');

					}

				}

			}();
		*/

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



		// auto accept pending message requests

		/*setInterval(function() {

			try {

				

				var spam = await api.getThreadList(100, null, ["OTHER"]) || [];

				var pending = await api.getThreadList(100, null, ["PENDING"]) || [];

				

				

				const list = [...spam, ...pending].filter(group => group.isSubscribed);

			

				for (const thread of list) {

					try {

						const messageBody = `${textFormat('events', 'eventBotJoinedConnected', global.HADESTIA_BOT_CONFIG.BOTNAME, global.HADESTIA_BOT_CONFIG.PREFIX, global.HADESTIA_BOT_CONFIG.PREFIX)}\n\n${textFormat('cmd', 'cmdHelpUsageSyntax')}`;

						loginApiData.sendMessage(messageBody, thread.threadID);

					} catch (e) {}

				}

			} catch (e) {

				return console.log('auto accept pending msg: ' + e);

			}

		}, 5000);*/



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

		/*await axios.get(`https://fb-bot-db.HdstTeam.repl.co/get?name=hdst&password=00000`).then(res => {

        	//console.info(res.data.models);

	        botData.models = res.data.models;

        }).catch(e => console.log(e));

        */



		logger(getText('mirai', 'successConnectDatabase'), '[ DATABASE ]');

		onBot(botData);



	} catch (error) {

		logger(getText('mirai', 'successConnectDatabase', JSON.stringify(error)), '[ DATABASE ]');

	}

	console.log(chalk.bold.hex('#eff1f0')
		.bold('================== SUCCES ====================='));



})();