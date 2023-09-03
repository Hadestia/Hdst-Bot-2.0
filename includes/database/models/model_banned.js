module.exports = function({ sequelize, Sequelize }) {
	let Banned = sequelize.define('Banned', {
		num: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		ID: {
			type: Sequelize.BIGINT,
			unique: true
		},
		data: {
			type: Sequelize.JSON 
		}
	});

	return Banned;
}