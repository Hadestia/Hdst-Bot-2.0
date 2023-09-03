//////////////// TEXT TO FONT BY HADESTIA ////////////////

const textFormat = require('./textFormat.js');
const reference = require('../json/textFormat.json');

const UPPERCASE = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ];
const LOWERCASE = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z' ];

function replaceEachChar(text, dataUpper, dataLower, dataNumber) {
	
	let fonted = '';
	text = text.normalize('NFKD');
	
	while (fonted.length < text.length) {
		
		for (let i = 0; i < text.length; i++) {
			
			// if character is a special character or other language char
			if (!text[i].match(/^[A-Za-z0-9]*$/)) {
				fonted += text[i];
			} else {
				// if number
				if (text[i].match(/[0-9]/)) {
			
					// if data number has values
					if (dataNumber) {
					
						for (const n_i in dataNumber) {
							if (n_i == parseInt(text[i])) {
								fonted += dataNumber[n_i];
							}
						}
				
					// else return normal number
					} else {
						fonted += text[i];
					}
	
				} else {
					// if uppercase
					if (text[i] == text[i].toUpperCase()) {
						for (const upper_i in UPPERCASE) {
							if (text[i] == UPPERCASE[upper_i]){
							fonted += dataUpper[upper_i];
							}
						}
					// if lowercase
					} else if (text[i] == text[i].toLowerCase()) {
						for (const lower_i in LOWERCASE) {
							if (text[i] == LOWERCASE[lower_i]){
								fonted += dataLower[lower_i]
							}
						}
					} else {
						fonted += text[i];
					} 
				}
			}
		}
	}
	
	return fonted;
}

module.exports.get = async function (text, style) {
	const styleNum = parseInt(style) || 0;
	
	if (styleNum == 1 || style == 'bold-sans') {
		return replaceEachChar(
			text,
			reference.fonts.bold_sans_caps,
			reference.fonts.bold_sans_small,
			reference.fonts.bold_sans_number
		);
	} else if (styleNum == 2 || style == 'bold-sans-italic') {
		return replaceEachChar(
			text,
			reference.fonts.bold_sans_italic_caps,
			reference.fonts.bold_sans_italic_small,
			reference.fonts.bold_sans_number
		);
	} else if (styleNum == 3 || style == 'bold-serif') {
		return replaceEachChar(
			text,
			reference.fonts.bold_serif_caps,
			reference.fonts.bold_serif_small,
			reference.fonts.bold_serif_number
		);
	} else if (styleNum == 4 || style == 'bold-serif-italic') {
		return replaceEachChar(
			text,
			reference.fonts.bold_serif_italic_caps,
			reference.fonts.bold_serif_italic_small,
			reference.fonts.bold_serif_number
		);
	} else if (styleNum == 5 || style == 'bold-medieval') {
		return replaceEachChar(
			text,
			reference.fonts.bold_medieval_caps,
			reference.fonts.bold_medieval_small,
			reference.fonts.bold_medieval_number
		);
	} else if (styleNum == 6 || style == 'thin-font1') {
		return replaceEachChar(
			text,
			reference.fonts.thin_font_1_caps,
			reference.fonts.thin_font_1_small,
			reference.fonts.thin_font_1_number
		);
	} else {
		return textFormat('cmd', 'cmdFontNotFoundFont');
    }
}