import path from 'path';
import fs from 'fs';
import util from 'util';
import os from 'os';
import ev from 'events';
import {exec, spawn} from 'child_process';

const execAsync = util.promisify(exec);

class FFmpeg {
	constructor() {
		this._path = null;
		this._event = new ev();
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
		this._event.on(event, callback);
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

				let index = 0;

				if(opts.acceleration && opts.acceleration !== 'no-hw') {
					args.push(`hwaccel ${opts.acceleration}`);
				}

				args.push(`-i "${task.format.filepath}"`);
				//args.push(`-f ${container}`);

				if(opts.time_range) {
					args.push(`ss ${opts.time_range[0]}`);
					args.push(`to ${opts.time_range[1]}`);
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
												codec = `-c:v:${index}`;
										}
										else if(stream.codec_type == 'audio') {
											codec = `-c:a:${index}`;
										}
										args.push(`${codec} ${stream.options.codec_name}`);
									}

									if(stream.options.bit_rate) {
										let bitrate = '';
										if(stream.codec_type == 'video') {
												bitrate = `-b:v:${index}`;
										}
										else if(stream.codec_type == 'audio') {
											bitrate = `-b:a:${index}`;
										}
										args.push(`${bitrate} ${stream.options.bit_rate}k`);
									}

									if(stream.codec_type == 'audio') {
										if(stream.options.channels) {
											args.push(`-ac:a:${index} ${stream.options.channels}`);
										}
										if(stream.options.frequency) {
											//args.push(`-ac:a:${index} ${stream.options.frequency}`);
										}
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
					setImmediate(() => {
						this._event.emit('progress', data.toString());
					});
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
