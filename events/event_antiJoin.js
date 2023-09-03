module.exports.config = {
	name: 'antijoin',
	eventType: ['log:subscribe'],
	version: '1.0.0',
	credits: 'Hadestia',
	description: 'prevent new members to join',
	envConfig: {
		needGroupData: true,
		allowBannedUser: true,
		allowBannedGroup: false
	}
};

module.exports.run = async function ({ event, api, Utils, Threads, Users }) {
	
	const threadData = await Threads.getData(event.threadID);
	const threadInfo = await Threads.getInfo(event.threadID);
	const data = threadData.data;
	
	// Ignore members added by group/bot admin.
	const referr_by_admin = await Utils.hasPermission(event.author, event.threadID, 3, threadInfo);
	if (referr_by_admin) return;

	const memJoin = event.logMessageData.addedParticipants || [];
	const isThisBot = memJoin.some(i => i.userFbId === Utils.BOT_ID);
	if (data.antijoin && !isThisBot) {
		
		if (threadInfo) {
			const bot_is_admin = threadInfo.adminIDs.find(e => e.id == api.getCurrentUserID());
			if (!bot_is_admin) {
				return api.sendMessage(
					Utils.textFormat('error', 'errOccured', 'Unable to perform "Anti Join Mode"\n● reason: Bot needs to be an admin.'),
					event.threadID
				);
			}
			
			// send a warning messages
			api.sendMessage(
				Utils.textFormat('error', 'errWarning', 'Anti-Join mode was active, all newly added members will be removed and welcome messages will be disable.'),
				event.threadID,
				async (err, info) => {
					Utils.autoUnsend(err, info);
					for (let user of memJoin) {
						api.removeUserFromGroup(
							user.userFbId,
							event.threadID,
							async function (err) {
								if (err) {
									return api.sendMessage(Utils.textFormat('group', 'groupAntiJoinError'), event.threadID, ()=>{});
								}
							}
						);
						await new Promise(resolve => setTimeout(resolve, 1000));
					}
				}
			);
			
		} else {
			return api.sendMessage(
				Utils.textFormat('error', 'errOccured', 'Unable to perform "Anti Join Mode"\n● reason: Unable to fetch group admin list.'),
				event.threadID
			);
		}
    }
}