module.exports.config = {
	name: 'fbcover',
	version: '1.0.0',
	hasPermssion: 0,
	cooldowns: 20,
	commandCategory: 'edited_images',
	description: 'Generate facebook cover by filling out the form the bot will send to you.',
	usages: '',
	dependencies: {
		'axios': '',
		'fs-extra': ''
	},
	credits: 'Joshua Sy for API',
	envConfig: {
		handleEvent_allowDirectMessages: true
	}
}

module.exports.fetchData = function (body) {
	// fetch informations
	let color = body.match(/(?<=color:).+?(?=\s|\s+)/) ?
		(body.match(/(?<=color:).+?(?=\s|\s+)/))[0].trim() : null;

	let top_name = body.match(/(?<=name:).+?(?=\n)/) ?
		(body.match(/(?<=name:).+?(?=\n)/))[0].trim() : null;
		
	let sub_name = body.match(/(?<=subname:).+?(?=\n)/) ?
		(body.match(/(?<=subname:).+?(?=\n)/))[0].trim() : null;
	
	let email = body.match(/(?<=email:).+?(?=\s|\s+)/) ?
		(body.match(/(?<=email:).+?(?=\s|\s+)/))[0].trim() : null;
	
	let address = body.match(/(?<=address:).+?(?=\n)/) ?
		(body.match(/(?<=address:).+?(?=\n)/))[0].trim() : null;
	
	let contact_no = body.match(/(?<=contact no.:).+?(?=\n)/) ?
		(body.match(/(?<=contact no.:).+?(?=\n)/))[0].trim() : null;
		
	return { color, top_name, sub_name, email, address, contact_no };
}

module.exports.handleEvent = async function ({ api, event, Utils, Prefix }) {
	
	if (event.body == '') return;
	
	const { threadID, messageID, senderID } = event;
	if (event.body.indexOf('● Facebook Cover Form\n━━━━━━━━━━━━━━━━━━━━') == -1) return;

	//console.log(event.body);
	
	const axios= require('axios');
	const fs = require('fs-extra');
	const body = event.body;
	
	const sendError = (msg) => {
		api.sendMessage(Utils.textFormat('error', 'errOccured', `${msg}. Make sure you didn't change anything on the form and doesn't make any new lines for data.`), threadID, messageID);
	}
	
	const { color, top_name, sub_name, email, address, contact_no } = this.fetchData(body);
	
	if (!color) {
		return sendError(`Color not found pls specified via color name`);
	} else if (!top_name) {
		return sendError(`Name not found`);
	} else if (!sub_name) {
		return sendError(`Subname not found`);
	} else if (!email) {
		return sendError(`Email not found`);
	} else if (!address) {
		return sendError(`Address not found`);
	} else if (!contact_no) {
		return sendError(`Contact number not found`);
	}
	
	// process if no violation found
	try {
		Utils.sendReaction.inprocess(api, event);
		
		const link = `${encodeURI(`https://sim.ainz-project.repl.co/canvas/fbcover?uid=${senderID}&color=${color}&name=${top_name}&subname=${sub_name}&email=${email}&address=${address}&sdt=${contact_no}`)}`;
		var path = `${Utils.ROOT_PATH}/cache/${(link.split('/')).pop()}.png`;
		const generatedIMG = (await axios.get(link, { responseType: 'arraybuffer' } )).data;
		
		// save img
		fs.writeFileSync(path, Buffer.from(generatedIMG, 'utf-8'));
		
		api.sendMessage(
			{
				body: '',
				attachment: fs.createReadStream(path)
			},
			threadID,
			(e) => {
				if (fs.existsSync(path)) { fs.unlinkSync(path); }
				
				if (e) {
					return Utils.sendReaction.failed(api, event);
				}
				
				Utils.sendReaction.success(api, event);
			},
			messageID
		);
	} catch (e) {
		//returns.delete_data();
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(e, __filename, event);
		api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', e, Prefix), threadID, messageID);
		if (fs.existsSync(path)) return fs.unlinkSync(path);
	}
}

module.exports.run = async function ({ api, args, event, returns, Utils, Users }) {
	
	const { threadID, messageID, senderID } = event;
	const replyTimeout = Date.now() + 300000; // 5 minutes timeout

	const userName = await Users.getNameUser(senderID);
	
	return api.sendMessage(
		{
			body: `${Utils.textFormat('canvas', 'fbcoverFillOutForm')} @${userName || 'user'}`,
			mentions: [{
				tag: `@${userName}`,
				id: senderID
			}]
		},
		threadID,
		async (err, info) => {
			if (err) {
				returns.remove_usercooldown();
				api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', e), threadID, messageID);
				return Utils.logModuleErrorToAdmin(err, __filename, event);
			}
			Utils.autoUnsend(err, info, 180);
			/*// send a signal to handle Reply
			return global.client.handleReply.push({
				name: this.config.name,
				messageID: info.messageID,
            	author: senderID,
            	timeout: replyTimeout
			});*/
		},
		messageID
	);
}