import {remote} from 'electron';
import React, {useEffect, useRef} from 'react';
import {
	Grid, Paper, Button, ButtonGroup, Typography, Select,
	FormControl, InputLabel, Divider, MenuItem, TextField, Input
} from '@material-ui/core';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import {Style, Theme} from './../app.css';
import {Formats} from './../../lib/formats';

const FileName = withStyles({
  root: {
		'& .MuiOutlinedInput-root':  {
			overflow: 'hidden',
			padding: '18.5px 0 0 0',
		},
		'& .MuiOutlinedInput-input': {
	    overflowX: 'auto !important',
	    overflowY: 'hidden !important',
	    whiteSpace: 'nowrap',
			paddingBottom: '16px',
			color: 'rgba(0, 0, 0, 0.87)',
			margin: '0 14px 2.5px 14px',
		}
  },
})(TextField);

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

export default function Format(props) {
	const container = useRef(null);
	const classes = useStyles();
	const appCss = Style();

	const formats = [...Formats.video, ...Formats.audio];

	const observer =  new ResizeObserver(entries => {
		const {width, height} = entries[0].contentRect;
		if(width > 460 && container.current.style.display != '') {
			container.current.style.display = '';
		}
		else if(width <= 460 && container.current.style.display == '') {
			container.current.style.display = 'block';
		}
	});

	useEffect(() => {
		if(container.current) {
			observer.observe(container.current)
		}

		return () => {
			observer.unobserve(container.current);
		}
	}, [container]);

	async function saveAs() {
		if(!props.container) {
			return;
		}

		const dlg = remote.dialog;
		const filters = [
			{ name: `${props.container} file`, extensions: [props.container.substr(1)]}
		];

    try {
      const file = await dlg.showSaveDialog(remote.getCurrentWindow(), {defaultPath: props.outFile, filters: filters});

      if(!file.canceled) {
				props.onFileChange(file.filePath);
      }
    }
    catch(err) {
      console.error(err);
      dlg.showMessageBox(remote.getCurrentWindow(), {type: 'error', title: 'Error', message: 'An error has occurred.'});
    }
  }

	return (
		<React.Fragment>
			<Typography variant="h4" className={appCss.h4}>Info</Typography>
			<Divider style={{marginBottom: Theme.spacing(2)}} />
			<Grid container className={classes.info}>
				<Grid item xs={2}>
						<Typography variant="body2" className={classes.txtRight}>Format</Typography>
				</Grid>
				<Grid item xs={4}>
						<Typography variant="body2">{props.selected ? props.selected.format.name : ''}</Typography>
				</Grid>
					<Grid item xs={2}>
							<Typography variant="body2" className={classes.txtRight}>Duration</Typography>
					</Grid>
					<Grid item xs={4}>
							<Typography variant="body2">
								{(props.selected && props.selected.format.duration) ? props.selected.format.duration.toHHMMSS() : ''}
							</Typography>
					</Grid>
					<Grid item xs={2}>
							<Typography variant="body2" className={classes.txtRight}>Filesize</Typography>
					</Grid>
					<Grid item xs={4}>
							<Typography variant="body2">{props.selected ? props.selected.size : ''}</Typography>
					</Grid>
					<Grid item xs={2}>
							<Typography variant="body2" className={classes.txtRight}>Bitrate</Typography>
					</Grid>
					<Grid item xs={4}>
							<Typography variant="body2">{props.selected ? props.selected.format.bitrate+' kbit/s' : ''}</Typography>
					</Grid>
			</Grid>
			<Typography variant="h4" className={appCss.h4}>Format</Typography>
			<Divider style={{marginBottom: Theme.spacing(2)}} />
			<div ref={container} className={classes.container} style={{marginBottom: Theme.spacing(4)}}>
				<div style={{display: 'flex'}}>
					<FormControl variant='outlined' className={classes.formControl} disabled={props._disabled.shared}>
						<InputLabel id="container-label">Container</InputLabel>
					 	<Select
						 id='container-select'
						 labelId='container-label'
						 value={props.container}
						 onChange={props.onContainerChange}
						 label='Container'>
					 		{props.uncertain && <MenuItem disabled value='***'><em>***</em></MenuItem>}
						 	{formats.map(format => (
								<MenuItem key={format} value={`.${format}`}>{format}</MenuItem>
							))}
						</Select>
				 	</FormControl>
				 </div>
				 <div style={{width:'100%', display: 'flex', flexDirection: 'row'}}>
					 <FormControl className={classes.formControl} style={{flexGrow: 7, minWidth: '250px'}} disabled={props._disabled.specific}>
							<FileName
								variant='outlined'
								label='Filename'
								disabled
								multiline
								value={!props.uncertain ? props.outFile : ''} />
					 </FormControl>
					 <Button size='small' onClick={saveAs} style={{flexGrow: 1}}>
						 Save as
					</Button>
				 </div>
			 </div>
		</React.Fragment>
	);
}
