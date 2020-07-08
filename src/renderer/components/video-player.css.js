import { makeStyles } from '@material-ui/core/styles';
import { Theme } from './../app.css';

const useStyles = makeStyles((Theme) => ({
	container: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		width: '100%',
	},
	video: {
		background:'rgba(0,0,0,.75)',
		transition: 'all .3s ease-in',
		width: '100%',
		position: 'relative',
		objectFit: 'cover',
		display: 'block'
	},
	overlay: {
		display:'flex',
		minHeight: 'calc(100% - 36px)',
		alignItems: 'center',
		position: 'absolute',
		zIndex: 5,
		top: 0,
		left: 0,
		width: '100%',
		flexDirection: 'row',
		backgroundColor: 'rgba(255,255,255,.8)',
	},
	ctrlContainer: {
		display: 'flex',
		alignItems: 'flex-start'
	},
	button: {
		borderRadius: 0,
		'&:not(:first-child)': {
      borderTopRightRadius: 0,
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: '4px',

    },
    '&:not(:last-child)': {
			borderTopLeftRadius: 0,
			borderBottomRightRadius: 0,
			borderBottomLeftRadius: '4px',
    },
	},
	activeButton: {
    background: '#213141',
		'&:not(:first-child)': {
      borderTopRightRadius: 0,
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: '4px',
    },
    '&:not(:last-child)': {
			borderTopLeftRadius: 0,
			borderBottomRightRadius: 0,
			borderBottomLeftRadius: '4px',
    },
  },
}));

export default useStyles;
