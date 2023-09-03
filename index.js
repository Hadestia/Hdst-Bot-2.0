(async() => {
	const { spawn, exec } = require('child_process');
	const { REPO } = require('./json/config.json');
    const { downloadFile } = require('./utils/index.js');
    
	const axios = require('axios');
	const semver = require('semver');
	const logger = require('./utils/log');
	const chalk = require('chalk');
	const fs = require('fs-extra');
	
	//// ## MAKE PRIORITY DIRECTORY
	const assets = await axios.get(`${REPO}json/!asset-update.json`);
	const local = require('./json/!asset-update.json');
	
	const priorityDir = [
		'./scripts',
		'./json'
	];
	
	for (const path of priorityDir) {
		if (!fs.existsSync(path)) {
			exec(`mkdir ${path}`, (err, stdout, stderr) => {
				if (err) console.log(err);
				if (stderr) console.log(stderr);
			});
		}
	}
	
	if (local.VERSION !== assets.data.VERSION) {
		for (const filename in assets.data.PRIORITY) {
			const folder = (assets.data.PRIORITY[filename].folder) ?
				(assets.data.PRIORITY[filename].folder + '/') :
				(assets.data.PRIORITY[filename].path === '/') ? '' :
				assets.data.PRIORITY[filename].path;
			
			await downloadFile(`${REPO}${folder}${filename}`, `${__dirname}/${folder}${filename}`).then(() => {
				logger(`File (${filename}) downloaded successfully`, 'assets');
			}).catch((err) => {
				logger(`Error while downloading (${filename}): ${err}`, 'error');
			});
		}
	}
	
	// Creation of File Tree
	const fileTree = require('./scripts/fileTree.js');
	const fileTreeSystem = require('./json/fileTreeSystem.json');
	await fileTree.checkAndMakeDir(new Object(fileTreeSystem), `${__dirname}`);
	
	///////////////////////////////////////////////
	//============== CHECK UPTIME ==============//
	/////////////////////////////////////////////
	
	var uptimelink = [
		`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
		`https://hdst-bot-side-server.${process.env.REPL_OWNER}.repl.co`
	]

	await axios.get(encodeURI (`https://hdst-bot-side-server.hdstteam.repl.co/autoPing?name=Hadestia Bot (Team)&link=${uptimelink[0]}`)).then(()=> {
		logger('Successfuly added uptime link', 'warn');
	}).catch(()=>{
		logger('Cannot add uptime link', 'error');
	});
	
	process.env.FB_CHAT_API_NO_UPDATE_CHECK = true;

	const Monitor = require('ping-monitor');

	for (const now of uptimelink) {
		const monitor = new Monitor({
    		website: `${now}`,
			title: 'Hadestia',
    		interval: 20,
    		config: {
				intervalUnits: 'seconds'
			}
		});
		monitor.on('up', (res) => console.log(chalk.bold.hex('#00FF00')('[ UP ] ❯ ') + chalk.hex('#00FF00')(`${res.website}`)))
		monitor.on('down', (res) => console.log(chalk.bold.hex('#FF0000')('[ DOWN ] ❯ ') + chalk.hex('#FF0000')(`${res.website} ${res.statusMessage}`)))
		monitor.on('stop', (website) => console.log(chalk.bold.hex('#FF0000')('[ STOP ] ❯ ') + chalk.hex('#FF0000')(`${website}`)))
		monitor.on('error', (error) => console.log(chalk.bold.hex('#FF0000')('[ ERROR ] ❯ ') + chalk.hex('#FF0000')(`${error}`)))
	}

	// ========= ADD CHILD PROCESS FOR ASSETS ========= //
	
	const assetSession = await spawn('node', ['--trace-warnings', 'scripts/assets.js'], {
		cwd: __dirname,
	    stdio: 'inherit',
	    shell: true
	});
	
	assetSession.on('error', function(error) {
	    logger('An error occurred: ' + JSON.stringify(error), 'error');
	});

    assetSession.on('close', function () {

		///////////////////////////////////////////////////////////
		//========= Create website for dashboard/uptime =========//
		///////////////////////////////////////////////////////////

		const express = require('express');
		const app = express();
	
		const port = process.env.PORT || 3000
	     
		app.listen(port, () =>
			logger(`Your app is listening a http://localhost:${port}`, '[ ONLINE ]')
		);      
		logger('Opened server site...', '[ Starting ]');
	
		/////////////////////////////////////////////////////////
		//========= Create start bot and make it loop =========//
		/////////////////////////////////////////////////////////
	
		function startBot(message) {
	    	(message) ? logger(message, '[ Starting ]') : '';
	
	    	const child = spawn('node', ['--trace-warnings', 'Hadestia.js'], {
	        	cwd: __dirname,
	        	stdio: 'inherit',
	        	shell: true
	   	 });
	
			child.on('close', (codeExit) => {
				if (codeExit != 0 || global.countRestart && global.countRestart < 5) {
	     	    	 startBot('Starting up...');
	     	     	global.countRestart += 1;
					return;
				} else return;
			});
	
			child.on('error', function(error) {
				logger('An error occurred: ' + JSON.stringify(error), '[ Starting ]');
			});
		};
	 
		//===========================================//
	
		axios.get(`${REPO}json/package.json`).then((res) => {
			logger(res.data.name, '[ NAME ]');
			logger('Version: ' + res.data.version, '[ VERSION ]');
			logger(res.data.description, '[ DESCRIPTION ]');
		});
		
		startBot();
	
		// THIZ BOT WAS MADE BY ME(CATALIZCS) AND MY BROTHER SPERMLORD - DO NOT STEAL MY CODE (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯
		app.get('/', (req, res) => res.sendFile(__dirname+'/index.html'));
	});
})();