import React from 'react';
import {
  Grid, Typography, Popover, Divider, Drawer, Card,
  CardContent, CardMedia, CardHeader
} from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import {makeStyles} from '@material-ui/core/styles';
import {Theme} from './../app.css';

const useStyles = makeStyles((theme) => ({
  popover: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 460,
    minWidth: 380
  },
}));

export default function StreamsPopover({selected, streamInfo}, props) {
  const classes = useStyles();

  return (
      <Card className={classes.popover}>
        <CardHeader
          style={{fontSize: '1.4rem', background:Theme.palette.secondary.main, color: '#fff'}}
          title='Streams' />
          <TrendingUpIcon
            style={{
              fontSize:'4rem',
              color: 'rgba(255,255,255,.8)',
              position: 'absolute',
              right:5, top:0, opacity:.5,
              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,.5))'}} />
          <CardContent style={{color: 'rgba(0,0,0,.75)'}}>
            <Grid container alignItems='flex-start' style={{marginTop: 10}}>
            {streamInfo.map((stream, index) => {
              if(stream.codec_type != 'subtitle') {
                return (
                  <Grid key={`${stream.codec_type}:#${index}`} container item xs={6}>
                    <Grid item xs={12}>
                      <Typography variant="h5">{stream.codec_type.capitalize()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Codec</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">{stream.codec_name}</Typography>
                    </Grid>
                    {stream.codec_type == 'video' &&
                    <React.Fragment>
                      <Grid item xs={6}>
                        <Typography variant="body2">Resolution</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{stream.width}x{stream.height}</Typography>
                      </Grid>
                    </React.Fragment>
                    }
                    <Grid item xs={6}>
                      <Typography variant="body2">Bitrate</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">{stream.bit_rate}  kbit/s</Typography>
                    </Grid>
                    {stream.codec_type == 'audio' &&
                    <React.Fragment>
                      <Grid item xs={6}>
                        <Typography variant="body2">Channels</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{stream.channel_layout}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Samplerate</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{stream.sample_rate} Khz</Typography>
                      </Grid>
                    </React.Fragment>
                    }
                  </Grid>
                )
              }
            })}
            </Grid>
          </CardContent>
        </Card>
    );
}
