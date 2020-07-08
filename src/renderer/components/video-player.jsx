import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
	Grid, Paper, Button, ButtonGroup, Typography,  Tooltip
} from '@material-ui/core';
import CropIcon from '@material-ui/icons/Crop';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import PauseCircleFilledIcon from '@material-ui/icons/PauseCircleFilled';
import ReactCrop from 'react-image-crop';
import style from './video-player.css';

const vstyle = {
	disabled: {
		opacity: .2,
		background: '#aaa'
	},
};

const current = new Date(0);

export default function VideoPlayer(props) {
	const [isPaused, setIsPaused] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [videoId, setVideoId] = useState(null);
	const [time, setTime] = useState(0);
	const [cropping, setCropping] = useState(false);
	const [src, setSrc] = useState(false);
	const [current, setCurrent] = useState(0);
 const [crop, setCrop] = useState({unit: '%', width: 100, height: 100});
	const video = useRef(null);
	const classes = style();

	const id = props.selected.id;
	const token = props.token;
	const url = () => id ? `http://localhost:${props.port}/video/${id}?key=${token}` : '';

	function onTime(event) {
		if(!props.spool && props.time[1] && event.target.currentTime >= props.time[1]) {
			video.current.load();
			setCurrent(0);
			setIsPlaying(false);
			setIsPaused(false);
			return;
		}

		setCurrent(event.target.currentTime);
	}

	useEffect(() => {
		const resume = async () => {
			if(isPlaying && !isPaused && video) {
				video.current.currentTime = current;
				await video.current.play();
			}
			else if(isPaused) {
				video.current.currentTime = current;
				video.current.poster = '';
			}
		}

		resume();

	}, [cropping])

	useEffect(() => {
		if(videoId !== id) {
			setVideoId(id);
			setIsPaused(false);
			setIsPlaying(false);

			if(props.port != 0) {
				setSrc(url());
			}

			video.current.load();

			if(props.selected && props.selected.options.sizes) {
				setCropping(true);
				setCrop(props.selected.options.sizes.percentCrop);
			}
			else {
				setCropping(false);
				setCrop({unit: '%', width: 75, height: 75, x: 12.5, y: 12.5});
			}
		}
		else if((time[0] !== props.time[0] || time[1] !== props.time[1]) && isPlaying) {
			setTime(props.time);

			if(!isPaused) {
				video.current.currentTime = time[0] !== props.time[0] ? props.time[0] : props.time[1];
			}
		}

		video.current.addEventListener('timeupdate', onTime);

		return () => {
			video.current.removeEventListener('timeupdate', onTime);
		}
	});

	async function play() {
		try {
			if(!isPaused && video) {
					video.current.load();

					if(id) {
						setTime(props.time);
						setCurrent(0);
						video.current.currentTime = props.time[0] ? props.time[0] : 0;
						await video.current.play();
						setIsPlaying(true);
					}
			}
			else if(isPaused && video) {
				await video.current.play();
				setIsPaused(false);
			}
		}
		catch(err) {
			throw err;
		}
	}

	function pause() {
		if(!isPaused && video) {
			video.current.pause();
			setIsPaused(true);
		}
	}

	function onCropChange(crop, percentCrop) {
		setCrop(percentCrop);
	}

	function onCropComplete(crop, percentCrop) {
		const rect = video.current.getBoundingClientRect();
		props.cropFunc(
			{
				crop: crop,
				percentCrop: percentCrop,
				parent: {
					width: rect.width,
					height: rect.height
				}
			}
		);
	}

	const videoComponent = (
	  <video
	    className={classes.video}
	    loop
	    ref={video}
					style={(!props.selected ? vstyle.disabled : {})}
					poster={props.selected ? `http://localhost:${props.port}/${props.selected.id}?key=${token}` : ''}
					preload='true'
	    onLoadStart={e => {
	      e.target.dispatchEvent(new Event('medialoaded', { bubbles: true }));
	    }}>
				{src && <source src={src} />}
			</video>
	);

	return (
			<div className={classes.container}>
				{cropping
					? <ReactCrop
							onChange={onCropChange}
							onComplete={onCropComplete}
							renderComponent={videoComponent}
							ruleOfThirds crop={crop} />
					: videoComponent}
				<div className={classes.ctrlContainer} >
					<ButtonGroup variant='contained' color='primary'>
						<Button
							className={classes.button}
							className={clsx(classes.button, {[classes.activeButton]: !isPaused && isPlaying})}
							disabled={!props.selected}
							startIcon={<PlayCircleFilledIcon />}
							onClick={play}
							>
								play
						</Button>
						<Button
							className={clsx(classes.button, {[classes.activeButton]: isPaused})}
							disabled={!props.selected}
							startIcon={<PauseCircleFilledIcon />}
							onClick={pause}
							>
								pause
							</Button>
					</ButtonGroup>
					{props.children}
					<Typography style={{padding: '5px 15px'}}>{current.toString().toHHMMSS()}</Typography>
					<ButtonGroup variant='contained' color='primary'>
						<Button
							className={clsx(classes.button, {[classes.activeButton]: cropping})}
							onClick={() => {if(cropping) props.cropFunc(null); setCropping(!cropping)}}
							disabled={!props.selected}>
							<Tooltip title="Cropping" arrow><CropIcon /></Tooltip>
						</Button>
					</ButtonGroup>
				</div>
			</div>
	);
}
