import { makeStyles } from '@material-ui/core/styles';
import {Theme} from './../app.css';

const useStyles = makeStyles((theme) => ({
	root: {
		height:'100%',
		[Theme.breakpoints.up('md')]: {
     width: '360px',
    },
    [Theme.breakpoints.up('lg')]: {
     width: '420px',
    },
    [Theme.breakpoints.up('xl')]: {
     width: '460px',
    },
	},
	container: {
		position: 'relative',
		height: '100%',
		height:'100%',
	},
	table: {
    minWidth: 300,
		position: 'relative',
		userSelect: 'none'
  },
	th: {
		background: '#37474f',
		color: '#ffffff'
	},
	loadingContainer: {
		display:'flex',
		minHeight: '100%',
		alignItems: 'center',
		position: 'absolute',
		zIndex: 5,
		top: 0,
		left: 0,
		width: '100%',
		flexDirection: 'row',
		backgroundColor: 'rgba(0,0,0,.3)'
	},
	loadingWrapper: {
		width: '100%',
		textAlign: 'center'
	}
}));

export default useStyles;
