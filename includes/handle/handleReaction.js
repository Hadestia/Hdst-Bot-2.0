module.exports = function({ api, models, Utils, Users, Threads, Banned }) {
	
    return function({ event }) {

        const { handleReaction, commands } = global.HADESTIA_BOT_CLIENT;

        const { messageID, threadID } = event;

        if (handleReaction.length !== 0) {

            const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);

            if (indexOfHandle < 0) return;

            const indexOfMessage = handleReaction[indexOfHandle];

            const handleNeedExec = commands.get(indexOfMessage.name);

            if (!handleNeedExec) return api.sendMessage(Utils.getText('handleReaction', 'missingValue'), threadID, messageID);

            try {

                const Obj = {};

                Obj.api = api;

                Obj.event = event;

                Obj.models = models;
                
                Obj.Utils = Utils;

                Obj.Users = Users;

				Obj.Banned = Banned;

                Obj.Threads = Threads;

                Obj.handleReaction = indexOfMessage;

                Obj.getText = Utils.getModuleText(handleNeedExec, event);

                handleNeedExec.handleReaction(Obj);

                return;

            } catch (error) {

                return api.sendMessage(Utils.getText('handleReaction', 'executeError', error), threadID, messageID);

            }

        }

    };

};