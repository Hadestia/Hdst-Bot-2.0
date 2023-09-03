const { REPO, AUTO_UPDATE_ASSETS } = require('../json/config.json');
const { existsSync, readFileSync, writeFileSync, createWriteStream } = require('fs-extra');
const { execSync } = require('child_process');
const index = require('../utils/index.js');
const logger = require('../utils/log.js');
const axios = require('axios');

// ========== ASSETS & MODULES UPDATER BY HADESTIA ========== //

async function checkAndUpdateAssets() {
	// ====== AUTO REINSTALL ASSETS ====== //
	
	logger('✦━━━━ ASSETS PROCESS ━━━━✦', 'hl');

	const assets = await axios.get(`${REPO}json/!asset-update.json`);
	const local_asset = require(`${__dirname}/../json/!asset-update.json`);

	
	if (AUTO_UPDATE_ASSETS && assets.data) {

		if (local_asset.VERSION !== assets.data.VERSION) {
			
			// REMOVE ALL COMMANDS && EVENTS
			execSync(
				'rm modules/commands/*.js && rm modules/events/*.js',
				(err, stdout, stderr) => {
					(err) ? console.error(err) : '';
					(stderr) ? console.error(stderr) : '';
				}
			);
			
			logger(`NEW VERSION FOUND: ${assets.data.VERSION}`, 'warn');
		
			await index.downloadFile(`${REPO}json/!asset-update.json`, `${__dirname}/../json/!asset-update.json`);
			
			await writeFileSync(`${__dirname}/../cache/keep/!asset-has-update.txt`, 'true', 'utf-8');
			
			for (const filename in assets.data.MAIN) {
			
				const folder = (assets.data.MAIN[filename].folder) ?
					(assets.data.MAIN[filename].folder + '/') :
					(assets.data.MAIN[filename].path === '/') ? '' :
					assets.data.MAIN[filename].path;
					
				await index.downloadFile(`${REPO}${folder}${filename}`, `${__dirname}/../${folder}${filename}`).then(() => {
				logger(`File (${filename}) downloaded successfully`, 'assets');
				}).catch((err) => {
					logger(`Error while downloading (${filename}): ${err}`, 'error');
				});
				
			}
		
			// ====== COMMAND MODULE AUTO UPDATE ====== //
	
			logger('✦━━ COMMAND MODULES PROCESS ━━✦', 'hl');
			
			for (const module of assets.data.COMMANDS) {
			
				await index.downloadFile(`${REPO}commands/${module}.js`, `${__dirname}/../modules/commands/${module}.js`).then(() => {
					logger(`Module (${module}) downloaded successfully`, 'assets');
				}).catch((err) => {
					logger(`Error while downloading (${module}): ${err}`, 'error');
				});
				
			}
			
			// ====== EVENT MODULE AUTO UPDATE ====== //
			
			logger('✦━━ EVENT MODULES PROCESS ━━✦', 'hl');
			
			for (const event of assets.data.EVENTS) {
				
				await index.downloadFile(`${REPO}events/${event}.js`, `${__dirname}/../modules/events/${event}.js`).then(() => {
					logger(`Module (${event}) downloaded successfully`, 'assets');
				}).catch((err) => {
					logger(`Error while downloading (${event}): ${err}`, 'error');
				});
				
			}
			
			// writeFileSync(`${__dirname}/cache/!assets_version.txt`, `${assets.data.VERSION}=true`, 'utf-8');
			
		} else {
			logger(`ASSETS ARE UP TO DATE USING VERSION ${local_asset.VERSION}`, 'warn');
		}
	
    } else {
    	logger('AUTO UPDATE ASSETS WAS DISABLED, skipping...', 'hl');
    }
}

(async() => {
	await checkAndUpdateAssets();
})();