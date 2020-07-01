import React, {useState, useEffect} from 'react';
import {
	Grid, Paper, Button, ButtonGroup, Typography, Select,
	FormControl, InputLabel, Divider, MenuItem, TextField, Input
} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import {Style, Theme} from './../app.css';

const useStyles = makeStyles((theme) => ({
	container: {
		display: 'flex',
		alignItems: 'flex-start'
	},
 paper: {
   padding: Theme.spacing(2),
   color: Theme.palette.text.secondary,
   background: Theme.palette.secondary.light
 },
	formControl: {
		margin: Theme.spacing(2),
		minWidth: 120
	},
	info: {
		textAlign: 'left',
		marginBottom: Theme.spacing(4),
		'& p': {
			padding: Theme.spacing(1)
		}
	},
	txtRight: {
		textAlign: 'right'
	},
	txtLeft: {
		textAlign: 'left'
	}
}));

export default function HwAccel(props) {
	const [hwDisabled, setHwDisabled] = useState(false);
	const classes = useStyles();
	const appCss = Style();

	useEffect(() => {
		if(!props._disabled.shared && props.container == '.mp4'
			|| props.container == '.mkv' || props.container == '.mov') {
				setHwDisabled(false);
		}
		else {
			setHwDisabled(true);
		}
	}, [props.container, props._disabled.shared]);


	return (
		<React.Fragment>
			<Typography variant="h4" className={appCss.h4}>Hardware Acceleration</Typography>
			<Divider style={{marginBottom: Theme.spacing(2)}} />
			<FormControl variant='outlined' className={classes.formControl} disabled={hwDisabled}>
				<InputLabel id="container-label">Type</InputLabel>
				<Select
				 id='hwaccel-select'
				 labelId='hwaccel-label'
				 value={hwDisabled ? '' : props.hwaccel}
				 onChange={props.onAccelChange}
				 label='hwaccel'>
					{props.uncertain && <MenuItem disabled value='***'><em>***</em></MenuItem>}
					<MenuItem value='no-hw'>No Acceleration</MenuItem>}
					{props.hwaccels.map((hw, index) => (
						<MenuItem key={`${hw}-${index}`} value={`${hw}`}>{hw}</MenuItem>
					))}
				</Select>
			</FormControl>
	 	</React.Fragment>
	);
}
