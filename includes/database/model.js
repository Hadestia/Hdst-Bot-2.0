module.exports = function (input) {
	
	try {
		const force = false;

		const Users = require('./models/model_users')(input);
		const Threads = require('./models/model_threads')(input);
		const Banned = require('./models/model_banned')(input);
		//const Commands = require('./models/model_commands')(input);
	
		Users.sync({ force });
		Threads.sync({ force });
		Banned.sync({ force });
		//Commands.sync({ force });
	
		return {
			model: {
				Users,
				Banned,
				Threads
			},
			use: function (modelName) {
				return this.model[`${modelName}`];
			}
		}
		
	} catch (e) {
		return console.error(__filename, e);
	}
}