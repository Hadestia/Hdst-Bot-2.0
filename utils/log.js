const chalk = require('chalk');
module.exports = (data, option) => {
	switch (option) {
		case "warn":
			console.log(chalk.bold.hex("#ffe000").bold('[ Warning ] » ') + chalk.hex("#ffe000")(data));
			break;
		case "error":
		  console.log(chalk.bold.hex("#ff0000").bold('[ Error ] » ') + chalk.hex("#ff0000")(data));
            break;
        case "cache":
            console.log(chalk.bold.hex('#c3ff00').bold('[ Cache ] » ') + chalk.hex('#c3ff00')(data));
            break;
        case "assets":
            console.log(chalk.bold.hex('#ffb400').bold('[ Assets ] » ') + chalk.hex('#ffb400')(data));
            break;
        case "economy":
        	console.log(chalk.bold.hex('#ffb400').bold('[ ECONOMY ] » ') + chalk.hex('#ffb400')(data));
        	break;
        case "hl":
            console.log(chalk.bold.hex('#ff00a3').bold('━━━━━ » ') + chalk.hex('#ff00a3')(data));
            break;
        case "database":
            console.log(chalk.bold.hex('#9050ff').bold('[ Database ] » ') + chalk.hex('#9050ff')(data));
            break;
		case "lateInit":
            console.log(chalk.bold.hex('#bcff7a').bold('[ Late-Init ] » ') + chalk.hex('#bcff7a')(data));
            break;
        default:			        
            console.log(chalk.bold.hex("#00ffff").bold(`${option} » `) + data);
			break;
	}
}

module.exports.loader = (data, option) => {
	switch (option) {
		case "warn":
			console.log(chalk.bold.hex("#ffe000").bold('[ Hadestia ] » ') + chalk.hex("#ffe000")(data));
			break;
		case "error":
			console.log(chalk.bold.hex("#ff0000").bold('[ Hadestia ] » ') + chalk.hex("#ff0000")(data));
			break;
		default:
			console.log(chalk.bold.hex("#00ffff").bold('[ Hadestia ] » ') + chalk.hex("#00ffff")(data));
			break;
	}
}