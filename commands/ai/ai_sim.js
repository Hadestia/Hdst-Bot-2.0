module.exports.config = {
    name: 'sim',
    version: '4.3.7',
    hasPermssion: 0,
    credits: 'ProcodeMew', //change api sim : Hadestia
    description: 'Chat with simisimi or enable or disable auto sim.',
    commandCategory: 'artificial_intelligence',
    usages: '<message | on | off >',
    cooldowns: 5,
    envConfig: {
    	requiredArgument: 1
    },
    dependencies: {
        axios: ''
    }
}

const HDST_BOT_SIMISIMI = new Map;

async function simsimi(a, b, c) {
    const axios = require('axios');
	const uri = (a) => encodeURIComponent(a);
    try {
    	
        var { data } = await axios.get(`https://api.simsimi.net/v2/?text=${uri(a)}&lc=en&cf=false&name=Mei&key=C.IQHPE1cSfZFev-EhpwRbndXxcD9YGdTlbGReM`);
        return { error: !1, data };
        
    } catch (p) {
    	
        return { error: !0, data: {} }
        
    }
}

module.exports.handleEvent = async function ({ api, event, Utils }) {
	
    const { threadID, messageID, senderID, body } = event;
	const send = (text) => api.sendMessage(text, threadID, messageID);
	
    if (HDST_BOT_SIMISIMI.has(threadID)) {
    	
        if (senderID == Utils.BOT_ID || body == '' || messageID == HDST_BOT_SIMISIMI.get(threadID)) return;
        
        var { data, error } = await simsimi(body, api, event);
        return !0 == error ? void 0 : !1 == data.success ? send(data.error) : send(data.success)
    }
}

module.exports.run = async function ({ api, event, args, returns, Utils, Prefix }) {
	
    const { threadID, messageID } = event;
	const f = (text) => api.sendMessage(text, threadID, messageID);
	
	try {
		
		//const info = await Threads.getData(threadID);
		//const threadData = (info) ? info.data : {}
    
   	 if (args.length == 0) return returns.invalid_usage();
    
   	 switch (args[0].toLowerCase()) {
      	  case 'on':
          	  if (HDST_BOT_SIMISIMI.has(threadID)) {
					f(Utils.textFormat('error', 'errOccured', 'Sim was already been set.'));;
				} else {
					HDST_BOT_SIMISIMI.set(threadID, messageID);
					f(Utils.textFormat('success', 'successfulFormat', 'Sim has been turned on.\n\nNOTE:\nWhile being turned on, bot will respond to any messages in this thread and seems like a spam if this was a group chat.'));
				}
         	   break;
     	   case 'off':
        
         	   if (HDST_BOT_SIMISIMI.has(threadID)) {
					HDST_BOT_SIMISIMI.delete(threadID);
					f(Utils.textFormat('success', 'successfulFormat', 'Sim has been turned off.'));
				} else {
					f(Utils.textFormat('error', 'errOccured', 'Sim is not been set.'));
				}
          	  break;
      	  default:
           	 var { data, error } = await simsimi(args.join(' '), threadID, messageID);
           	 !0 == error ? void 0 : !1 == data.success ? f(data.error) : f(data.success);
          	  break; 
    	}
    } catch (err) {
    	console.log(err);
    	returns.remove_usercooldown();
		Utils.sendReaction.failed(api, event);
		Utils.logModuleErrorToAdmin(err, __filename, event);
		return api.sendMessage(Utils.textFormat('error', 'errCmdExceptionError', err, Prefix), threadID, messageID);
    }
};