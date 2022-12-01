const { 
  app, 
  BrowserWindow,
  ipcMain,
  nativeImage
}                       = require( 'electron' );
const path              = require( 'path' );
const os                = require( 'os' );
const windowStateKeeper = require( 'electron-window-state' );
const fs                = require( 'fs-extra' );
const is_dev            = require( 'electron-is-dev' );
const exec              = require( 'shelljs' ).exec;
const trim              = require( '@stdlib/string-trim' );
const user_home_dir     = os.homedir();
const app_path          = app.getAppPath();
const app_name          = app.getName();
const assets_dir        = path.join( __dirname, 'assets' );
const app_data          = `${assets_dir}/data`;
const icon_dock         = `${assets_dir}/img/pi.png`;
const icon_app          = nativeImage.createFromPath( icon_dock );
const template_index    = `${assets_dir}/templates/index.html`;

let mainWindow          = null;

// Only hot reload if in dev env.
if ( is_dev ) {
  require('electron-reloader')( module );
}

// .
const createWindow = () => {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  mainWindow = new BrowserWindow({
    x : mainWindowState.x,
    y : mainWindowState.y,
    width : mainWindowState.width,
    height : mainWindowState.height,
    minWidth:500,
    minHeight:628,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      enableRemoteModule: true,
      preload: `${assets_dir}/modules/preload.js`,
    },
    icon: icon_app
  });

  // .
  mainWindowState.manage( mainWindow );

  // and load the index.html of the app.
  mainWindow.loadFile( `${template_index}` );

  // Hide bar.
  mainWindow.setMenuBarVisibility(false);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// .
app.on('ready', createWindow);

// .
app.on('window-all-closed', () => {
    app.quit();
});

// .
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ===================================================== //
// .
process.on('uncaughtException', function (error) {
  console.log( error );
  if ( is_dev ) {
      mainWindow.webContents.openDevTools();
  }
});

// Open Chrome Dev Tools.
ipcMain.on( 'open_dev_tools', function ( event, arg ) {
  event.returnValue = mainWindow.webContents.openDevTools();
});

// Cleanup and close application.
ipcMain.on( 'exit', function ( event, arg ) {
  // TODO - clean up here, then close.
  event.returnValue = app.quit();
});

// .
ipcMain.on( 'app_info', function ( event, arg ) {
  event.returnValue = { 
    user_home_dir:   `${user_home_dir}`, 
    app_path:        `${app_path}`, 
    app_name:        `${app_name}`,
    app_data:        `${app_data}`
  }
});

// Run shell commands and get the return.
ipcMain.on('run_cmd', function (event, arg) {

  exec(`${arg[0]}`, {silent:true}, function (code, stdout, stderr) {
    // .
    if ( is_dev ) {
      console.log( 'run_cmd' );
      console.log( `${arg[0]}` );
      console.log( `CODE: ${code}` );
      console.log( `STDOUT: ${stdout}` );
      console.log( `STDERR: ${stderr}` );
      console.log( '===============' );
    }
    event.returnValue = { 'code': code, 'stdout': stdout, 'stderr': stderr };
  });
});

// .
ipcMain.on( 'cpu_info', function ( event, arg ) {
  let cpu_info   = '/proc/cpuinfo';
  let cpu_data   = fs.readFileSync( cpu_info, {encoding:'utf8', flag:'r'});
  let cpu_object = {};

  // console.log( cpu_data );
    cpu_data.split(/\r?\n/).forEach( line =>  {
      // No empty lines.
      if ( line ) {
        let entry = line.split(':');
        let key   = trim( entry[0] );
        let value = trim( entry[1] );
        let processor_number;
  
        if ( key && value ) {

          if ( key === 'processor' ) {
            processor_number = value;
          }

          console.log(processor_number);

          cpu_object[`${key}_${processor_number}`] = value;

        }
      }
    });


  // console.log( cpu_object );
  event.returnValue = cpu_object;
});