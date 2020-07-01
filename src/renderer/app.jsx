import {ipcRenderer, remote} from 'electron';
import path from 'path';
import url from 'url';
import fs from 'fs';
import React, {useState, useEffect, useRef} from 'react';
import clsx from 'clsx';
import {
  Button, Fab, Paper, Grid, Typography, IconButton, Popover, AppBar, ButtonGroup,
  CssBaseline, Fade, Tooltip, Zoom, Divider, Slider, Toolbar
} from '@material-ui/core';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {ThemeProvider} from '@material-ui/styles';
import AddIcon from '@material-ui/icons/NoteAdd';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';
import InfoIcon from '@material-ui/icons/Info';
import InTable from './components/intable';
import VideoPlayer from './components/video-player';
import SnackAlert from './components/snack-alert';
import StreamsPopover from './components/streams-popover';
import Format from './components/format';
import HwAccel from './components/hw-accel';
import StreamOptions from './components/stream-options';
import Drawer from './components/responsive-drawer';
import {Style, Theme} from './app.css';
import {Formats} from './../lib/formats';

String.prototype.toHHMMSS = function() {
  const sec_num = parseInt(this, 10);
  let hours   = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  let seconds = sec_num - (hours * 3600) - (minutes * 60);

  if(hours   < 10) {hours   = "0"+hours;}
  if(minutes < 10) {minutes = "0"+minutes;}
  if(seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

const seed = {positions: [], time: Date.now()};

function seeding(event) {
  seed.positions.push(Math.round (event.clientX));
  seed.positions.push(Math.round (event.clientY));

  if(seed.positions.length > 200) {
    document.removeEventListener('mousemove', seeding);
    ipcRenderer.send('sys', {cmd: 'seed', seed: seed});
    delete seed.positions;
    delete seed.time;
  }
}

document.addEventListener('mousemove', seeding);

export default function App(props) {
  const classes = Style();
  const infoPop = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [snackMsg, setSnackMsg] = useState(false);
  const [snack, setSnack] = useState({msg: null, severity: null, open: false})
  const [videoId, setVideoId] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [infoAnchor, setInfoAnchor] = useState(null);
  const [streamInfo, setStreamInfo] = useState([]);
  const [time, setTime] = useState([0, 100]);
  const [isSpooling, setIsSpooling] = useState(false);
  const [container, setContainer] = useState('');
  const [hwAccel, setHwAccel] = useState('');
  const [outFile, setOutFile] = useState('');
  const [size, setSize] = useState(null);
  const [opt, setOpt] = useState({port: 0, hwaccels: []})

  useEffect(() => {
    if(!opt.port) {
      ipcRenderer.send('sys', {cmd: 'init'});
      ipcRenderer.once('sys', (event, arg) => {
        console.log(arg)
        setOpt({
          port: arg.port,
          hwaccels: arg.hwaccels
        })
      });
    }

    ipcRenderer.on('message', (event, arg) => {
      console.log(arg)
      if(arg.cmd == 'info') {
        setTasks([...arg.payload]);
        setIsLoadingFiles(false);
      }
      if(arg.cmd == 'stream_info') {
        setStreamInfo(arg.payload.streams);
      }
      if(arg.cmd == 'msg') {
        setSnack(arg.payload);
      }
      if(arg.cmd == 'token') {
        setToken(arg.payload);
      }
      if(arg.cmd == 'error') {
        const dlg = remote.dialog;
        const err = arg.payload;
        dlg.showMessageBox(remote.getCurrentWindow(), {type: 'error', title: 'Error', message: err.message});
        throw err;
      }
    })

    return () => {
      ipcRenderer.removeAllListeners('message');
    }
  })

  async function addFiles() {
    try {
      const dlg = remote.dialog;
      const options = ['openFile', 'multiSelections'];
      const filters = [
        { name: 'audio and video files', extensions: [...Formats.video, ...Formats.audio]},
        { name: 'video files', extensions: Formats.video },
        { name: 'audio files', extensions: Formats.audio },
      ];

      const files = await dlg.showOpenDialog(remote.getCurrentWindow(), {filters: filters, properties: options});

      if(!files.canceled) {
        ipcRenderer.send('message', {cmd: 'info', payload: files.filePaths});
        setIsLoadingFiles(true);
      }
    }
    catch(err) {
      console.error(err);
      dlg.showMessageBox(remote.getCurrentWindow(), {type: 'error', title: 'Error', message: 'Directory could not selected'});
    }
  }

  function update(task, options) {
    task = task || false;
    options = options || {};

    if(task != false) {
      if(task.options.time_range) {
        setTime(task.options.time_range);
      }
      else {
        setTime([0, parseInt(task.format.duration)]);
      }

      if(task.options.container) {
        ipcRenderer.send('message', {cmd: 'full_info', payload: task});
      }
      else {
        setStreamInfo([]);
      }

      setVideoId(task.id);
      setContainer(task.options.container ? task.options.container : '');
      setHwAccel(task.options.acceleration ? task.options.acceleration : '');
      setOutFile(task.options.outFile ? task.options.outFile : '')
    }
    else {
      const {container, acceleration} = options;

      setVideoId(0);
      setOutFile('');
      setStreamInfo([]);
      setContainer(container ? container : '');
      setHwAccel(acceleration ? acceleration : '');
    }
  }

  function selectTasks(id) {
    const selectedIndex = selected.findIndex(i => i.id == id);
    const index = tasks.findIndex(i => i.id == id);

    if(selectedIndex === -1) {
      return [...selected, tasks[index]];
    } else if(selectedIndex === 0) {
      return selected.slice(1);
    } else if(selectedIndex === selected.length - 1) {
      return selected.slice(0, -1)
    } else if(selectedIndex > 0) {
      return [
        ...selected.slice(0, selectedIndex),
        ...selected.slice(selectedIndex + 1)
      ];
    }
  }

  const listActions = {
    click: (event, id) => {
      let newSelected = [];

      if(selected.length > 1) {
        newSelected = selectTasks(id);

        if(newSelected.length === 1) {
          update(newSelected[0]);
        } else {
          update(false, {container: newSelected.length < 1 ? '' : '***'});
        }

      }
      else {
        const index = tasks.findIndex(i => i.id == id);

        if(selected.length == 0 || tasks[index].id !== selected[0].id) {
          update(tasks[index]);
          newSelected = [tasks[index]];
        }
        else {
          update();
        }
      }

      setSelected(newSelected);
    },
    addSelected: (event, id) => {
      const newSelected = selectTasks(id);

      if(newSelected.length == 1) {
        update(newSelected[0]);
      }
      else {
        update(false, {container: newSelected.length < 1 ? '' : '***'});
      }

      setSelected(newSelected);
    },
    removeAllSelected: () => {
      setSelected([]);
      update();
    },
    selectAll: () => {
      setSelected(tasks)
      update(false, {container: '***'});
    },
    deleteSelected: () => {
      setSelected([]);
      update();
      setIsLoadingFiles(true);
      ipcRenderer.send('message', {cmd: 'remove_files', payload: selected});
    },
    add: () => addFiles()
  }

  const open = Boolean(infoAnchor);
  const id = open ? 'simple-popover' : undefined;

  function closeSnackAlert(event, reason) {
    if(reason === 'clickaway') {
      return;
    }

    snack.open = false;
    setSnackMsg(snack);
  }

  function openInfoPopover(event) {
    if(selected.length == 1) {
      setInfoAnchor(event.currentTarget);
      ipcRenderer.send('message', {cmd: 'full_info', payload: selected[0]});
    }
  }

  function closeInfoPopover() {
    setInfoAnchor(null);
  }

  function changeTimeSlider(event, val) {
    const index = tasks.findIndex(i => i.id == selected[0].id);
    tasks[index].options.time_range = val;
    ipcRenderer.send('message', {cmd: 'update_task', payload: tasks[index]});
    setIsSpooling(true);
    setTime(val);
  };

  function changeOutFile(path) {
    const index = tasks.findIndex(i => i.id == selected[0].id);
    tasks[index].options.outFile = path;
    setOutFile(path);
    ipcRenderer.send('message', {cmd: 'update_task', payload: tasks[index]});
  }

  function changeContainer(event) {
    selected.forEach((val, i) => {
      const index = tasks.findIndex(x => x.id == val.id);
      tasks[index].options.container = event.target.value;

      let fn = tasks[index].format.filepath;

      if(tasks[index].options.outFile) {
        fn = tasks[index].options.outFile.split('.');
        fn.pop();
        fn = fn.join('.');
      }

      fn = fn + event.target.value;

      tasks[index].options.outFile = fn;

      ipcRenderer.send('message', {cmd: 'update_task', payload: tasks[index]});
      
      if(i == 0) {
        setOutFile(fn);
        ipcRenderer.send('message', {cmd: 'full_info', payload: tasks[index]});
      }
    });

    setContainer(event.target.value);
  }

  function changeHwAccel(event) {
    selected.forEach((val, i) => {
      const index = tasks.findIndex(x => x.id == val.id);
      tasks[index].options.acceleration = event.target.value;

      ipcRenderer.send('message', {cmd: 'update_task', payload: tasks[index]});
    });

    setHwAccel(event.target.value);
  }

  function onCropChange(sizes) {
    if(selected.length) {
      const index = tasks.findIndex(i => i.id == selected[0].id);
      tasks[index].options.sizes = sizes;
      ipcRenderer.send('message', {cmd: 'update_task', payload: tasks[index]});
      setSize(size);
    }
  }

  function changeStreamOptions(value, stream, option) {
    selected.forEach((val, i) => {
      const index = tasks.findIndex(x => x.id == val.id);
      tasks[index].streams = streamInfo;
      tasks[index].streams[stream.index].options[option] = value;
      ipcRenderer.send('message', {cmd: 'update_task', payload: tasks[index]});
      ipcRenderer.send('message', {cmd: 'full_info', payload: tasks[index]});
    });
  }

  const matches1300 = useMediaQuery('(max-width:1360px)');
  const matches1480 = useMediaQuery('(max-width:1580px)');
  const matches1600 = useMediaQuery('(max-width:1600px)');
  const matchesUp1360 = useMediaQuery('(min-width:1360px)');
  const lgDown = useMediaQuery(Theme.breakpoints.up('lg'));

  const streams = (
   <React.Fragment>
   {
     streamInfo.map((stream, i) => {
       return (
        <StreamOptions
         key={`${stream.codec_type}-${i}`}
         stream={stream}
         index={i}
         container={container}
         hwaccels={opt.hwaccels}
         hwaccel={hwAccel}
         update={changeStreamOptions}
         breakpoints={[matches1300, matches1480 ,matches1600]}/>
       )
     })
   }
   </React.Fragment>
  );

  return (
    <ThemeProvider theme={Theme}>
      <div className={classes.root} spacing={2}>
        <CssBaseline />
          <Drawer
           className={classes.drawer}
           classes={{
            paper: classes.drawerPaper,
           }}
           open={drawerOpen}
           onClose={() => setDrawerOpen(!drawerOpen)}>
            <InTable
             files={tasks}
             loading={isLoadingFiles}
             selected={selected}
             actions={listActions} />
          </Drawer>
          <main className={clsx(classes.content, {[classes.contentShift]: drawerOpen,})}>
            <ButtonGroup variant='contained' color='primary'>
						  {!lgDown &&
                <Button
                  className={clsx(classes.button, {[classes.activeButton]: drawerOpen})}
                  onClick={() => setDrawerOpen(!drawerOpen)}>
                    <PlaylistPlayIcon />
                </Button>
              }
						  <Button className={classes.button}>Options</Button>
              <Button className={classes.button}>Encode</Button>
		       </ButtonGroup>
          <Grid container spacing={2} className={classes.offset} alignItems='flex-start' justify='space-evenly'>
           <AppBar position="static" style={{marginBottom: '.5rem', borderRadius: 4}}>
             <Toolbar variant="dense">
               <Typography variant="h6" color="inherit" style={{height: '45px', lineHeight: '45px', overflow: 'hidden', flexGrow: 1}}>
                 {selected.length > 1 ? 'Multiple Files' : (selected.length > 0 ? selected[0].name : 'No File selected')}
               </Typography>
               <IconButton
                 id='infoButton'
                 onClick={openInfoPopover}
                 style={{color:Theme.palette.secondary.light}}>
                 <InfoIcon />
               </IconButton>
             </Toolbar>
           </AppBar>
           <Grid item md={12} lg={matches1300 ? 12 : matches1480 ? 7 : 8} style={{display: 'flex', width: '100%', flexDirection:'column'}}>
             <Paper className={classes.paper} style={{display: 'flex', width: '100%', flexDirection: 'column', overflowX: 'auto', background: 'rgba(255,255,255,.9)'}}>
               <VideoPlayer
                 selected={selected.length == 1 && selected[0]}
                 token={token}
                 time={time}
                 port={opt.port}
                 spool={isSpooling}
                 cropFunc={onCropChange}>
                 <div style={{width: 250, padding: '0 25px', marginLeft: 20, flexGrow: 4}}>
                   <Slider
                     value={time}
                     disabled={!videoId}
                     onChange={changeTimeSlider}
                     onChangeCommitted={() => setIsSpooling(false)}
                     valueLabelDisplay='off'
                     aria-labelledby='range-slider'
                     max={selected.length && parseInt(selected[0].format.duration)}
                     getAriaValueText={(value) => {return `${value}s`}}
                     marks={
                       selected.length ?
                       [
                         {value: 0, label: time[0].toString().toHHMMSS()},
                         {value: parseInt(selected[0].format.duration), label: time[1].toString().toHHMMSS()}
                       ] : []
                     }
                   />
                 </div>
               </VideoPlayer>
             </Paper>
           </Grid>
           <Grid item sm={12} md={12} lg={matches1300 ? 12 : matches1480 ? 5 : 4} xl={4} style={{alignItems: 'flex-start'}}>
            <Paper className={classes.paper} style={{display: 'flex', width: '100%', flexDirection: 'column', overflowX: 'auto', background: 'rgba(255,255,255,.9)'}}>
             <Format
               _disabled={{specific:!videoId,
               shared:!selected.length}}
               uncertain={selected.length > 1}
               container={container}
               selected={selected[0]}
               matches={matchesUp1360}
               outFile={outFile}
               onContainerChange={changeContainer}
               onFileChange={changeOutFile}/>
            </Paper>
            <Paper className={classes.paper} style={{display: 'flex', width: '100%', flexDirection: 'column', overflowX: 'auto', background: 'rgba(255,255,255,.9)', marginTop:Theme.spacing(2)}}>
            <HwAccel
              _disabled={{specific:!videoId,
              shared:!selected.length}}
              uncertain={selected.length > 1}
              container={container}
              hwaccels={opt.hwaccels}
              hwaccel={hwAccel}
              onAccelChange={changeHwAccel}
              onFileChange={changeOutFile}/>
            </Paper>
           </Grid>
           {(streamInfo.length && container) ? streams : null}
          </Grid>
          <SnackAlert severity={snack.severity} open={snack.open} onClose={closeSnackAlert}>
            {snack.msg}
          </SnackAlert>
          <Popover
            id={id}
            open={open}
            ref={infoPop}
            anchorEl={infoAnchor}
            elevation={16}
            onClose={closeInfoPopover}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}>
              <StreamsPopover streamInfo={streamInfo} selected={selected} />
          </Popover>
        </main>
      </div>
    </ThemeProvider>
  );
}
