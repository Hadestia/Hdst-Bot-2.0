module.exports.config = {
	name: 'tweet',
	version: '1.0.2',
	hasPermssion: 0,
	credits: 'Joshua Sy',
	description: 'Generate fake tweet on Twitter with thousands of shares and likes.',
	commandCategory: 'edited_images',
	usages: '<text>',
	cooldowns: 10,
	dependencies: {
		'fs-extra': '',
		'canvas': '',
		'axios': '',
		'jimp': ''
	},
	envConfig: {
		requiredArgument: 1
	}
};

module.exports.run = async function({ api, event, args, Users, Utils }) {
	
	let {threadID, senderID, messageID} = event;
	const res = await Utils.getUserInfo(senderID); 
	const { loadImage, createCanvas } = require('canvas');
	const fs = require('fs-extra');
	const axios = require('axios')
	
	Utils.sendReaction.inprocess(api, event);
	
	let avatar = `${Utils.ROOT_PATH}/cache/tweet-avt${senderID}.png`;
	let pathImg = `${Utils.ROOT_PATH}/cache/tweet-${senderID}.png`;
	var text = args.join(' ');
	
	let getAvatar = (await axios.get(`https://graph.facebook.com/${senderID}/picture?width=1290&height=1290&access_token=${process.env.FB_ACCESS_TOKEN}`, { responseType: 'arraybuffer' })).data;
	let getTweet = (await axios.get(`https://i.imgur.com/V5cbRti.png`, { responseType: 'arraybuffer' })).data;
	
	fs.writeFileSync(avatar, Buffer.from(getAvatar, 'utf-8'));
	fs.writeFileSync(pathImg, Buffer.from(getTweet, 'utf-8'));
	
	let oms = await Utils.makeCircleImg(avatar);
	let image = await loadImage(oms);
	let baseImage = await loadImage(pathImg);
	let canvas = createCanvas(baseImage.width, baseImage.height);
	let ctx = canvas.getContext('2d');
	
	ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(image, 53, 35, 85, 85);
	ctx.font = '700 23px Arial';
	ctx.fillStyle = '#000000';
	ctx.textAlign = 'start';
	ctx.fillText(res.name, 160, 70);
    ctx.font = '400 16px Arial';
	ctx.fillStyle = '#BBC0C0';
	ctx.textAlign = 'start';
	ctx.fillText(`@${res.name}`, 153, 99);
	ctx.font = '400 45px Arial';
	ctx.fillStyle = '#000000';
	ctx.textAlign = 'start';
	
	let fontSize = 250;
	while (ctx.measureText(text).width > 2600) {
		fontSize--;
		ctx.font = `500 ${fontSize}px Arial`;
	}
	
	const lines = await Utils.wrapText(ctx, text, 850);
	let final_text = lines.join('\n');
	
	// Remove exceeding characters.
	final_text = final_text.length > 70 ? final_text.slice(0, 70 - 3) + '...' : final_text;
	
	ctx.fillText(final_text, 56, 180);
	ctx.beginPath();
	
	const imageBuffer = canvas.toBuffer();
	
	fs.writeFileSync(pathImg, imageBuffer);
	fs.removeSync(avatar);
	
	return api.sendMessage(
		{ attachment: fs.createReadStream(pathImg) },
		threadID,
		(e) => {
			fs.unlinkSync(pathImg);
			if (!e) {
				return Utils.sendReaction.success(api, event);
			}
			return Utils.sendReaction.failed(api, event);
		},
		messageID
	);
}