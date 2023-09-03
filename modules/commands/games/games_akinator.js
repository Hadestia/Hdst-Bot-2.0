module.exports.config = {
	name: 'akinator',
	version: '1.0.0',
	description: 'Think about a real or fictional character. I will try to guess who it is.',
	hasPermssion: 0,
	usage: '',
	aliases: [ 'aki' ],
	cooldowns: 0,
	commandCategory: 'games',
	credits: 'Hadestia',
	envConfig: {
		handleEvent_allowDirectMessages: true
	},
	dependencies: {
        'axios': '',
        'stream': '',
        'aki-api': ''
    },
    disabled: true
}

const userMAP = new Object();
const possibleAns = {
	'yes': 0,
	'no': 1,
	'don\'t know': 2,
	'probably': 3,
	'probably not': 4
}

module.exports.lateInit = function ({ api, Utils }) {
	
	setInterval(async function () {
		await (async() => {
			for (const ID in userMAP) {
				if (userMAP[ID].expiration <= 0) {
					const data = userMAP[ID];
					// session expired
					api.sendMessage(
						'\u274E Cancelled Akinator game.',
						data.threadID,
						() => {
							delete userMAP[ID];
						}
					);
				} else {
					userMAP[ID].expiration = userMAP[ID].expiration - 1;
				}
			}
			return;
		})();
	}, 1000);
	
}

module.exports.run = async function ({ api, event, Utils, Prefix }) {
	
	const { Aki } = require('aki-api');
	
	const { senderID, threadID, messageID } = event;
	
	const mappingID = `${senderID}-${threadID}`;
	
	// Create new client
	if (!userMAP[mappingID]) {
		try {
			const akiAPI = new Aki({ region: 'en' });
			const expiration = 120;
			const botGuessed = false;
			await akiAPI.start();
		
			const question = await Utils.fancyFont.get(`Q${akiAPI.currentStep + 1}. ${akiAPI.question}`, 1);
			api.sendMessage(
				Utils.textFormat('cmd', 'cmdAkinatorQuestion', question),
				threadID,
				(err) => {
					if (!err) {
						userMAP[mappingID] = { threadID, akiAPI, expiration, botGuessed }
					}
				},
				messageID
			);
		} catch (err) {
			Utils.sendReaction.failed(api, event);
			Utils.logModuleErrorToAdmin(err, __filename, event);
			api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
		}
	}
}

module.exports.handleEvent = async function ({ api, event, Utils }) {
	
	const axios = require('axios');
	const fs = require('fs');
	
	const { body, threadID, messageID, senderID } = event;
	const mappingID = `${senderID}-${threadID}`;
	const response = body.toLowerCase();
	
	if (userMAP[mappingID]) {
		const data = userMAP[mappingID];
		const akiAPI = data.akiAPI;
		
		if (Object.keys(possibleAns).includes(response)) {
			const client_ans = possibleAns[response];
			
			// if Already Max: (80)
			if (akiAPI.currentStep >= 80) {
				return api.sendMessage(
					'\u274E I\'m sorry, I cannot guess your character, Maybe think another one and try again. \uD83D\uDE01',
					threadID,
					() => {
						delete userMAP[mappingID];
					},
					messageID
				);
			}
			
			await akiAPI.step(client_ans);
			// If bot already have a guess
			if (data.botGuessed) {
				if (client_ans == 0) {
					delete userMAP[mappingID];
					return api.sendMessage('Great! I guessed correctly. I love playing with you!', data.threadID, data.messageID);
				} else {
					userMAP[mappingID].botGuessed = false;
					await sendOtherQuestion(akiAPI).catch(console.error);
				}
			} else {
				if (akiAPI.progress >= 80 || akiAPI.currentStep >= 50) {
					await akiAPI.win(); 
					const answer = akiAPI.answers[0];
					const path = `${Utils.ROOT_PATH}/cache/akinator_${mappingID}_${Date.now()}.jpg`;
					const body = Utils.textFormat('cmd', 'cmdAkinatorGuess', Math.floor(akiAPI.progress), await Utils.fancyFont.get(answer.name, 1));
					await Utils.downloadFile(answer.absolute_picture_path, path).then(() => {
						api.sendMessage(
							{ body, attachment: fs.createReadStream(path) },
							threadID,
							(err) => {
								if (!err) {
									userMAP[mappingID].botGuessed = true;
								}
								fs.unlinkSync(path);
							},
							messageID
						);
					}).catch(() => {
						api.sendMessage(
							body, threadID,
							(err) => {
								if (!err) {
									userMAP[mappingID].botGuessed = true;
								}
								fs.unlinkSync(path);
							},
							messageID
						);
					});
				} else {
					await sendOtherQuestion(akiAPI).catch(console.error);
				}
			}
		} else {
			api.sendMessage(
				'\u274E Cancelled Akinator game.',
				threadID,
				() => {
					delete userMAP[mappingID];
				}
			);
		}
	}
	
	
	
	async function sendOtherQuestion(akiAPI) {
		const question = await Utils.fancyFont.get(`Q${akiAPI.currentStep + 1}. ${akiAPI.question}`, 1);
		api.sendMessage(
			Utils.textFormat('cmd', 'cmdAkinatorQuestion', question),
			threadID,
			(err) => {
				if (!err) {
					userMAP[mappingID].expiration = 120;
					userMAP[mappingID].akiAPI = akiAPI;
				}
			},
			messageID
		);
		return;
	}
}