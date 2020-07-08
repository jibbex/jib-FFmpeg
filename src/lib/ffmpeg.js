import path from 'path';
import fs from 'fs';
import util from 'util';
import os from 'os';
import {exec, spawn} from 'child_process';

const execAsync = util.promisify(exec);

class FFmpeg {
	constructor() {
		this._path = null;
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
			const opts = task.options;
			const container = FFmpeg.getFormat(opts.container);
			const args = [];

			if(opts.acceleration && opts.acceleration !== 'no-hw') {
				args.push(`-hwaccel ${opts.acceleration}`);
			}

			args.push(`-i "${task.format.filepath}"`);
			args.push(`-f ${container}`);

			if(opts.time_range) {
				args.push(`-ss ${opts.time_range[0]}`);
				args.push(`-to ${opts.time_range[1]}`);
			}
			else {
				args.push('-ss 0');
			}

			if(task.streams) {
				task.streams.forEach((stream, i) => {
					args.push(`-map 0:${i}`);
						if(stream.options) {
							if(stream.options.codec_name) {
								let codec = '';
								if(stream.codec_type == 'video') {
										codec = `-c:v:0`;
										args.push(`-map 0:${i}`);
								}
								else if(stream.codec_type == 'audio') {
									codec = `-c:a:0`;
								}
								args.push(`${codec} ${stream.options.codec_name}`)
							}
						}
				});
			}

			args.push(`-y "${opts.outFile}"`)
			console.log(args);
			const proc = spawn(this.getBin('ffmpeg'), args, {shell: true});

			proc.on('error', data => {
				console.error(data.toString());
			});

			proc.stderr.on('data', (data) => {
			  console.error(`${data}`);
			});

			proc.on('close', (code) => {
			  console.log(`child process exited with code ${code}`);
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
