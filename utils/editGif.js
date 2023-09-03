const { createCanvas, loadImage, createImageData, registerFont } = require('canvas');
const gifEncoder = require('gif-encoder-2');
const gifDecoder = require('decode-gif');
const fs = require('fs-extra');
const jimp = require('jimp');

/**
 * Renders a new GIF after manipulating every frame using node-canvas: BY HADESTIA
 * @param baseGif The file path to or a buffer of the original GIF
 * @param editFrameFunc The function to run for every frame
 * @param options The options will be passed for new GIF creation
 * @returns buffer
 */
module.exports.edit = function (baseGif, options, editFrameFunc, callback) {
	
	if (!editFrameFunc) {
		throw new Error('No such edit function to call on for each frame'); 
	}
	options = options || {};
	try {
		const bufferToEdit = (typeof(baseGif) === 'string') ? fs.readFileSync(baseGif) : baseGif;
		// returns: { width, height, frames[] }
		const decodedGif = gifDecoder(bufferToEdit);
		// get the response what to archive from options
		const algo = (options.algorithm) ? (options.algorithm).toLowerCase() : '';
		const resAlgo = (algo == 'nuequant' ) ? algo : (algo == 'octree') ? algo : '';
		// canvas sizes
		const c_width = (options.canvasW) ? options.canvasW : decodedGif.width;
		const c_height = (options.canvasH) ? options.canvasH : decodedGif.height;
		
		// registerFont
		if (options.registerFont && typeof(options.registerFont) == 'object') {
			for (const font of options.registerFont) {
				registerFont(font.path || font.location, { family: font.family });
			}
				
		}
		
		// start new Gif
		const encodeNewGif = new gifEncoder(c_width, c_height, (resAlgo != '') ? resAlgo : 'neuquant' );
	
		// pass options
		//encodeNewGif.on('readable', () => encodeNewGif.read());
		encodeNewGif.start();
		encodeNewGif.setDelay(options.delay || 10);
		encodeNewGif.setRepeat(options.repeat || 0);
		encodeNewGif.setFrameRate(options.fps || 30);
		encodeNewGif.setQuality(options.quality || 10);
		
		const aspect = decodedGif.width / decodedGif.height;
		const imageH = c_width / aspect;
	
		// loop through the frames
		(decodedGif.frames).forEach(async function (frame, i) {
			let processedData;
			if ((options.gifCropAtX || options.gifCropAtY) && (options.gifGetPartW || options.gifGetPartH)) {
				// render single gif frame to a canvas
				
				const rawCanvas = createCanvas(decodedGif.width, decodedGif.height);
				const ctxRaw = rawCanvas.getContext('2d');
				
				const rawFrame = createImageData(frame.data, decodedGif.width, decodedGif.height);
				ctxRaw.putImageData(rawFrame, 0, 0);
			
				// get image data if want to crop or what
				processedData = ctxRaw.getImageData(
					options.gifCropAtX || 0,
					options.gifCropAtY || 0,
					options.gifGetPartW || decodedGif.width,
					options.gifGetPartH || decodedGif.height
				);
			}
			
			// create new canvas as final canvas for this gif frame
			const canvas = createCanvas(c_width, c_height);
			const ctx = canvas.getContext('2d');
			
			// put the processed data to the final frame canvas
			const data = createImageData(frame.data, canvas.width, canvas.height);
			ctx.putImageData(processedData || data, 0, 0);
			// call user edit function
			editFrameFunc(ctx, c_width, c_height, (decodedGif.frames).length, i + 1, encodeNewGif);
			encodeNewGif.addFrame(ctx);
		});
	
		encodeNewGif.finish();
		const result = encodeNewGif.out.getData();
		return (callback) ? callback(null, result) : result;
	} catch (error) {
		if (callback) callback(error);
		throw new Error(error);
	}
}