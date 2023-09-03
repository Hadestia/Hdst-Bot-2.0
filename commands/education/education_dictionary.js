module.exports.config = {
	name: 'dictionary',
	version: '2.0.6',
	hasPermssion: 0,
	credits: 'Hadestia',
	description: 'Check definition of specific word.',
	usages: '<word>',
	aliases: [ 'dict', 'meaning' ],
	commandCategory: 'education',
	cooldowns: 5,
	envConfig: {
		requiredArgument: 1,
		inProcessReaction: true
	},
	dependencies: {
		'axios': '',
		'fs-extra': '',
		'request': ''
	}
}

module.exports.run = async function({ api, event, args, Utils }) {
	
	const { threadID, messageID, senderID } = event;
	const fs = require('fs-extra');
	const axios = require('axios');
	
	const req = args.join(' ').toLowerCase();
	const finalReq = (req.startsWith('what is')) ? req : `what is ${req}`;
	//const encodedUrl = encodeURI(`https://api.dictionaryapi.dev/api/v2/entries/en/${req}`);
	const encodedUrl = encodeURI(`https://api-dien.hdstteam.repl.co/googlethis?search=${finalReq}`);
	//Utils.sendReaction.inprocess(api, event);

	await axios.get(encodedUrl).then( async function (response){
		const dictionary = response.data.dictionary;
		// return if no definition found
		if (!dictionary.word) return api.sendMessage(Utils.textFormat('cmd', 'cmdDictionaryNotFound'), threadID, messageID);
		
		const word = await Utils.fancyFont.get(dictionary.word, 2);
		
		let definitions = '';
		// const examples = `● ${await Utils.fancyFont.get('examples:', 2)}\n${dictionary.examples.join(',\n')}`;
		
		for (const index in dictionary.definitions) {
		 	definitions += `${Utils.textFormat('cmd', 'cmdDictionaryDefFormat', dictionary.phonetic, dictionary.definitions[index], (dictionary.examples[index]) ? `\n● ${await Utils.fancyFont.get('examples:', 2)}\n${dictionary.examples[index]}` : '')}\n\n`;
		}
		// download pronunciation voicemail
		try {
			
			const path = `${Utils.ROOT_PATH}/cache/${(dictionary.audio || '').split('/').pop()}`;
			const voice = (await axios.get(`${dictionary.audio}`, { responseType: 'arraybuffer' })).data;
			fs.writeFileSync(path, Buffer.from(voice, 'utf-8'));
			
			return api.sendMessage(
				{
					body: Utils.textFormat('cmd', 'cmdDictionaryFormat', word, definitions ),
					attachment: fs.createReadStream(path)
				},
				threadID,
				() => {
					Utils.sendReaction.success(api, event);
					try { return fs.unlinkSync(path); } catch (e) {}
				},
				messageID
			);
			
		} catch (e) { 
			console.log(e);
			Utils.logModuleErrorToAdmin(e, __filename, threadID, senderID);
		}
		
		return api.sendMessage( Utils.textFormat('cmd', 'cmdDictionaryFormat', word, definitions ), threadID, () => Utils.sendReaction.success(api, event), messageID );
		
	}).catch(err => {
		console.log(err);
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(err, __filename, event);
	});
	
	/* DEPRECATED
	axios.get(encodedUrl).then(async (res) => {
		const data = res.data[0];
		// let example = data.meanings[0].definitions.example;
		
		const phonetics = data.phonetics;
		const meanings = data.meanings
		
		let msg_meanings = '';
		let msg_phonetics = '';
 
		phonetics.forEach(items => {
			const text = (items.text) ? `${items.text}`: '';
			msg_phonetics += `${text}`;
		});
		
		meanings.forEach(async (items) => {
			const example = (items.definitions[0].example) ? `(${items.definitions[0].example[0].toUpperCase() + items.definitions[0].example.slice(1)})` : '';
			const format = Utils.textFormat('cmd', 'cmdDictionaryDefFormat', items.partOfSpeech, `${items.definitions[0].definition[0].toUpperCase() + items.definitions[0].definition.slice(1)}`, example);
			const synonyms = (items.synonyms.length > 0) ? `● ${await Utils.fancyFont.get('synonyms', 1)}: ${items.synonyms.join(', ')}` : '';
			const antonyms = (items.antonyms.length > 0) ? `● ${await Utils.fancyFont.get('antonyms', 1)}: ${items.antonyms.join(', ')}` : '';
			msg_meanings += `${format}${(synonyms !== '') ? `\n${synonyms}` : ''}${(antonyms !== '') ? `\n${antonyms}` : ''}\n\n`;
		});
		
		const word = await Utils.fancyFont.get(data.word.charAt(0).toUpperCase() + data.word.slice(1), 2);
		const messageBody = {
			body: Utils.textFormat('cmd', 'cmdDictionaryFormat', word, data.phonetic || msg_phonetics, msg_meanings),
			//attachment
		};
		
		
		return api.sendMessage( messageBody, threadID, () => Utils.sendReaction.success(api, event), messageID );
		
    }).catch(err => {
		console.log(err)
		//if (err.response.status && err.response.status === 404) {
			Utils.sendReaction.failed(api, event);
			return api.sendMessage(Utils.textFormat('cmd', 'cmdDictionaryNotFound'), threadID, messageID);
		//}
	});
	*/
}