module.exports = function (group, key, ...values) {
    const logger = require('./log.js');
	var reference = require('../json/textFormat.json');
	
	if (!group || !key) {
		logger(`textFormat.js cannot fetch ${group} & ${key}`, 'error');
	}
    
	var lang = reference[group][key] || 'null';
	
	if (lang == 'null') {
    	logger(`${group}.${key} has no such key exist from reference`, 'error');
        return null;
	}
    
    if (values.length > 0) {
		for (var i = 0; i < values.length; i++) {
            const index = i + 1;
    		const expReg = RegExp('%' + index, 'g');
       	 lang = lang.replace(expReg, values[i]);
		}
	}
	
	return lang;
};