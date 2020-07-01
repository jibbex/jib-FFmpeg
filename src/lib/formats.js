const Formats = {
	video: ['mkv', 'avi', 'mp4', 'webm', 'mov', 'mpeg', 'ogg'],
	audio: ['mp3', 'ac3', 'weba', 'flac', 'wav']
};

const Codecs = {
	video: new Map(
		[
			['x265', 'libx265'], ['h264', 'libx264'], ['xvid', 'libxvid'],
			['vpx', 'libvpx'], ['vp9', 'libvpx-vp9'], ['mpeg4', 'mpeg4'],
			['mpeg1', 'mpeg1video'], ['mpeg2', 'mpeg2video'],
			['theora', 'libtheora']
		]
	),
	audio: new Map(
		[
			['fdk_aac', 'libfdk_aac'], ['f_aac', 'libfaac'], ['aac', 'aac'],
			['ac3', 'ac3'], ['flac', 'flac'], ['mp2', 'mp2'],
			['vorbis', 'libvorbis'], ['mp3', 'libmp3lame'],
			['wav', 'adpcm_ima_wav']
		]
	)
}

Map.prototype.getKeyVal = function(key) {
	if(this.has(key)) {
		return {[key]: this.get(key)};
	}
}

Map.prototype.getKeyVals = function() {
	const obj = {};

	this.forEach((val, key) => {
		obj[key] = val;
	});

	return obj;
}

function GetCodecs(format) {
	let _codecs = {};

	if(format[0] == '.') {
		format = format.substr(1);
	}

	if(Formats.video.findIndex(f => f == format) == -1
		&& Formats.audio.findIndex(f => f == format) == -1) {
			format = null;
	}

	switch(format) {
		case 'webm':
			_codecs = {
				video: Object.assign(Codecs.video.getKeyVal('vpx'), Codecs.video.getKeyVal('vp9')),
				audio: Codecs.audio.getKeyVal('vorbis')
			};
			break;
		case 'ogg':
			_codecs = {
				video: Object.assign(Codecs.video.getKeyVal('theora'), Codecs.audio.getKeyVal('flac')),
			 audio: Codecs.audio.getKeyVal('vorbis')
			};
			break;
		case 'mpeg':
			_codecs = {
				video: Object(Codecs.video.getKeyVal('mpeg1'), Codecs.video.getKeyVal('mpeg2')),
				audio: Object(Codecs.audio.getKeyVal('mp2'), Codecs.audio.getKeyVal('mp3'))
			};
			break;
		case 'mp3':
			_codecs = {audio: Codecs.audio.getKeyVal('mp3')};
			break;
		case 'ac3':
			_codecs = {audio: Codecs.audio.getKeyVal('ac3')};
			break;
		case 'flac':
			_codecs = {audio: Codecs.audio.getKeyVal('flac')};
			break;
		case 'mp3':
			_codecs = {audio: Codecs.audio.getKeyVal('mp3')};
			break;
		case 'weba':
			_codecs = {audio: Codecs.audio.getKeyVal('vorbis')};
			break;
		case 'wav':
			_codecs = {audio: Codecs.audio.getKeyVal('wav')};
			break;
		case null:
			_codecs = {video: {}, audio: {}};
			break;
		default:
			_codecs = {video: Codecs.video.getKeyVals(), audio: Codecs.audio.getKeyVals()};
			break;
	}

	return _codecs;
}

export {Formats as default, Formats, Codecs, GetCodecs}
