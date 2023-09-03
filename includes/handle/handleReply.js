module.exports = function({ api, models, Utils, Users, Threads, Banned }) {

    return async function({ event }) {

        if (!event.messageReply) { return; }
		
		const timeNow = Date.now();
        const { handleReply, commands } = global.HADESTIA_BOT_CLIENT
        const { messageID, threadID, messageReply } = event;
        
        const threadData = await Threads.getData(threadID);
        const threadSetting = (threadData) ? threadData.data : {};
        
        const botPrefix = (threadSetting.hasOwnProperty('PREFIX')) ? threadSetting.PREFIX : global.HADESTIA_BOT_CONFIG.PREFIX;

        if (handleReply.length !== 0) {
        	
            const indexOfHandle = handleReply.findIndex(e => e.messageID == messageReply.messageID);

            if (indexOfHandle < 0) { return; }
            
            const indexOfMessage = handleReply[indexOfHandle];
            const handleNeedExec = commands.get(indexOfMessage.name);
            
			const deleteData = async () => {
				try { api.unsendMessage(indexOfMessage.messageID); } catch (e) {};
				return await global.HADESTIA_BOT_CLIENT.handleReply.splice(indexOfHandle, 1);
			}
            
            if (event.senderID !== indexOfMessage.author) return api.sendMessage(Utils.textFormat('error', 'errCommandReplyInteractionFailed'), threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);

            if (!handleNeedExec) return api.sendMessage(Utils.getText('handleReply', 'missingValue'), threadID, messageID);
			
			if (indexOfMessage.timeout && indexOfMessage.timeout < timeNow) {
				deleteData();
				api.sendMessage(Utils.textFormat('error', 'errCommandReplyInteractionTimeout'), threadID, (err, info) => { Utils.autoUnsend(err, info, 5) }, messageID);
				return;
			}
			
            try {
            	
                //// command returns
                const returns = {};
                
                returns.invalid_reply_syntax = function () {
                	api.sendMessage(Utils.textFormat('error', 'errCmdReplyInvalidSyntax', botPrefix, indexOfMessage.name), threadID);
                }
                // other user interaction failed
                returns.interaction_failed_other = function () {
                	api.sendMessage(Utils.textFormat('error', 'errCommandReplyInteractionFailed'), threadID, (err, info) => { Utils.autoUnsend(err, info, 20) }, messageID);
                }
                
                returns.delete_data = deleteData;

                const Obj = {};

                Obj.api = api;

                Obj.event = event;

                Obj.models = models;
                
                Obj.Utils = Utils;

                Obj.Users = Users;
                
                Obj.Banned = Banned;

                Obj.Threads = Threads;
                
                Obj.Prefix = botPrefix;

                Obj.handleReply = indexOfMessage;

				Obj.returns = returns;
				
				Obj.getText = Utils.getModuleText(handleNeedExec, event);

                handleNeedExec.handleReply(Obj);
                
                return;
                
            } catch (error) {
                return api.sendMessage(Utils.getText('handleReply', 'executeError', error), threadID, messageID);
            }
        }
    };
}