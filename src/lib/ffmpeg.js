import path from 'path';
import fs from 'fs';
import util from 'util';
import os from 'os';
import {exec, spawn} from 'child_process';

const execAsync = util.promisify(exec);

class FFmpeg {
	constructor() {
		this._path = null;
		this._on = new Object();
	}

	get ffmpegPath() {
		return this._path;
	}

	set ffmpegPath(dir) {
		this._path = dir;
	}

	getBin(bin) {
		return this._path ? path.join(this._path + '/' + bin) : bin;
	}

	hwaccels() {
		return new Promise((resolve, reject) => {
			const proc = spawn(this.getBin('ffmpeg'), ['-hwaccels']);
			proc.stdout.on('data', data => {
				resolve(FFmpeg.parseStdOut(data.toString(), 'hwaccels'));
				return;
			});

			proc.on('error', data => {
				console.error(data.toString());
				reject(data);
			})
		});
	}

	on(event, callback) {
		this._on[event] = callback;
	}

	async decoders() {
		try {
			const proc = await execAsync(`${this.getBin('ffmpeg')} -decoders`);
			return FFmpeg.parseStdOut(proc.stdout, 'coder');
		}
		catch(error) {
			throw error;
		}
	}

	async encoders() {
		try {
			const proc = await execAsync(`${this.getBin('ffmpeg')} -encoders`);
			return FFmpeg.parseStdOut(proc.stdout, 'coder');
		}
		catch(error) {
			throw error;
		}
	}

	async encode(task) {
		try {
			return new Promise((resolve, reject) => {
				const opts = task.options;
				const container = FFmpeg.getFormat(opts.container);
				const args = [];

				let iv = 0;
				let ia = 0;
				let index = 0;
				let duration = parseInt(task.format.duration);

				if(opts.acceleration && opts.acceleration !== 'no-hw') {
					args.push(`-hwaccel ${opts.acceleration}`);
				}

				args.push(`-i "${task.format.filepath}"`);
				args.push(`-strict experimental`);
				args.push(`-f ${container}`);

				if(opts.time_range) {
					duration = opts.time_range[1] - opts.time_range[0];
					args.push(`-ss ${opts.time_range[0]}`);
					args.push(`-to ${opts.time_range[1]}`);
				}
				else {
					args.push('-ss 0');
				}

				if(task.streams) {
					task.streams.forEach((stream) => {
						if(stream.codec_type !== 'subtitle') {
							if(stream.options) {
								if(stream.options.active === undefined
								|| stream.options.active === true) {
									args.push(`-map 0:${index}`);
									if(stream.options.codec_name) {
										let codec = '';

										if(stream.codec_type == 'video') {
												codec = `-c:v:${iv}`;
										}
										else if(stream.codec_type == 'audio') {
											codec = `-c:a:${ia}`;
										}
										args.push(`${codec} ${stream.options.codec_name}`);
									}

									if(stream.options.bit_rate) {
										let bitrate = '';
										if(stream.codec_type == 'video') {
												bitrate = `-b:v:${iv}`;
										}
										else if(stream.codec_type == 'audio') {
											bitrate = `-b:a:${ia}`;
										}
										args.push(`${bitrate} ${stream.options.bit_rate}k`);
									}

									if(stream.codec_type == 'audio') {
										if(stream.options.channels) {
											args.push(`-ac:a:${ia} ${stream.options.channels}`);
										}
										if(stream.options.frequency) {
											args.push(`-ar:a:${ia} ${stream.options.frequency}`);
										}
										ia += 1;
									}
									else if(stream.codec_type == 'video') {
										if(opts.sizes) {
											const { percentCrop } = opts.sizes;
											const x = stream.width * (percentCrop.x / 100);
											const y = stream.height * (percentCrop.y / 100);
											const w = stream.width * (percentCrop.width / 100);
											const h = stream.height * (percentCrop.height / 100);

											args.push(`-filter:v:${iv} "crop=${w}:${h}:${x}:${y}"`);
										}
										else {
											if(stream.options.framsize) {
												const size = stream.options.framsize.replace('x', ':');
												args.push(`-filter:v:${iv} "scale=${size}"`);
											}
											if(stream.options.aspec_ratio) {
												args.push(`-aspect:v:${iv} ${stream.options.aspec_ratio}`);
											}
										}
										iv += 1;
									}
									index += 1;
								}
							}
						}
					});
				}

				args.push(`-y "${opts.outFile}"`);
				console.log(args.join(' '));
				const proc = spawn(this.getBin('ffmpeg'), args, {shell: true});

				proc.stderr.on('data', (data) => {
					if(this._on.progress) {
						const str = data.toString();
						const i = str.indexOf('time=') + 5;

						if(i > 4) {
							let timecode = 0;
							let time = str.substr(i, 11);

							time = time.split(':');

							let h = parseInt(time[0]);
							let m = parseInt(time[1]);
							let s = parseInt(time[2].split('.')[0]);

							if(h > 0) { timecode = h * 60 * 60 }
							if(m > 0) { timecode += m * 60 }
							if(s > 0) { timecode += s }

							const progress = parseInt(timecode / duration * 100);


								this._on.progress(progress);
							}
					}
				});

				proc.on('close', (code) => {
						if(code == 0) {
							resolve(code);
						}
						else {
							reject(code);
						}
				});
			});
		}
		catch(error) {
			throw error;
		}
	}

	async getInfo(file) {
		try {
			const info = await execAsync(`${this.getBin('ffprobe')} -print_format json -show_format "${file}"`);
			return JSON.parse(info.stdout);
		}
		catch(error) {
			throw error;
		}
	}

	async getStreamInfo(file) {
		try {
			const info = await execAsync(`${this.getBin('ffprobe')} -print_format json -show_streams "${file}"`);
			return JSON.parse(info.stdout);
		}
		catch(error) {
			throw error;
		}
	}

	async extractJPEG(file, out, timecode) {
		try {
			const proc = await execAsync(`${this.getBin('ffmpeg')} -i "${file}" -ss ${timecode} -r 1 -an -vframes 1 -f mjpeg ${out}`);
			return FFmpeg.parseStdOut(proc.stderr, 'extractJPEG');
		}
		catch(error) {
			throw error;
		}
	}

	static getFormat(container) {
		switch(container) {
			case '.mkv': return 'matroska';
			default: return container.substr(1);
		}
	}

	static parseStdOut(std, mode) {
		try {
			const lines = std.split(os.EOL);
			if(mode == 'coder') {
				return lines.slice(10, lines.length - 1).reduce((arr, val) => {
					const v = val.substr(8, val.length - 1).split(' ');
					return [...arr, v[0]];
				}, []);
			}
			else if(mode == 'hwaccels') {
				return lines.slice(1, lines.length - 2);
			}
			else if(mode == 'extractJPEG') {
				const err = lines[lines.length - 2];
				if(err.includes('Output file is empty')) {
					throw new Error(err);
				}
				return null;
			}
			else {
				return new Error('Argument mode was not recognized');
			}
		}
		catch(error) {
			throw error;
		}
	}
}

export default new FFmpeg();
