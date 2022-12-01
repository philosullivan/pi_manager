const { 
  app, 
  BrowserWindow 
}                       = require( 'electron' );
const path              = require( 'path' );
const os                = require( 'os' );
const windowStateKeeper = require( 'electron-window-state' );
const user_home_dir     = os.homedir();
const app_path          = app.getAppPath();
const app_name          = app.getName();
const fs                = require( 'fs-extra' );
const is_dev            = require( 'electron-is-dev' );
const assets_dir        = path.join( __dirname, 'assets' );
const template_index    = `${assets_dir}/templates/index.html`;


// .
if ( is_dev ) {
  require('electron-reloader')( module );
}

// .
const createWindow = () => {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  const mainWindow = new BrowserWindow({
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
      webviewTag: true,
      preload: `${assets_dir}/modules/preload.js`,
    },
  });

  // .
  mainWindowState.manage( mainWindow );

  // and load the index.html of the app.
  mainWindow.loadFile( `${template_index}` );

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
