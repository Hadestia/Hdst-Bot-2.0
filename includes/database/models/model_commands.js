module.exports = function({ sequelize, Sequelize }) {
	let Commands = sequelize.define('Commands',
		{
			num: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			NAME: {
				type: Sequelize.STRING,
				unique: true
			},
      	  config: {
            	type: Sequelize.JSON
       	 },
			envConfig: {
            	type: Sequelize.JSON
       	 },
			userCooldowns: {
				type: Sequelize.JSON
			}
		}
	);

	return Commands;
}