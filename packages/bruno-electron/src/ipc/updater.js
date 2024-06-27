const { autoUpdater } = require('electron-updater');

const registerAutoUpdater = (mainWindow) => {
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('main:checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('main:update_available', info);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('main:update_downloaded');
  });

  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
  });

  autoUpdater.checkForUpdates();
};

module.exports = { registerAutoUpdater };
