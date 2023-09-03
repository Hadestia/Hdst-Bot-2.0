module.exports = function({ sequelize, Sequelize }) {
	let Threads = sequelize.define('Threads',
		{
			num: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			threadID: {
				type: Sequelize.BIGINT,
				unique: true
			},
      	  threadInfo: {
            	type: Sequelize.JSON
       	 },
			data: {
				type: Sequelize.JSON
			},
			economy: {
				type: Sequelize.JSON
			},
			inventory: {
				type: Sequelize.JSON
			},
			afk: {
				type: Sequelize.JSON
			}
		}
	);

	return Threads;
}