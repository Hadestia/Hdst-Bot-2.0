module.exports.config = {
	name: 'find-lyrics',
	description: 'Try to find the lyrics of your favorite songs.',
	commandCategory: 'tools',
	version: '1.0.0',
	hasPermssion: 0,
	usages: '<title>',
	cooldowns: 60,
	credits: 'Hadestia',
	envConfig: {
		requiredArgument: 1
	},
	dependencies: {
		'genius-lyrics': ''
	}
}

module.exports.run = async function ({ api, args, event, Utils }) {
	
	try {
		const Genius = require('genius-lyrics');
		const Client = new Genius.Client(process.env.GENIUS_LYRICS_AT);
		
		const searches = await Client.songs.search(args.join(' '));

		// Pick first one
		const firstSong = searches[0];
		// Ok lets get the lyrics
		const lyrics = await firstSong.lyrics();
		
		const title = await Utils.fancyFont.get(firstSong.fullTitle, 1);
		api.sendMessage(
			Utils.textFormat('cmd', 'cmdGetLyricsFormat', title, lyrics),
			event.threadID,
			(e) => {

			},
			event.messageID
		);
	} catch (err) {
		Utils.sendReaction.failed(api, event);
		console.log(err);
	}
}