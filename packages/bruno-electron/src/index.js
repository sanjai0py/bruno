const path = require('path');
const isDev = require('electron-is-dev');
const { format } = require('url');
const { BrowserWindow, app, Menu, ipcMain } = require('electron');
const { setContentSecurityPolicy } = require('electron-util');

const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

const menuTemplate = require('./app/menu-template');
const { openCollection } = require('./app/collections');
const LastOpenedCollections = require('./store/last-opened-collections');
const registerNetworkIpc = require('./ipc/network');
const registerCollectionsIpc = require('./ipc/collection');
const registerPreferencesIpc = require('./ipc/preferences');
const Watcher = require('./app/watcher');
const { loadWindowState, saveBounds, saveMaximized } = require('./utils/window');
const registerNotificationsIpc = require('./ipc/notifications');

const lastOpenedCollections = new LastOpenedCollections();

Object.defineProperty(app, 'isPackaged', {
  get() {
    return true;
  }
});

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'debug';
log.info('App starting...');

if (isDev) {
  // Useful for some dev/debugging tasks, but download can
  // not be validated becuase dev app is not signed
  autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}

// Reference: https://content-security-policy.com/
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src * 'unsafe-inline' 'unsafe-eval'",
  "connect-src * 'unsafe-inline'",
  "font-src 'self' https:",
  // this has been commented out to make oauth2 work
  // "form-action 'none'",
  // we make an exception and allow http for images so that
  // they can be used as link in the embedded markdown editors
  "img-src 'self' blob: data: http: https:",
  "media-src 'self' blob: data: https:",
  "style-src 'self' 'unsafe-inline' https:"
];

setContentSecurityPolicy(contentSecurityPolicy.join(';') + ';');

const menu = Menu.buildFromTemplate(menuTemplate);

let mainWindow;
let watcher;

// function sendStatusToWindow(text) {
//   log.info(text);
//   mainWindow.webContents.send('main:message', text);
// }

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  autoUpdater.checkForUpdatesAndNotify();
  Menu.setApplicationMenu(menu);
  const { maximized, x, y, width, height } = loadWindowState();

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 1000,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    title: 'Bruno',
    icon: path.join(__dirname, 'about/256x256.png')
    // we will bring this back
    // see https://github.com/usebruno/bruno/issues/440
    // autoHideMenuBar: true
  });

  if (maximized) {
    mainWindow.maximize();
  }

  const url = isDev
    ? 'http://localhost:3000'
    : format({
        pathname: path.join(__dirname, '../web/index.html'),
        protocol: 'file:',
        slashes: true
      });

  mainWindow.loadURL(url).catch((reason) => {
    console.error(`Error: Failed to load URL: "${url}" (Electron shows a blank screen because of this).`);
    console.error('Original message:', reason);
    if (isDev) {
      console.error(
        'Could not connect to Next.Js dev server, is it running?' +
          ' Start the dev server using "npm run dev:web" and restart electron'
      );
    } else {
      console.error(
        'If you are using an official production build: the above error is most likely a bug! ' +
          ' Please report this under: https://github.com/usebruno/bruno/issues'
      );
    }
  });
  watcher = new Watcher();

  const handleBoundsChange = () => {
    if (!mainWindow.isMaximized()) {
      saveBounds(mainWindow);
    }
  };

  mainWindow.on('resize', handleBoundsChange);
  mainWindow.on('move', handleBoundsChange);

  mainWindow.on('maximize', () => saveMaximized(true));
  mainWindow.on('unmaximize', () => saveMaximized(false));
  mainWindow.on('close', (e) => {
    e.preventDefault();
    ipcMain.emit('main:start-quit-flow');
  });

  mainWindow.webContents.on('will-redirect', (event, url) => {
    event.preventDefault();
    if (/^(http:\/\/|https:\/\/)/.test(url)) {
      require('electron').shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    require('electron').shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // register all ipc handlers
  registerNetworkIpc(mainWindow);
  registerCollectionsIpc(mainWindow, watcher, lastOpenedCollections);
  registerPreferencesIpc(mainWindow, watcher, lastOpenedCollections);
  registerNotificationsIpc(mainWindow, watcher);
});

// autoUpdater.on('checking-for-update', () => {
//   mainWindow.webContents.send('checking-for-update');
// });

autoUpdater.on('update-available', (props) => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

// autoUpdater.on('download-progress', (progressObj) => {
//   let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
//   log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
//   log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
//   sendStatusToWindow(log_message);
// });

autoUpdater.on('error', (err) => {
  log.error(err);
});

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit);

// Open collection from Recent menu (#1521)
app.on('open-file', (event, path) => {
  openCollection(mainWindow, watcher, path);
});
