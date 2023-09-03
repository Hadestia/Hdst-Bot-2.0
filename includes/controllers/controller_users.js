module.exports = function ({ models, api }) {
	const Users = models.use('Users');
	const axios = require('axios');
	
	async function getInfo(id) {
		// return new Promise(async function (resolve, reject) {
		return await api.getUserInfo(id).then((result) => {
			const user = result[id];
			return {
				id: id,
				name: user.name,
				firstname: user.firstName,
				username: user.vanity,
				url: user.profileUrl,
				gender: user.gender, // 1 = Female, 2 = Male
				profileUrl: encodeURI(`https://graph.facebook.com/${id}/picture?width=1290&height=1290&access_token=${process.env.FB_ACCESS_TOKEN}`)
			};
		}).catch(() => {
			return false;
		});
	}

	async function getNameUser(id) {
		try {
			const data = await getData(id) || {};
			return data.name || `@user${id}`;
		}
		catch (e) { return `@user${id}`; }
	}

	async function getAll(...data) {
		var where, attributes;
		for (const i of data) {
			if (typeof i != 'object') throw 'Needs Object or Array';
			if (Array.isArray(i)) attributes = i;
			else where = i;
		}
		try {
			return (await Users.findAll({ where, attributes })).map(e => e.get({ plain: true }));
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
	
	async function hasRecord(userID) {
		try {
			const data = await Users.findOne({ where: { userID } });
			return (data) ? true : false;
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function getData(userID) {
		try {
			const data = await Users.findOne({ where: { userID } });
			if (data) return data.get({ plain: true });
			else return false;
		}
		catch(error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function setData(userID, options = {}) {
		if (typeof options != 'object' && !Array.isArray(options)) throw 'Needs Object';
		try {
			(await Users.findOne({ where: { userID } })).update(options);
			return true;
		}
		catch (error) {
			try {
				await createData(userID, options);
			} catch (error) {
				console.error(error);
				throw new Error(error);
			}
		}
	}

	async function delData(userID) {
		try {
			(await Users.findOne({ where: { userID } })).destroy();
			return true;
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function createData(userID, defaults = {}) {
		if (typeof defaults != 'object' && !Array.isArray(defaults)) throw new Error('Needs Object');
		try {
			await Users.findOrCreate({ where: { userID }, defaults });
			return true;
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	return {
		getInfo,
		getNameUser,
		getAll,
		hasRecord,
		getData,
		setData,
		delData,
		createData
	};
};