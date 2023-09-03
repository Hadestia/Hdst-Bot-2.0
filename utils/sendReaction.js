const textFormat = require('./textFormat.js');

function callback (err) {
	(err) ? logger('unable to setMessageReaction for message', '[ Reactions ]') : '';
	return;
}

function inprocess (api, event) {
	api.setMessageReaction(textFormat('reaction', 'inProcess'), event.messageID, callback, !![]);
}

function success (api, event) {
	api.setMessageReaction(textFormat('reaction', 'execSuccess'), event.messageID, callback, !![]);
}

function failed (api, event) {
	api.setMessageReaction(textFormat('reaction', 'execFailed'), event.messageID, callback, !![]);
}

function custom (api, event, emoji) {
	api.setMessageReaction(emoji, event.messageID, callback, !![]);
}

function cooldown (api, event) {
	api.setMessageReaction(textFormat('reaction', 'userCmdCooldown'), event.messageID, callback, !![]);
}

module.exports = {
	inprocess,
	cooldown,
	success,
	failed,
	custom
}