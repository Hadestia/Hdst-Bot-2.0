module.exports.config = {
	name: 'user-info',
	version: '1.0.11',
	hasPermssion: 2,
	credits: 'Hadestia',
	commandCategory: 'ownership',
	description: 'get user info of yourself or using uid / by mentioning / or replied message',
	usages: '[ name | username | uid | @reply | @mention ]',
	cooldowns: 300,
	aliases: [ 'stalk' ],
	envConfig: {
		inProcessReaction: true
	},
	dependencies: {
		'axios': '',
		'get-fbid': '',
		'fs-extra': ''
	}
};

module.exports.run = async function ({ api, event, args, utils, returns, Utils, Prefix, Users }) {
	
	const axios = require('axios');
	const fs = require('fs-extra');
	
	let { threadID, senderID, messageID } = event;

	async function searchPerson(str) {
		// LEGACY
		/*const search = await api.getUserID(str);
		
		if (search[0]) {
			if (str.indexOf('mark zuckerberg') !== -1) {
				returns.remove_usercooldown();
				Utils.sendReaction.failed(api, event);
				api.sendMessage(Utils.textFormat('error', 'errOccured', 'I can\'t do that.'), threadID, messageID);
			}
			return search[0].userID;
		} else {
			returns.remove_usercooldown();
			Utils.sendReaction.failed(api, event);
			api.sendMessage(Utils.textFormat('error', 'errOccured', 'I couldn\'t find that person.'), threadID, messageID);
			return false;
		}*/
		const grabID = require('get-fbid');
		let result = await grabID(str);
		return result;
	}
	
	//global.sendReaction.inprocess(api, event);
	try {
		
		let id;
		
		if (args.join().indexOf('@') !== -1) {
			
			const mentKeys = Object.keys(event.mentions);
			if (mentKeys.length == 0) {
				return api.sendMessage('Why should i stalk my self?', threadID, messageID);
			}
			id = Object.keys(event.mentions)
			
		} else {
			
			const init = ((args.length > 0) ? args.join(' ') : event.senderID).toLowerCase();
			
			if (args.length > 0) {
				if (parseInt(init)) {
					if (init.length > 15) {
						returns.remove_usercooldown();
						return Utils.sendReaction.failed(api, event); 
					}
					id = init;
				} else if (init.indexOf('facebook.com') !== -1) {
					const split = init.split('facebook.com/');
					const username = split.pop();
					// automatically transfer if username was the user id
					if (parseInt(username)) {
						id = username;
					} else {
						const result = await searchPerson(username);
						if (!result) return;
						id = result;
					}
				} else {
					const result = await searchPerson(init);
					if (!result) return;
					id = result;
				}
			} else {
				id = event.senderID;
			}
		}
		
		if (event.type == 'message_reply') {
			
			id = event.messageReply.senderID
			
		}
		
		// const res = await api.getUserInfoV2(id);
		const n_a = Utils.textFormat('error', 'errNoData');
		
		// LEGACY
		/* const khong = 'Kh\u00F4ng';
		
		var gender = (!res.gender) ? n_a : ((res.gender).startsWith(khong)) ? n_a : (res.gender == 'male') ? 'Male' : (res.gender == 'female') ? 'Female' : res.gender;
		var birthday = (!res.birthday) ? n_a : ((res.birthday).startsWith(khong)) ? n_a : res.birthday;
		var usern = (!res.username) ? id : ((res.username).startsWith(khong)) ? id : res.username;
		
		var love = (!res.relationship_status) ? n_a : ((res.relationship_status).startsWith(khong)) ? n_a : res.relationship_status;
		var location = (!res.location) ? n_a : (typeof(res.location) == 'object') ? res.location.name : n_a;
		var hometown = (!res.hometown) ? n_a : (typeof(res.hometown) == 'object') ? res.hometown.name : n_a;
		var followers = (!res.follow) ? n_a : (typeof(res.follow) == 'number') ? res.follow : n_a;
		//var rs = ((res.love).startsWith('Không')) ? n_a : res.love.name;
		var quotes = (!res.qoutes) ? n_a : ((res.quotes).startsWith(khong))? n_a : res.quotes;
		*/
		
		const user = await Utils.getUserInfo(id);
		const gender = user.gender == 1 ? 'Female' : user.gender == 2 ? 'Male' : n_a;
		
		const path = `${Utils.ROOT_PATH}/cache/profilePicture-${id}.png`;
		const profile_av = (await axios.get(user.profileUrl, { responseType: 'arraybuffer' })).data;
		fs.writeFileSync(path, Buffer.from(profile_av, 'utf-8'));
		
		return api.sendMessage(
			{
				body: Utils.textFormat(
					'cmd', 'cmdStalkFormatSimple',
					user.name,
					user.username,
					gender,
					id,
					user.url
				),
				attachment: fs.createReadStream(path)
			},
			threadID,
			(e, info) => {
				Utils.sendReaction.success(api, event);
				try { fs.unlinkSync(path) } catch (e) {}
				// Utils.autoUnsend(e, info, 300);
			},
			messageID
		);
		
	} catch (err) {
		returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(err, __filename, event);
		//api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
		return console.log(err);
	}
};