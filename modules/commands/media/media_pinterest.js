module.exports.config = {
    name: 'pinterest',
    version: '2.0.2',
    hasPermssion: 0,
    credits: 'Hadestia',
    description: 'Search an image from pinterest.',
    commandCategory: 'media',
    usages: '<subject> - <amount>',
    cooldowns: 10,
    maxSearchCount: 20,
    dependencies: {
    	'fs-extra': '',
    	'axios': ''
    },
    envConfig: {
    	requiredArgument: 3,
    	inProcessReaction: true
    }
};

module.exports.run = async function({ api, event, args, Utils, Prefix }) {
	
	const { threadID, messageID, senderID } = event;
    const axios = require('axios');
    const fs = require('fs-extra');
    const keySearch = args.join(' ');

    if (!keySearch.includes('-')) {
        return api.sendMessage(Utils.textFormat('cmd', 'cmdPinterestInvalidFormat'), threadID, messageID);
    }
    
    const keySearchs = keySearch.substr(0, keySearch.indexOf('-'))
    let numberSearch = parseInt(keySearch.split('-').pop()) || 6;
    
    // return if number search is more than 30
    if (numberSearch > this.config.maxSearchCount) {
		return api.sendMessage(Utils.textFormat('cmd', 'cmdPinterestSearchExceed', this.config.maxSearchCount), event.threadID, event.messageID);
	}
	
	try {
		//global.sendReaction.inprocess(api, event);
    	const { data: response } = await axios.get(`${process.env.PINTEREST_SEARCHER}${encodeURI(keySearchs)}`);
    	const data = response.data;
		// add searching timeout
		const endTime = Date.now() + (6 * 1000);
	
    	let num = 0;
    	let hashMap = [];
   	 let imgData = [];
    
    	while (num < numberSearch && Date.now() < endTime) {
    	
    		const url = data[Math.floor(Math.random() * data.length)];
    		const filename = (url.split('/')).pop();
    		if (!hashMap.includes(filename)) {
    	
				num += 1;
    			hashMap.push(filename);
    
				let path = `${__dirname}/../../cache/${filename}`;
				let getDown = (await axios.get(`${url}`, { responseType: 'arraybuffer' })).data;
				
				Utils.logger(`CMD: PINTEREST: Downloaded ${url} for search ${keySearchs}`, 'cache');
				
				fs.writeFileSync(path, Buffer.from(getDown, 'utf-8'));
				imgData.push(fs.createReadStream(path));
			}
    	}
    
    	return api.sendMessage(
			{
				body: Utils.textFormat('cmd', 'cmdPinterestFormat', num, keySearchs),
        		attachment: imgData
			},
			threadID,
			(e, i) => {
				if (e) return;
				global.sendReaction.success(api, event);
				for (const file of hashMap) {
					Utils.logger(`CMD: PINTEREST: Deleting ${file} for search ${keySearchs}`, 'cache');
					try { fs.unlinkSync(`${__dirname}/../../cache/${file}`); } catch (e) {}
				}
			},
			messageID
		);
	} catch (e) {
		
		console.log(e);
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(e, __filename, event);
        api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', e, Prefix), threadID, messageID);
        
	}
};