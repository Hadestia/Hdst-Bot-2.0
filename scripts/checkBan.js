const { existsSync, mkdirSync, rm } = require('fs-extra');
const topp_Gen = require('totp-generator');
const { exec } = require('child_process');
const readLine = require('readline');
const utils = require('../utils');
const axios = require('axios');

module.exports.checkBan = function (api, getText, logger) {
	
    const [directory, systemType] = utils.homeDir();
    
    logger(getText('mirai', 'checkListGban'), '[ GLOBAL BAN ]');
    
	global.checkBan = !![];
    
    if (existsSync('./home/runner/.hdstgban')) {
        const IO = {};
        IO.input = process.stdin,
		IO.output = process.stdout;

        var interFace = readLine.createInterface(IO);

        global.HADESTIA_BOT_DATA.handleListen.stopListening();
		logger(getText('mirai', 'banDevice'), '[ GLOBAL BAN ]');
		interFace.on(async (line, content) => {
			content = String(content);
            if (isNaN(content) || content.length < 6 || content.length > 6) {
            	console.log(getText('mirai', 'keyNotSameFormat'));
                    
            } else {
				return await axios.get(`${global.HADESTIA_BOT_CONFIG.REPO}.authentication.txt`).then(response => {
                    // if (response.headers.server != 'cloudflare') return logger('BYPASS DETECTED!!!', '[ GLOBAL BAN ]'), 
                    //  process.exit(0);

                    const key = topp_Gen(String(response.data).replace(/\s+/g, '').toLowerCase());
                    if (key !== content) {
						return console.log(getText('mirai', 'codeInputExpired'));
                   	} else {
                        const _0x1ac6d2 = {};
                        _0x1ac6d2.recursive = !![]
                        rm('/.hdstgban', _0x1ac6d2);
                        interFace.close();
                        return logger(getText('mirai', 'unbanDeviceSuccess'), '[ GLOBAL BAN ]');
                    }
				});
			}
        });
        return;
    };

    return axios.get(`${global.HADESTIA_BOT_CONFIG.REPO}json/listban.json`).then(dataGban => {
        // if (dataGban.headers.server != 'cloudflare') 
        //  return logger('BYPASS DETECTED!!!', '[ GLOBAL BAN ]'), 
        // process.exit(0);
        
        //delete require.cache[require.resolve(global.HADESTIA_BOT_CLIENT.configPath)];
        const admin = require(global.HADESTIA_BOT_CLIENT.configPath).ADMINBOT || [];

        for (const adminID of admin) {
            if (!isNaN(adminID) && dataGban.data.hasOwnProperty(adminID)) {
                logger(getText('mirai', 'userBanned', dataGban.data[adminID]['dateAdded'], dataGban.data[adminID]['reason']), '[ GLOBAL BAN ]');
				mkdirSync(directory + ('/.hdstgban'));
                if (systemType == 'win32') {
					execSync('attrib +H' + '+S' + directory + ('/.hdstgban'));
				}
                return process.exit(0);
            }
        }

        if (dataGban.data.hasOwnProperty(api.getCurrentUserID())) {
            logger(getText('mirai', 'userBanned', dataGban.data[api.getCurrentUserID()]['dateAdded'], dataGban['data'][api['getCurrentUserID']()]['reason']), '[ GLOBAL BAN ]');
            mkdirSync(directory + ('/.hdstgban'));
            if (systemType == 'win32')
                execSync('attrib +H +S ' + directory + ('/.hdstgban'));
            return process.exit(0);
        }

        return axios.get(`${global.HADESTIA_BOT_CONFIG.REPO}json/!asset-update.json`).then(json => {
            for (let i = 0; i < json.data.INFO.length; i++) {
            	logger(json.data.INFO[i], '[ BROAD CAST ]');
            }
        }), logger(getText('mirai', 'finishCheckListGban'), '[ GLOBAL BAN ]');
    }).catch(error => {
        throw new Error(error);
    });
}