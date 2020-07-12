import os from 'os';
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import util from 'util';
import crypto from 'crypto';
import express from 'express';
import portfinder from 'portfinder';
import seedrandom from 'seedrandom';
import _ from 'lodash/core';
import { app, BrowserWindow, ipcMain } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { enableLiveReload } from 'electron-compile';
import { queue } from 'async';
import windowStateKeeper from 'electron-window-state';
import ffmpeg from './lib/ffmpeg';
import { Formats } from './lib/formats';

const router = express.Router();
const server = express();
const fsPromises = fs.promises;
const rm = util.promisify(fse.remove);

const imgPath = path.join(process.cwd()+'/images');
const startTime = Date.now();
const isDevMode = process.execPath.match(/[\\/]electron/);

let mainWindow;
let token = null;
let files = [];
let port = 4480;

if (isDevMode) enableLiveReload( { strategy: 'react-hmr' } );

const tasks = {
 multi: queue(async (task, callback) => {
   if(task.name == 'file_info') {
     try {
       const json = await ffmpeg.getInfo(task.file);

       let size = 0;
       let duration = 0;

       if(json.format != undefined) {
         if(json.format.size > 1073741824) {
           size = (json.format.size / 1024 / 1024 / 1024).toFixed(2) + 'gb'
         }
         else if(json.format.size >= 1048576) {
           size = (json.format.size / 1024 / 1024).toFixed(0) + 'mb';
         }
         else {
           size = (json.format.size / 1024).toFixed(0) + 'kb';
         }

         duration = json.format.duration >= 60
           ? (json.format.duration / 60).toFixed(0) + 'm'
           : parseFloat(json.format.duration).toFixed(0) + 's';

           const id = Date.now() + files.length;
           const fn = path.basename(task.file);
           const im = `images/${crypto.createHash('sha1').update(fn).digest('hex')}.jpg`;

           files.push(
             {
               id: id,
               name: fn,
               size: size,
               duration: json.format.duration ? duration : '0'.toHHMMSS(),
               thumb: im,
               done: false,
               format: {
                 name: json.format.format_long_name,
                 streams: json.format.nb_streams,
                 bitrate: json.format.bit_rate ? Math.round(json.format.bit_rate / 1000) : '',
                 size: json.format.size,
                 duration: json.format.duration ? json.format.duration : '0',
                 filepath: task.file
               },
               options: {}
           });
       }
     }
     catch(error) {
       mainWindow.webContents.send('message', {cmd: 'error', payload: error});
     }
   }
   else if(task.name == 'encoders') {
     const d = await ffmpeg.encoders();
     mainWindow.webContents.send('message', {cmd: 'encoders', payload: d});
   }
   else if(task.name == 'decoders') {
     const d = await ffmpeg.decoders();
     mainWindow.webContents.send('message', {cmd: 'decoders', payload: d});
   }

   callback();
 }, os.cpus().length),
 single: queue(async (task, callback) => {
  if(task.name == 'encode') {
   ffmpeg.on('progress', (data) => {
    setImmediate(() => {
     console.log(data);
    });
   });

   const code = await ffmpeg.encode(task.file);

   console.log(task.file);
   if(task.file.options) {
    console.log(task.file.options)
   }
   if(task.file.streams) {
    console.log(task.file.streams)
   }
   console.log(`exit code: ${code}`);
  }

  callback();
 }, 1)
};

tasks.multi.drain(function(event) {
    console.info('all tasks finished');
    mainWindow.webContents.send('message', {cmd: 'info', payload: files});
});

tasks.single.drain(function(event) {
    console.info('all tasks finished');
    mainWindow.webContents.send('message', {cmd: 'info', payload: files});
});

tasks.multi.error(function(err, task) {
    console.error('task experienced an error');
    const snack = {
      msg: 'Task experienced an error.',
      severity: 'error',
      open: true
    };
    mainWindow.webContents.send('message', {cmd: 'msg', payload: snack});
});

tasks.single.error(function(err, task) {
    console.error('task experienced an error');
    const snack = {
      msg: 'Task experienced an error.',
      severity: 'error',
      open: true
    };
    mainWindow.webContents.send('message', {cmd: 'msg', payload: snack});
});

app.allowRendererProcessReuse = true;

const createWindow = async () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  mainWindow = new BrowserWindow({
    minWidth: 1000,
    minHeight: 800,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: 'guif-FFmpeg',
    backgroundColor: '#67a9af',
    show: false,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  try {
    await fsPromises.access(imgPath);
    await rm(imgPath)
    await fsPromises.mkdir(imgPath);
  }
  catch(err) {
    await fsPromises.mkdir(imgPath);
  }

  mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);

  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }
  else {
    mainWindow.setMenu(null);
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindowState.manage(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
};

app.on('window-all-closed', async () => {
  try {
    await fsPromises.access(imgPath);
    await rm(imgPath);
  }
  catch(err) {
    throw err;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function getInfo(f) {
  for(let i = 0; i < f.length; i++) {
    tasks.multi.push({name: 'file_info', file: f[i]});
  }
}

function encode(f) {
 for(let i = 0; i < f.length; i++) {
  if(_.isEmpty(f[i].options)) {
   const snack = {
     msg: 'Nothing to do yet.',
     severity: 'warning',
     open: true
   };

   mainWindow.webContents.send('message', {cmd: 'msg', payload: snack});
   return;
  }

  tasks.single.push({name: 'encode', file: f[i]});
 }
}

function removeFiles(event, f) {
  f.forEach((file) => {
    const index = files.findIndex(i => i.id == file.id)
    if(index !== -1) {
      files.splice(index, 1);
    }
  })

  event.reply('message', {cmd: 'info', payload: files});
}

async function getStreamInfo(event, file, cmd) {
  try {
    const index = files.findIndex(i => i.id == file.id);

    if(index < 0) {
      const snack = {
        msg: 'File not loaded.',
        severity: 'error',
        open: true
      };

      mainWindow.webContents.send('message', {cmd: 'msg', payload: snack});
      return;
    }

    if(index > -1 && !files[index].streams) {
      const json = await ffmpeg.getStreamInfo(file.format.filepath);
      const streams = [];

      json.streams.forEach((val) => {
        const stream = new Object();
        stream.index = val.index;
        stream.codec_name = val.codec_name;
        stream.codec_type = val.codec_type;
        stream.bit_rate = val.bit_rate ? Math.round(val.bit_rate / 1000) : ' - ';
        if(val.codec_type == 'video') {
          stream.width = val.width;
          stream.height = val.height;
          stream.aspec_ratio = val.display_aspect_ratio;
        }
        else if(val.codec_type == 'audio') {
          stream.channel_layout = val.channel_layout;
          stream.channels = val.channels;
          stream.sample_rate = val.sample_rate  ? val.sample_rate / 1000 : ' - ';
        }
        else if(val.codec_type == 'audio'
         || val.codec_type == 'subtitle'
         && val.tags) {
          stream.language = val.tags.title ? val.tags.title
           : val.tags.language ? val.tags.language : null;
        }
        stream.options = new Object();
        streams.push(stream);
      });

      files[index].streams = streams;
    }


    event.reply('message', {cmd: 'stream_info', payload: files[index]});
  }
  catch(error) {
    console.error(error);
    event.reply('message', {cmd: 'error', payload: error});
  }
}

ipcMain.on('sys', async (event, arg) => {
  if(arg.cmd == 'init') {
    let modes = [];

    try {
      modes = await ffmpeg.hwaccels();
      tasks.multi.push({name: 'decoders'});
      tasks.multi.push({name: 'encoders'});
    }
    catch(error) {
      event.reply('message', {cmd: 'error', payload: error});
    }

    event.reply('sys', {port: port, hwaccels: modes});
  }
  if(arg.cmd == 'seed') {
    const loadingTime = arg.seed.time - startTime;
    const buffer = arg.seed.positions.reduce((acc, pos) => {
      return acc - pos + loadingTime;
    }, []);
    const rng = seedrandom(buffer * loadingTime, { entropy: true });

    token = crypto.createHash('sha1').update(rng.int32().toString()).digest('hex');

    event.reply('message', {cmd: 'token', payload: token});
  }
})

ipcMain.on('message', (event, arg) => {
  if(arg.cmd == 'info') {
    getInfo(arg.payload);
  }
  if(arg.cmd == 'remove_files') {
    removeFiles(event, arg.payload)
  }
  if(arg.cmd == 'full_info') {
    getStreamInfo(event, arg.payload, arg.cmd);
  }
  if(arg.cmd == 'update_task') {
    const index = files.findIndex(i => i.id == arg.payload.id);
    files[index] = arg.payload;
  }
  if(arg.cmd == 'encode') {
   encode(arg.payload);
  }
})

router.use((req, res, next) => {
  if(req.query.key !== token && req.path !== '/') {
    res.status(403).send('<h1>Forbidden</h1><p>Access denied</p>');
  }
  else {
    next();
  }
});

router.get('/:id', async (req, res) => {
  const index = files.findIndex(i => i.id == req.params.id);

  if(index !== -1) {
    const path = files[index].format.filepath;
    const ext = files[index].name.split('.').pop();
    const img = files[index].thumb;

    try {
      await fsPromises.access(img)
      res.redirect(`/${img}?key=${token}`)
    }
    catch(err) {
      try {
       if(Formats.video.find(el => el == ext)) {
        await ffmpeg.extractJPEG(path, img, '00:00:10.00');
        res.redirect(`/${img}?key=${token}`);
       }
       else if(Formats.audio.find(el => el == ext)) {
        await ffmpeg.extractJPEG(path, img, '00:00:00.00');
        res.redirect(`/${img}?key=${token}`);
       }
       else {
         res.status(404).send(`<h1>Not Found</h1><p>File not loaded</p>`);
       }

      }
      catch(error) {
        res.status(404).send('Not Found');

        const snack = {
          msg: 'Something went wrong during the creation of the thumbnail.',
          severity: 'error',
          open: true
        };

        mainWindow.webContents.send('message', {cmd: 'msg', payload: snack});

        try {
          await fsPromises.access(img);
          await rm(img);
        }
        catch(error) {
          console.error(error)
        }
      }
    }
  }
});

router.get('/video/:id', async (req, res) => {
  const index = files.findIndex(i => i.id == req.params.id);

  if(index !== -1) {
    const path = files[index].format.filepath;
    const ext = files[index].name.split('.').pop();

    try {
      const stat = await fsPromises.stat(path);

      const fileSize = stat.size;
      const range = req.headers.range;

      if(range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
        const chunksize = (end-start)+1;
        const file = fs.createReadStream(path, {start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/'+ext,
        }

        res.writeHead(206, head);
        file.pipe(res);
      }
      else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/'+ext,
        }

        res.writeHead(200, head);
        fs.createReadStream(path).pipe(res);
      }
    }
    catch(err) {
      if(err.code === 'ENOENT') {
        res.status(404).send(`<h1>Not Found</h1><p>${err}</p>`);

        const snack = {
          msg: 'File not found.',
          severity: 'error',
          open: true
        };

        mainWindow.webContents.send('message', {cmd: 'msg', payload: snack});
      }
    }
  } else {
    res.status(404).send(`<h1>Not Found</h1><p>File not loaded</p>`);
  }
});

router.get('/images/:img', async (req, res, next) => {
  try {
    const options = {
      root: path.join(process.cwd()+'/images'),
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
    };
    const file = req.params.img;
    const stat = await fsPromises.stat(path.join(options.root+'/'+file));

    res.sendFile(file, options, err => {if(err) next(err)});
  }
  catch(error) {
    res.status(404).send(`<h1>Not Found</h1><p>${error}</p>`);
  }
});

router.get('/', async (req, res) => {
  res.redirect(`https://michm.de`);
})

server.use(router);

portfinder.basePort = port;
portfinder.getPort({port: port}, (err, _PORT) => {
  if(err) {
    throw err;
  }

  server.listen(_PORT, () => {
    port = _PORT;
    console.log(`Server listening on port ${_PORT}`);
    app.on('ready', createWindow);
  });
});
