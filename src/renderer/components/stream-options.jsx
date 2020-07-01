import React, {useState, useEffect} from 'react';
import {
	Grid, Paper, Button, ButtonGroup, Typography, Select, Switch,
	FormControl, InputLabel, Divider, MenuItem, TextField
} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import {Style, Theme} from './../app.css';
import {Formats, GetCodecs} from './../../lib/formats';

const useStyles = makeStyles((theme) => ({
  paper: {
		display: 'flex',
		flexDirection: 'column',
    margin: '.1rem',
		color: Theme.palette.text.secondary,
    background: Theme.palette.secondary.light,
		padding: '16px',
  },
	h4: {
    fontSize: '1.4em',
    textAlign: 'left'
  },
	formControl: {
		margin: Theme.spacing(2),
		minWidth: 120
	},
}));


export default function StreamOptions(props) {
	const appCss = Style();
	const classes = useStyles();
	const [active, setActive] = useState(true);

	const {
		stream, container, update, index, breakpoints, hwaccels,
		hwaccel
	} = props;

	const codecs = GetCodecs(container);
	const enabled = active ? !codecs[stream.codec_type] : true;
	const bitrates = {
		video: [800, 1200, 1400, 1800, 2400, 3200, 4000],
		audio: [34, 48, 64, 96, 128, 160, 192, 256, 384, 512]
	};
	const framesizes = [
		'1920x1080', '1280x720', '1024x576', '854x579',
		'640x360', '1600x1200', '1024x768', '800x600',
		'768x576', '640x480'
	];
	const ratios = ['2:35', '19:10', '16:10', '16:9', '3:2', '4:3'];
	const frequencys = [11.025, 22.050, 44.1, 48, 96];
	const channels = [1, 2, 6];

	if(codecs[stream.codec_type]) {
		if((hwaccel == 'cuda' || hwaccel == 'cuvid')
			&& (container == '.mp4' || container == '.mkv' || container == '.mov')) {
				codecs.video = Object.assign({h264_nvec: 'h264_nvec (cuda/cuvid)'}, codecs.video);
		}
		else if(stream.options.codec_name == 'h264_nvec') {
			delete stream.options.codec_name;
		}
	}


	useEffect(() => {
		if(!codecs[stream.codec_type]) {
			setActive(false);
		}
		else {
			setActive(true);
		}

		if(stream.options.codec_name !== undefined) {
			update('copy', stream, 'codec_name');
		}
	}, [container])

	useEffect(() => {
		if(stream.options.active !== undefined) {
			setActive(stream.options.active);
		}
	}, [stream.options.active])

	const StreamSelect = (props) => {
		const {
			items, label, id, defaultVal, type, unit, value
		} = props;

		const values = items[stream.codec_type] ? items[stream.codec_type] : items;

		if(stream.codec_type !== 'subtitle' && (!type || stream.codec_type === type)) {
			return (
				<React.Fragment>
					<FormControl disabled={!active} className={classes.formControl}>
						<InputLabel id={`${id}-label-${index}`}>{label}</InputLabel>
							<Select
								id={`${id}-select-${index}`}
								labelId={`${id}-label-${index}`}
								value={active ? value : ''}
								onChange={(event) => {update(event.target.value, stream, id)}}
								label={label}>
								<MenuItem value={defaultVal.value}>{defaultVal.label}</MenuItem>
								{!enabled &&
									Object.entries(values).map(([key, val], index) => {
										const _key = isNaN(parseInt(key)) ? key : val;
										const _val = val;

										return (
											<MenuItem
												key={`${Date.now()}-${index}`}
												value={_key}>
													{unit ? `${_val} ${unit}` : _val}
											</MenuItem>
										);
									})
								}
						</Select>
					</FormControl>
				</React.Fragment>
			);
		}

		return null;
	}

	return (
			<Grid item style={{maxWidth:'50%', flexGrow: 4}}>
				<Paper className={classes.paper} style={{margin: '.1rem', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,.9)'}}>
					<Typography variant="h4" className={appCss.h4} style={{display: 'flex', alignItems: 'center'}}>
						<span style={{flexGrow: 2}}>{stream.codec_type.capitalize()}</span>
						<Switch
			        checked={active}
							disabled={!codecs[stream.codec_type]}
			        onChange={() => {update(!active, stream, 'active'); setActive(!active);}}
							color="primary"/>
					</Typography>
					<Divider style={{marginBottom: Theme.spacing(4)}} />
					{
						container && (
							<React.Fragment>
								<StreamSelect
									label='Encoder'
									id='codec_name'
									defaultVal={{label: 'Copy', value: 'copy'}}
									value={stream.options.codec_name ? stream.options.codec_name : 'copy'}
									items={codecs}/>
								<StreamSelect
									label='Bitrate'
									id='bit_rate'
									unit='Kbit/s'
									defaultVal={{label: 'Default', value: 'default'}}
									value={stream.options.bit_rate ? stream.options.bit_rate : 'default'}
									items={bitrates}/>
								<StreamSelect
									label='Frame Size'
									id='framesize'
									type='video'
									defaultVal={{label: 'No Change', value: 'no-change'}}
									value={stream.options.framesize ? stream.options.framesize : 'no-change'}
									items={framesizes}/>
								<StreamSelect
									label='Aspect Ratio'
									id='aspect_ratio'
									type='video'
									defaultVal={{label: 'No Change', value: 'no-change'}}
									value={stream.options.aspect_ratio ? stream.options.aspect_ratio : 'no-change'}
									items={ratios}/>
								<StreamSelect
									label='Frequency'
									id='sample_rate'
									type='audio'
									unit='kHz'
									defaultVal={{label: 'No Change', value: 'no-change'}}
									value={stream.options.sample_rate ? stream.options.sample_rate : 'no-change'}
									items={frequencys}/>
								<StreamSelect
									label='Channels'
									id='channels'
									type='audio'
									defaultVal={{label: 'No Change', value: 'no-change'}}
									value={stream.options.channels ? stream.options.channels : 'no-change'}
									items={channels}/>
							</React.Fragment>
						)
					}
				</Paper>
			</Grid>
	);
}
