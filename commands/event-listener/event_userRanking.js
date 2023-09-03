module.exports.config = {
    name: 'user-ranking',
    version: '1.0.0',
    credits: 'Hadestia', // pls don't change my credit as for my effort for this work.
    description: 'An event listener for sending rankcard & user to increase experience points by typing.',
    commandCategory: 'hidden',
    hasPermssion: 0,
    usages: '',
    envConfig: {
		needGroupData: true,
		needUserData: true
	},
	dependencies: {
		'fs-extra': ''
	}
}

module.exports.run = async function ({ api, event, Users }) {
	
	const { experience } = await Users.getData(event.senderID);
	const level = Math.floor((Math.sqrt(1 + (4 * (experience + 1) / 3) + 1) / 2));

	api.sendMessage(
		`LVL: ${level}\nEXP: ${experience}`, event.threadID, event.messageID
	);
}

module.exports.handleEvent = async function ({ api, event, Utils, Users, Threads }) {
	
	if (!event.type == 'message') return;
	
	const { senderID, threadID } = event;
	
	try { 
		const { data, economy } = await Threads.getData(threadID);
		let { experience } = await Users.getData(senderID);
	
		if (!experience || !data.allowRankLevels) return;
	
		// Increment
		experience++;
		await Users.setData(senderID, { experience });

		const current_level = Math.floor((Math.sqrt(1 + (4 * experience / 3) + 1) / 2));
		const level = Math.floor((Math.sqrt(1 + (4 * (experience + 1) / 3) + 1) / 2));
	
		if (level !== 1 && level > current_level) {
		
			const fs = require('fs-extra');
			
			const userName = await Users.getNameUser(senderID);
			const shorten_name = userName.split(' ')[0];
			const message = Utils.textFormat('events', 'eventRankUpMessage', shorten_name, level);
			
			const lvl_up_reward = 500 * level;
			economy[senderID].bank += lvl_up_reward;
		
			const path = `${Utils.ROOT_PATH}/cache/levelUp-${senderID}.png`;
			Utils.downloadFile(
				`https://hdst-bot-side-server.hdstteam.repl.co/bannerRankUp?userID=${senderID}&userLevel=${level}`, path
			).then(() => {
				api.sendMessage(
					{
						body: message,
						attachment: fs.createReadStream(path),
						mentions: [ { tag: shorten_name, id: senderID } ]
					},
					threadID,
					(err, info) => {
						fs.unlinkSync(path);
						Utils.autoUnsend(err, info, 300);
					}
				);
			}).catch(() => {});
			await Threads.setData(threadID, { economy });
		}
	} catch (e) {}
}