module.exports.config = {
	name: 'groupUpdate',
	eventType: ['log:thread-admins','log:thread-name', 'log:user-nickname','log:thread-icon','log:thread-color'],
	version: '1.0.1',
	credits: 'Mirai Team',
	description: 'Update team information quickly',
	envConfig: {
		needGroupData: true
	}
};

module.exports.run = async function ({ event, api, Utils, Threads, Users }) {
	
    const { threadID, logMessageType, logMessageData } = event;

	const threadData = await Threads.getData(threadID);
    const data = threadData.data;
    
    //if (!data.adminUpdate) return;

    try {
    	
        let dataThread = threadData.threadInfo;
        
        switch (logMessageType) {
        	
            case 'log:thread-admins':
            	
            	const user = await Users.getNameUser(logMessageData.TARGET_ID);
            
            	if (logMessageData.ADMIN_EVENT == 'add_admin') {
                	
                    dataThread.adminIDs.push({ id: logMessageData.TARGET_ID })
						
					api.sendMessage(
						Utils.textFormat('group', 'groupGroupUpdatePromote', user || logMessageData.TARGET_ID),
						threadID,
					);
                    
                } else if (logMessageData.ADMIN_EVENT == 'remove_admin') {
                	
                    dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id != logMessageData.TARGET_ID);
                    
					api.sendMessage(
						Utils.textFormat('group', 'groupGroupUpdateDemote', user || logMessageData.TARGET_ID),
						threadID,
                    );
                }
                break;

            case 'log:thread-name':
            	// Group name DB update happens in event_botLogs to log group name change to admin
                const name = event.logMessageData.name || 'No name';
				api.sendMessage(
					Utils.textFormat('group', 'groupGroupUpdateGroupName', name),
					threadID
                );
                break;
                
        }
        await Threads.setData(threadID, { threadInfo: dataThread });
        
    } catch (e) { console.log(e) };
}