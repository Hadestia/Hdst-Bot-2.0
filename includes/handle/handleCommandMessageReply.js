module.exports = function({ api, models, Utils, Users, Threads, Banned }) {
	
    return async function({ event, ignore_adminMessageReply }) {
    	
    	if (event.type !== 'message_reply') return;
    	
    	const { body, messageID, senderID, threadID, messageReply } = event;
    	
    	const { commands, handleReply, messageReplyRegistered } = global.HADESTIA_BOT_CLIENT;
    	
    	const { allowInbox } = global.HADESTIA_BOT_CONFIG;
    	
    	const bannedUserData = await Banned.getData(senderID);
    	
        const bannedGroupData = await Banned.getData(threadID);
        
        const groupData = await Threads.getData(threadID);
        
        const userData = await Users.getData(senderID);
    	
        const threadSetting = (groupData) ? groupData.data : {};
        
        const botPrefix = (threadSetting.hasOwnProperty('PREFIX')) ? threadSetting.PREFIX : global.HADESTIA_BOT_CONFIG.PREFIX;
        
        // do not track replies from command that has handleReply event && replies that has bot prefix
        if ((handleReply.findIndex(e => e.messageID == messageReply.messageID)) !== -1 || body.startsWith(botPrefix)) return;
		
        for (const mrReg of messageReplyRegistered) {

            const command = commands.get(mrReg);
            
            const config = command.config.envConfig || {};
            const gDataPass = (config.needGroupData) ? groupData && true : true;
			const uDataPass = (config.needUserData) ?  userData && true : true;
			
			if (gDataPass && uDataPass) {
            	try {
                	const Obj = {};

                	Obj.api = api;
                
                	Obj.event = event;

               	 Obj.models = models;
                
               	 Obj.Utils = Utils;

               	 Obj.Users = Users;
                
              	  Obj.Banned = Banned;

                	Obj.Threads = Threads;
					
               	 Obj.getText = Utils.getModuleText(command, event);
               
					Obj.ignore_adminMessageReply = ignore_adminMessageReply;

               	 if (command) command.handleMessageReply(Obj);
               
         	   } catch (error) {
					console.log(error);
               	 Utils.logger(Utils.getText('handleCommandEvent', 'moduleError', command.config.name, error), 'error');
           	 }
			}
        }
    }
}