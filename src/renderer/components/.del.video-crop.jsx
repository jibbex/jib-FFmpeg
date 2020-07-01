import React, {useState, useRef, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {Theme} from './../app.css';

const useStyles = makeStyles((theme) => ({
	root: {
		position: 'relative',
		width: '100%',
		display: 'flex',
		overflow: 'hidden'
	},
	crop: {
		position: 'absolute',
		boxShadow: '0 0 9999px 9999px rgba(0,0,0,.75)',
		border: '1px dashed #ccc',
		zIndex: 99
	},
	overlay: {
		position: 'absolute',
		display: 'none',
		left: 0,
		right: 0,
		top: 0,
		bottom:0,
		zIndex: 100
	},
	dragBarTop: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: '5px',
		background: 'rgba(255,255,255,.5)',
		cursor: 'ns-resize',
		zIndex: 100
	},
	dragBarBottom: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '5px',
		background: 'rgba(255,255,255,.5)',
		cursor: 'ns-resize',
		zIndex: 100
	},
	dragBarLeft: {
		position: 'absolute',
		left: 0,
		top: 5,
		bottom:5,
		width: '5px',
		background: 'rgba(255,255,255,.5)',
		cursor: 'ew-resize',
		zIndex: 100
	},
	dragBarRight: {
		position: 'absolute',
		right: 0,
		top: 5,
		bottom:5,
		width: '5px',
		background: 'rgba(255,255,255,.5)',
		cursor: 'ew-resize',
		zIndex: 100
	}
}));

const nullCrop =  {
	left: 0, top: 0, width: 0, height: 0
}

export default function VideoCrop(props) {
	const [crop, setCrop] = useState(nullCrop);
	const [size, setSize] = useState(null);
	const [active, setActive] = useState(false);
	const [id, setId] = useState(0);
	const container = useRef(null);
	const cropArea = useRef(null);
	const classes = useStyles();

	let c = {left: 0, top: 0, width: 0, height: 0};

	const observer =  new ResizeObserver(entries => {
			if(size) {
				const {width, height} = entries[0].contentRect;

				const ratio = {
					width: width / size.width,
					height: height / size.height
				};

				setCrop({
					left: crop.left * ratio.width, top: crop.top * ratio.height,
					width: crop.width * ratio.width, height: crop.height * ratio.height
				});

				console.log(ratio);
			}
	});

	function mouseUp(event) {
		event.stopPropagation();
		const rect = container.current.getBoundingClientRect();
		props.onCropChange({crop: crop, parent: {width: rect.width, height: rect.height}});
		setSize({width: rect.width, height: rect.height});
		container.current.removeEventListener('mouseup', mouseUp);
		container.current.removeEventListener('mousemove', move);
	}

	function move(event) {
		event.stopPropagation();
		if(event.target.id == 'cropArea' && !props.active) {
			return;
		}

		const left = event.offsetX;
		const top = event.offsetY;

		const width = left - c.left;
		const height = top - c.top;
		console.log(left + ':' + c.left);
		console.log(top + ':' + c.top);

					console.log(event);
		c = {
			left:c.left,
			top: c.top,
			width:width,
			height:height
		};
		console.log(c);
		setCrop(c);
	}

	function mouseUpResizeHeight(event) {
		const rect = container.current.getBoundingClientRect();
		setSize({width: rect.width, height: rect.height});
		container.current.removeEventListener('mousemove', resizeHeightTop);
		container.current.removeEventListener('mousemove', resizeHeightBottom);
		container.current.removeEventListener('mouseup', mouseUpResizeHeight);
	}

	function resizeHeightTop(event) {
		event.stopPropagation();
		const rect = container.current.getBoundingClientRect();
		let top = event.pageY - rect.top;
		let height = crop.height + crop.top - top;
		if(height < 0) {
			return;
		}
		setCrop({left: crop.left, top: top, width: crop.width, height: height});
		props.onCropChange({crop: crop, parent: {width: rect.width, height: rect.height}});
		console.log({left: crop.left, top: top, width: crop.width, height: height});
		console.log(height);
		console.log(top);
	}

	function resizeHeightBottom(event) {
		event.stopPropagation();
		const rect = container.current.getBoundingClientRect();
		let top = event.pageY - rect.top;
		let height = top - crop.height + 40;
		if(height < 0) {
			return;
		}
		setCrop({left: crop.left, top: crop.top, width: crop.width, height: height});
		props.onCropChange({crop: crop, parent: {width: rect.width, height: rect.height}});
		console.log({left: crop.left, top: top, width: crop.width, height: height});
		console.log(height);
		console.log(top);
	}

	function startCrop(event) {
		event.stopPropagation();
		if(props.active) {

			if(container.current) {
				console.log('clear');
				observer.unobserve(container.current)
			}

			const left = event.offsetX;
			const top = event.offsetY;

			if(event.target.id == 'dragBarTop') {
				setSize(null);
				container.current.addEventListener('mousemove', resizeHeightTop);
				container.current.addEventListener('mouseup', mouseUpResizeHeight);
				c = {crop};
				return;
			}

			if(event.target.id == 'dragBarBottom') {
				setSize(null);
				container.current.addEventListener('mousemove', resizeHeightBottom);
				container.current.addEventListener('mouseup', mouseUpResizeHeight);
				c = {crop};
				return;
			}

			if(event.target.id == 'dragBarLeft' || event.target.id == 'dragBarRight') {
				return;
			}

			if(event.target.id == 'cropArea') {
				setCrop({height:0, width:0, left:0, top:0});
				return;
			}

			c = {left:left,top:top, width:0, height:0};

			container.current.addEventListener('mouseup', mouseUp);
			container.current.addEventListener('mousemove', move);
		}
	}

	useEffect(() => {
		if(id != props.id && props.size) {
			setCrop(props.size.crop);
			setSize(props.size.parent);
			setId(props.id);
		}

		return () => {
			setCrop(nullCrop);
			setSize(null);
			setId(0);
		}
	}, [props.id])

	useEffect(() => {
		if(container.current && props.active) {
			container.current.addEventListener('mousedown', startCrop);
		}

		return () => {
			container.current.removeEventListener('mousedown', startCrop);
			container.current.removeEventListener('mouseup', mouseUp);
			container.current.removeEventListener('mousemove', move);
		}
	}, [props.active])

	useEffect(() => {
		if(container.current && id == props.id && size) {
			observer.observe(container.current)
		}

		return () => {
			observer.unobserve(container.current);
		}
	}, [container, size]);

	return (
		<div id="cropContainer" className={classes.root} ref={container}>
			<div
				id="cropArea"
				className={classes.crop}
				ref={cropArea}
				style={{display: props.active ? 'block' : 'none', left:crop.left, top:crop.top, width:crop.width, height:crop.height}}
			>
				<div id="dragBarTop" className={classes.dragBarTop}></div>
				<div id="dragBarBottom" className={classes.dragBarBottom}></div>
				<div id="dragBarLeft" className={classes.dragBarLeft}></div>
				<div id="dragBarRight" className={classes.dragBarRight}></div>
			</div>
			{props.children}
		</div>
	);
}
