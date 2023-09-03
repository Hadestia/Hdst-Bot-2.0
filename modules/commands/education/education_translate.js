module.exports.config = {
	name: 'translate',
	version: '1.0.1',
	hasPermssion: 0,
	credits: 'Mirai Team', // beautify by Hadestia
	commandCategory: 'education',
	description: 'Translate text to a given language, if no given language it will translated to English as default.\n To translate text to specific language your request must include \'<space>-><space>\' followed by requested language to process.',
	usages: '[ text | @message reply ] [ -> < language ISO > ]',
	cooldowns: 5,
	aliases: [ 'trans' ],
	dependencies: {
		'translatte': ''
	}
};

module.exports.run = async ({ api, event, args, Utils }) => {
	
	const { threadID, messageID } = event;
	const content = args.join(' ');
	let text = '';
	
	let reqLang = content.match(/(?<=\->).+?$/g);
	
	if (event.type == 'message_reply') {
		if (!event.messageReply.body) {
			return sendError('There\'s no text here');
		}
		text = event.messageReply.body;
	} else {
		if (content.indexOf('->') !== -1) {
			text = content.slice(0, content.indexOf('->'));
		} else {
			text = content;
		}
	}
	text = text.normalize('NFKD').trim();


	await translateThis(text, null, (reqLang) ? reqLang[0].trim() : null ).then((res) => {
		return api.sendMessage(
			Utils.textFormat('cmd', 'cmdTranslationFormat', res.text, res.from, res.to),
			threadID, messageID
		);
	}).catch((err) => {
		return sendError(err);
	});

	function sendError(text) {
		api.sendMessage(Utils.textFormat('error', 'errOccured', text), threadID, Utils.autoUnsend, messageID);
		return;
	}
}

async function translateThis(text, from, to) {
	
	const translate = require('translatte');
	
	return new Promise(function (resolve, reject) {
		
		try {
			let transTo = to || global.HADESTIA_BOT_CONFIG.language;
			translate(text, { from: from, to: transTo }).then((res) => {
				return resolve({
					text: res.text || '!?',
					from: res.from.language.iso || 'unknown',
					to: transTo
				});
			}).catch((err) => {
				return reject(err.message);
			});
		} catch (err) {
			return reject(err);
		}
	});
}