import { makeStyles, createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';

/*breakpoints: {
  keys: ['xs', 'sm', 'md', 'lg', 'xl'],
  values: [0, 600, 900, 1280, 1920]
},
*/
let Theme = createMuiTheme({
  palette: {
    primary: {
      light: '#B2BCC1',
      main: '#37474f',
      dark: '#255467',
      contrastText: '#fff',
    },
    secondary: {
      light: '#D1D9E2',
      main: '#425263',
      dark: '#213141',
      contrastText: '#fff',
    },
    error: {
      light: '#E57373',
      main: '#F44336',
      dark: '#D32F2F',
      contrastText: '#fff',
    },
    background: {
      paper: '#eee',
      default: '#67A9AF'
    },
  },
  spacing: factor => `${0.25 * factor}rem`,
  contrastThreshold: 3,
  tonalOffset: 0.2,
});

Theme = responsiveFontSizes(Theme);

const Style = makeStyles((Theme) => ({
  palette: {
    primary: {
      light: '#B2BCC1',
      main: '#37474f',
      dark: '#255467',
      contrastText: '#fff',
    },
    secondary: {
      light: '#D1D9E2',
      main: '#425263',
      dark: '#213141',
      contrastText: '#fff',
    },
    error: {
      light: '#E57373',
      main: '#F44336',
      dark: '#D32F2F',
      contrastText: '#fff',
    }
  },
  root: {
    flexGrow: 0,
  },
  paper: {
    padding: Theme.spacing(2),
    textAlign: 'center',
    color: Theme.palette.text.secondary,
    background: Theme.palette.secondary.light
  },
  gridContainer: {
    padding: '1rem'
  },
  h4: {
    fontSize: '1.4em',
    textAlign: 'left'
  },
  tableButton: {
    width: 28,
    minWidth: 'auto'
  },
  drawer: {
    [Theme.breakpoints.up('md')]: {
     width: '360px',
    },
    [Theme.breakpoints.up('lg')]: {
     width: '420px',
    },
    [Theme.breakpoints.up('xl')]: {
     width: '460px',
    },
    transition: Theme.transitions.create(['margin', 'width', 'left'], {
      easing: Theme.transitions.easing.sharp,
      duration: Theme.transitions.duration.leavingScreen,
    }),
  },
  offset: Theme.mixins.toolbar,
  appbar: {
    position: 'fixed',
    zIndex: 150,
    width: '100%',
    padding: '0 5rem',
    [Theme.breakpoints.up('md')]: {
     transition: Theme.transitions.create(['margin', 'width', 'left'], {
       easing: Theme.transitions.easing.sharp,
        duration: Theme.transitions.duration.leavingScreen,
      }),
      marginLeft: 0,
    },
    [Theme.breakpoints.up('lg')]: {
     left: '420px',
     width: 'calc(100% - 420px)',
     marginLeft: 0,
    },
    [Theme.breakpoints.up('xl')]: {
     left: '460px',
     width: 'calc(100% - 460px)',
     marginLeft: 0,
    },
  },
  content: {
    position: 'absolute',
    flexGrow: 1,
    height: '100%',
    background: '#67a9af',
    padding: Theme.spacing(2),
    overflow: 'auto',
    width: '100%',
    left: 0,
    [Theme.breakpoints.up('md')]: {
     transition: Theme.transitions.create(['margin', 'width', 'left'], {
       easing: Theme.transitions.easing.sharp,
        duration: Theme.transitions.duration.leavingScreen,
      }),
      marginLeft: 0,
    },
    [Theme.breakpoints.up('lg')]: {
     left: '420px',
     width: 'calc(100% - 420px)',
     marginLeft: 0,
    },
    [Theme.breakpoints.up('xl')]: {
     left: '460px',
     width: 'calc(100% - 460px)',
     marginLeft: 0,
    },
  },
  contentShift: {
    transition: Theme.transitions.create(['margin', 'width', 'left'], {
      easing: Theme.transitions.easing.easeOut,
      duration: Theme.transitions.duration.enteringScreen,
    }),
    marginLeft: '360px',
    width: 'calc(100% - 360px)',
    [Theme.breakpoints.up('lg')]: {
     left: '420px',
     width: 'calc(100% - 420px)',
     marginLeft: 0,
    },
    [Theme.breakpoints.up('xl')]: {
     left: '460px',
     width: 'calc(100% - 460px)',
     marginLeft: 0,
    },
  },
  activeButton: {
    opacity: .8,
    background: '#425263',
    transition: Theme.transitions.create(['opacity', 'background'], {
      easing: Theme.transitions.easing.easeOut,
      duration: Theme.transitions.duration.enteringScreen,
    }),
    ['&:hover']: {
      opacity: 1
    }
  },
  popover: {
    position: 'relative',
    display: 'flex',
    minWidth:'380px',
    flexDirection: 'column'
  },
}));

export { Theme, Style};
