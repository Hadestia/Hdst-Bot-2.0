module.exports = function ({ models, api }) {
	const Banned = models.use('Banned');

	async function getAll(...data) {
		var where, attributes;
		for (const i of data) {
			if (typeof i != 'object') throw 'Needs Object or Array';
			if (Array.isArray(i)) attributes = i;
			else where = i;
		}
		try {
			return (await Banned.findAll({ where, attributes })).map(e => e.get({ plain: true }));
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
	
	// Checks whether the given id has a ban record
	async function hasRecord(ID) {
		try {
			const data = await Banned.findOne({ where: { ID } });
			return (data) ? true : false;
		} catch (error) {
			 console.log(error);
		}
	}

	async function getData(ID) {
		try {
			const data = await Banned.findOne({ where: { ID } });
			if (data) return data.get({ plain: true });
			else return false;
		}
		catch(error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function setData(ID, options = {}) {
		if (typeof options != 'object' && !Array.isArray(options)) throw 'Needs Object';
		try {
			(await Banned.findOne({ where: { ID } })).update(options);
			return true;
		}
		catch (error) {
			try {
				await createData(ID, options);
			} catch (error) {
				console.error(error);
				throw new Error(error);
			}
		}
	}

	async function delData(ID) {
		try {
			(await Banned.findOne({ where: { ID } })).destroy();
			return true;
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function createData(ID, defaults = {}) {
		if (typeof defaults != 'object' && !Array.isArray(defaults)) throw 'Needs Object';
		try {
			await Banned.findOrCreate({ where: { ID }, defaults });
			//console.log(`Created Ban DB for id ${ID}`);
			return true;
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	return {
		getAll,
		getData,
		hasRecord,
		setData,
		delData,
		createData
	};
};