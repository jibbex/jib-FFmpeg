import React from 'react';
import {Typography, Snackbar} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
}));

export default function SnackAlert(props) {
	const classes = useStyles();

	return (
		<div className={classes.root}>
      <Snackbar open={props.open} autoHideDuration={6000} onClose={props.onClose}>
        <Alert onClose={props.onClose} severity={props.severity}>
          {props.children}
        </Alert>
      </Snackbar>
    </div>
	)
}
