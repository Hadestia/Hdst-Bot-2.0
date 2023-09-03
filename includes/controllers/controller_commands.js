module.exports = function ({ models, api }) {
	const Commands = models.use('Commands');

	async function getAll(...data) {
		var where, attributes;
		for (const i of data) {
			if (typeof i != 'object') throw 'CMD-CONTROLLER(getAll) Needs Object Or Array';
			if (Array.isArray(i)) attributes = i;
			else where = i;
		}
		try { return (await Commands.findAll({ where, attributes })).map(e => e.get({ plain: true })); }
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
	
	async function getData(NAME) {
		try {
			const data = await Commands.findOne({ where: { NAME } });
			if (data) return data.get({ plain: true });
			else return false;
		}
		catch(error) {
			console.error(error);
			throw new Error(error);
		}
	}
	
	async function getUserCooldowns(NAME) {
		try {
			const data = await getData(NAME);
			if (data && data.userCooldowns) return data.userCooldowns;
			else return {};
		} catch(error) {
			
		}
	}

	async function setData(NAME, options = {}) {
		if (typeof options != 'object' && !Array.isArray(options)) throw 'CMD-CONTROLLER(setData) Needs Array';
		try {
			(await Commands.findOne({ where: { NAME } })).update(options);
			return true;
		}
		catch (error) {
			try {
				await createData(NAME, options);
			} catch (error) {
				console.error(error);
				throw new Error(error);
			}
		}
	}

	async function delData(NAME) {
		try {
			(await Commands.findOne({ where: { NAME } })).destroy();
			return true;
		}
		catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}

	async function createData(NAME, defaults = {}) {
		if (typeof defaults != 'object' && !Array.isArray(defaults)) throw 'CMD-CONTROLLER(createData) Needs Object';
		try {
			await Commands.findOrCreate({ where: { NAME }, defaults });
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
		setData,
		delData,
		createData,
		getUserCooldowns
	};
}