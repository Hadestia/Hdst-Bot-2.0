module.exports.config = {
	name: 'bot-info',
	version: '1.0.0',
	hasPermssion: 0,
	description: 'View bot information.',
	commandCategory: 'information',
	credits: 'Hadestia, Uptime by Mirai Team',
	usages: '',
	aliases: [ 'info', 'bot', 'upt' ],
	cooldowns: 10,
	dependencies: {
		'pidusage': '',
		'fs-extra': '',
		'axios': ''
	},
	envConfig: {
		inProcessReaction: true
	}
}

function byte2mb(bytes) {
	const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let l = 0, n = parseInt(bytes, 10) || 0;
	while (n >= 1024 && ++l) n = n / 1024;
	return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

module.exports.run = async function ({ api, args, event, Utils }) {

    const axios = require('axios')
	const pidusage = await require("pidusage")(process.pid);
	const path = `${Utils.ROOT_PATH}/cache/tad/`;
	const timeStart = Date.now();
	const fs = require('fs-extra');
	
	const time = process.uptime(),
		hours = Math.floor(time / (60 * 60)),
		minutes = Math.floor((time % (60 * 60)) / 60),
		seconds = Math.floor(time % 60);
		
	var z_1 = (hours < 10) ? '0' + hours : hours;
    var x_1 = (minutes < 10) ? '0' + minutes : minutes;
    var y_1 = (seconds < 10) ? '0' + seconds : seconds;

	
	if (!fs.existsSync(`${path}UTM-Avo.ttf`)) {
    	let getfont = (await axios.get(`https://github.com/hanakuUwU/font/raw/main/phenomicon.ttf`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(`${path}UTM-Avo.ttf`, Buffer.from(getfont, "utf-8"));
	}
	
	if (!fs.existsSync(`${path}phenomicon.ttf`)) {
		let getfont2 = (await axios.get(`https://github.com/hanakuUwU/font/raw/main/phenomicon.ttf`, { responseType: "arraybuffer" })).data;
		fs.writeFileSync(`${path}phenomicon.ttf`, Buffer.from(getfont2, "utf-8"));
    };

	if (!fs.existsSync(`${path}CaviarDreams.ttf`)) {
		let getfont3 = (await axios.get(`https://github.com/hanakuUwU/font/raw/main/CaviarDreams.ttf`, { responseType: "arraybuffer" })).data;
		fs.writeFileSync(`${path}CaviarDreams.ttf`, Buffer.from(getfont3, "utf-8"));
    };
    
	const { loadImage, createCanvas, registerFont } = require("canvas");
  
	let k = args[0];
	
	if(args[0] == "list"){
    	const alime = (await axios.get('https://run.mocky.io/v3/6aa59c3e-ff9f-41cd-8611-07a1b870042d')).data
		var count = alime.listAnime.length;
		var data = alime.listAnime
		var page = 1;

		page = parseInt(args[1]) || 1;
		page < -1 ? page = 1 : "";

		var limit = 20;
		var numPage = Math.ceil(count/limit);
		var msg = ``;
		
		for(var i = limit*(page - 1); i < limit*(page-1) + limit; i++){
			if (i >= count) break;
			msg += `[ ${i+1} ] - ${data[i].ID} | ${data[i].name}\n`;
		}
		
		msg += `Have (${page}/${numPage})\nUse ${global.HADESTIA_BOT_CONFIG.PREFIX}${this.config.name} list <page number>`;
		return api.sendMessage(msg, event.threadID,event.messageID);
	}
	
	let id = Math.floor(Math.random() * 848) +1
	if (k) {
		if (parseInt(k)) {
			id = (parseInt(k) <= 0 || parseInt(k) > 848) ? id : parseInt(k);
		}
	}
	
    const lengthchar = (await axios.get('https://run.mocky.io/v3/0dcc2ccb-b5bd-45e7-ab57-5dbf9db17864')).data
    
	const Canvas = require('canvas');
    let pathImg = `${path}avatar_1111231.png`;
    let pathAva = `${path}avatar_3dsc11.png`;
    let background = (await axios.get(encodeURI(`https://imgur.com/x5JpRYu.png`), { responseType: "arraybuffer" })).data;
    
    fs.writeFileSync(pathImg, Buffer.from(background, "utf-8"));
    let ava = (await axios.get(encodeURI(`${lengthchar[id - 1].imgAnime}`), { responseType: "arraybuffer" })).data;
    
    fs.writeFileSync(pathAva, Buffer.from(ava, "utf-8"));
    
    /*const request = require('request');
    const rpath = require('path');*/

	//const a = Math.floor(Math.random() * 820) + 1
  
	let l1 = await loadImage(pathAva);
    let a = await loadImage(pathImg);
    let canvas = createCanvas(a.width, a.height);
    var ctx = canvas.getContext("2d");
    
    ctx.fillStyle = lengthchar[id - 1].colorBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(l1, -200, -200, 1200, 1200);
    ctx.drawImage(a, 0, 0, canvas.width, canvas.height);
		registerFont(`${path}phenomicon.ttf`, {
		family: "phenomicon"
    });
    
    ctx.textAlign = "start";
    ctx.strokeStyle = lengthchar[id - 1].colorBg;
    ctx.filter = "brightness(90%) contrast(110%)";
    ctx.font = "130px phenomicon";
    ctx.fillStyle = lengthchar[id].colorBg;
    ctx.fillText(global.HADESTIA_BOT_CONFIG.BOTNAME, 900, 340);
    ctx.beginPath();
    
	////////////////////////////////////////
	registerFont(`${path}UTM-Avo.ttf`, { family: "UTM" });
    ctx.textAlign = "start";
    ctx.font = "70px UTM";
    ctx.fillStyle = "#000000";
    ctx.fillText(`${z_1} : ${x_1} : ${y_1} `, 920, 440);
    ctx.restore();
    ctx.save();
    
	registerFont(`${path}CaviarDreams.ttf`, { family: "time" });
	
    ctx.textAlign = "start";
    ctx.font = "45px time";
    ctx.fillText("@" + "Christian R.", 930, 540)
    ctx.fillText("@" + "Hadestia", 930, 610)
    ctx.fillText("@" + "Christian R.", 930, 690)
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    
    const imageBuffer = canvas.toBuffer();
	fs.writeFileSync(pathImg, imageBuffer);
	
	///////////////////////////////////////
	
	let adminCopy = [];
	let adminMessageBody = '';
	
	for (const admin of global.HADESTIA_BOT_CONFIG.ADMINBOT) {
		adminCopy.push(admin);
	}
	
	const owner = await Utils.getUserInfo(adminCopy.shift());
	
	
	for (const admin of adminCopy) {
		await api.getUserInfo(admin).then((result) => {
			const info = result[admin];
			adminMessageBody += `● ${info.name}\n`;
			adminMessageBody += `https://facebook.com/${info.vanity}\n\n`;
		}).catch(err => {});
	}
	
	// Count Total Number of Users and Groups
	let allUser = 0, allGroup = 0;
	global.HADESTIA_BOT_DATA.allUserID.forEach(function () { allUser += 1; });
	global.HADESTIA_BOT_DATA.allThreadID.forEach(function () { allGroup += 1; });
	
	const b_info = Utils.textFormat('system', 'botInfo', owner.name || 'Ian', `https://facebook.com/${owner.username}`, adminMessageBody);
	const b_upt = Utils.textFormat('system', 'botUptime', (Date.now() - timeStart), allUser, allGroup, pidusage.cpu.toFixed(1), byte2mb(pidusage.memory), id, hours, (minutes > 1) ? `${minutes} minutes` : `${minutes} minute`, (seconds > 0) ? `${seconds} seconds` : `${seconds} second`);
	
	const messageBody = {
		body: `${b_info}\n${b_upt}`,
		attachment: fs.createReadStream(pathImg)
	}
	
	return api.sendMessage(
		messageBody,
		event.threadID,
    	() => {
    		Utils.sendReaction.success(api, event)
			fs.unlinkSync(pathImg)
    		fs.unlinkSync(pathAva)
    	},
    	event.messageID
	);
}