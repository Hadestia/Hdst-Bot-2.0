module.exports.config = {
	name: 'play',
	version: '1.0.5',
	hasPermssion: 0,
	credits: 'Hadestia',
	commandCategory: 'media',
	description: 'Play a music from YouTube from the given title or YouTube link.',
	usages: '<music title or link>',
	replyUsages: '<number(index/position)>',
	cooldowns: 60,
	dependencies: {
		'fs-extra': '',
		'youtube-search-api': '',
		'ytdl-core': ''
	},
	envConfig: {
		requiredArgument: 1,
		maxDownloadSize: 8388608 // 8mb
	}
}

module.exports.handleReply = async function ({ api, event, returns, handleReply, Utils }) {
	
    const { body, threadID, messageID, senderID } = event;
    const { createReadStream, unlinkSync, statSync } = require('fs-extra');
    let selection = body.match(/\d+/g);
    
    if (!selection || Math.abs(parseInt(selection[0])) < 1 || Math.abs(parseInt(selection[0])) > (handleReply.results).length) return returns.invalid_reply_syntax();
    
    selection = Math.abs(parseInt(selection[0]));
    
    try {
    	const directory = `${__dirname}/../../cache/`;
        const path = `${directory}req_${senderID}`;
        await downloadMusic('https://www.youtube.com/watch?v=' + handleReply.results[selection - 1], path).then((data) => {
        	api.sendMessage(
				{ 
					body: Utils.textFormat('cmd', 'cmdPlayMusicSuccess', data.title),
					attachment: createReadStream(data.path)
				},
				threadID,
				(e) => {
					if (!e) {
						Utils.sendReaction.success(api, { messageID: handleReply.requestMsgID });
						Utils.sendReaction.success(api, event);
					}
					try { return unlinkSync(data.path) } catch (err) {}
				},
				handleReply.requestMsgID
			);
			returns.delete_data();
    	}).catch((err) => {
    		handleDownloadError(err, api, threadID, messageID, Utils);
    		Utils.sendReaction.failed(api, { messageID: handleReply.requestMsgID });
			Utils.sendReaction.failed(api, event);
    		return returns.delete_data();
    	});
    } catch (e) {
		console.log(e);
    	Utils.sendReaction.failed(api, { messageID: handleReply.requestMsgID });
		Utils.logModuleErrorToAdmin(e, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', e, global.HADESTIA_BOT_CONFIG.PREFIX), threadID, messageID);
    }
}

module.exports.run = async function ({ api, args, event, returns, Utils, Prefix }) {
	
	const { threadID, messageID, senderID } = event;
    const fs = require('fs-extra');
	
	const song = args.join(' ');
	const directory = `${__dirname}/../../cache/`;
	
	Utils.sendReaction.custom(api, event, '🔍');
	// handle search via link
	if (song.indexOf('https://') !== -1) {
		try {
			const path = `${directory}req_${senderID}`;
			await downloadMusic(song, path).then((data) => {
				return api.sendMessage(
					{ 
						body: Utils.textFormat('cmd', 'cmdPlayMusicSuccess', data.title),
						attachment: fs.createReadStream(data.path)
					},
					threadID,
					(e) => {
						if (!e) {
							Utils.sendReaction.success(api, event);
							return fs.unlinkSync(data.path);
						}
					},
					messageID
				);
			}).catch((err) => {
				handleDownloadError(err, api, threadID, messageID, Utils);
				Utils.sendReaction.failed(api, event);
				returns.remove_usercooldown();
			});
					
		} catch (err_link_req) {
			console.log(err_link_req);
			Utils.sendReaction.success(api, event);
			Utils.sendRequestError(err_link_req, event, Prefix);
			return Utils.logModuleErrorToAdmin(err_link_req, __filename, event);
		}
		return;
	}
			
	// handle via search manually
	try {
		const link = [];
		let msg = '', num = 0;

		const Youtube = require('youtube-search-api');
		const data = (await Youtube.GetListByKeyword(song, false, 6)).items;
				
		for (const value of data) {
			link.push(value.id);
			num += 1;
			msg += `${Utils.textFormat('cmd', 'cmdPlayMusicSearchResultItemFormat', num, value.title)}\n`;
		}
				
		const messageBody = Utils.textFormat('cmd', 'cmdPlayMusicSearchResultFormat', msg);
				
		return api.sendMessage(
			messageBody,
			threadID,
			(e, info) => {
				if (e) return Utils.sendRequestError(e, event, Prefix);
				Utils.sendReaction.inprocess(api, event);
				Utils.autoUnsend(e, info, 120);
				global.HADESTIA_BOT_CLIENT.handleReply.push({
					name: this.config.name,
					messageID: info.messageID,
					requestMsgID: messageID,
					author: senderID,
					results: link,
				});
			},
			messageID
		);
	} catch (api_second_error_manual_search) {
		console.log(api_second_error_manual_search)
		Utils.sendReaction.failed(api, event);
		Utils.sendRequestError(api_second_error_manual_search, event, Prefix)
		return Utils.logModuleErrorToAdmin(api_second_error_manual_search, __filename, event);
	}
}

function handleDownloadError(err, api, threadID, messageID, Utils) {
	
	const send = (e) => {
		api.sendMessage(Utils.textFormat('error', 'errOccured', e), threadID, messageID);
	}
	
	if (err == 'oversize-file') {
		send(Utils.textFormat('cmd', 'cmdPlayMusicFileWasBig', 8));
	} else if (err == 'no-videoid') {
		send('No video ID found on the request.');
	} else if (err == 'invalid-url') {
		send('Invalid YouTube link URL.');
	} else if (err == 'live-stream') {
		send('Cannot process "LIVE" video.');
	} else if (err == 'long-music') {
		send('Cannot process music longer than 12 minutes.');
	} else {
		send(err);
	}
	return;
}

async function downloadMusic(link, path) {

	const fs = require('fs-extra');
	const ytdl = require('ytdl-core');
	
	return new Promise(async function (resolve, reject) {
		let videoID;
		try {
			if (!ytdl.validateURL(link)) {
				reject('invalid-url');
			}
			
			videoID = ytdl.getURLVideoID(link);
			
			if (!videoID) {
				reject('no-videoid');
			}
		} catch (err) {
			reject(err);
		}
		await ytdl.getInfo(videoID).then(async (info) => {
				
			if (info.live_playback) {
				reject('live-stream');
			}
			
			if (Number(info.videoDetails.lengthSeconds) > 720) {
				reject('long-music');
			}
				
			const final_path = `${path}${videoID}.mp3`;
			const stream = await ytdl.downloadFromInfo(info, { quality: 'lowestaudio' }).pipe(fs.createWriteStream(final_path));
				
			stream.on('close', function () {
				let result = {
					title: info.videoDetails.title,
					dur: Number(info.videoDetails.lengthSeconds),
					viewCount: info.videoDetails.viewCount,
					likes: info.videoDetails.likes,
					author: info.videoDetails.author.name,
					path: final_path
				}
				resolve(result);
			});
				
			stream.on('error', function (err) {
				reject(err);
			});
				
		}).catch((err) => {
			reject(err);
		});
	});
}