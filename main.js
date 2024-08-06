const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const rpc = require('discord-rpc');

const clientId = '1270181852979789825'; // Replace with your Discord application client ID
const rpcClient = new rpc.Client({ transport: 'ipc' });

let mainWindow;
let tray;
let startTime; // To track the time when the app was started

// Setup Discord Rich Presence
rpc.register(clientId);
rpcClient.on('ready', () => {
  console.log('Discord Rich Presence is ready.');

  const updateActivity = (gameTitle) => {
    const now = new Date();
    const elapsedTime = Math.floor((now - startTime) / 1000); // Time in seconds

    rpcClient.setActivity({
      details: 'GeForce Infinity',
      state: gameTitle ? `Playing ${gameTitle}` : 'Idling...',
      largeImageKey: 'bluenvidia', // Ensure 'bluenvidia.png' is included in your app's resources
      largeImageText: 'GeForce Infinity',
      instance: false,
      startTimestamp: startTime, // Start time for elapsed time
    });
  };

  // Initial activity update
  startTime = new Date();
  updateActivity(null);

  // Update activity every 15 seconds
  setInterval(() => {
    const title = mainWindow.getTitle();
    const gameTitle = title.startsWith('GeForce Infinity | ') ? title.replace('GeForce Infinity | ', '') : '';
    updateActivity(gameTitle);
  }, 15 * 1000);
});

function injectCustomCSS() {
  const customCSS = `
    .mat-flat-button.mat-accent,
    .mat-raised-button.mat-accent,
    .mat-fab.mat-accent,
    .mat-mini-fab.mat-accent {
      background-color: #0089ff !important;
    }
    .marquee-indicators[_ngcontent-ng-c3853869388] li.active[_ngcontent-ng-c3853869388] {
      background-color: #6e86ff !important;
    }
    .evidence-panel-highlighter[_ngcontent-ng-c4181549079] {
      background-color: #4aa3ff !important;
    }
    .font-body2-link {
      color: #0089ff !important;
    }
    .left-panel-container[_ngcontent-ng-c2678379996] {
      border-right: 10px ridge #10b2ff !important;
    }
    div.green-circle {
      background-color: #4aa3ff !important;
    }
  `;

  mainWindow.webContents.insertCSS(customCSS);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    title: 'GeForce Infinity', // Set the initial app title
    icon: path.join(__dirname, 'resources/bluenvidia.png'), // Set the app icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL('https://play.geforcenow.com/');

  // Set the window to windowed fullscreen mode
  mainWindow.setFullScreenable(true);
  mainWindow.setFullScreen(false); // This makes it windowed fullscreen

  // Inject custom CSS once the page has finished loading
  mainWindow.webContents.on('did-finish-load', () => {
    injectCustomCSS();
    // Ensure the title stays as 'GeForce Infinity'
    mainWindow.setTitle('GeForce Infinity');
  });

  // Monitor title changes and modify them
  mainWindow.on('page-title-updated', (event, title) => {
    event.preventDefault();
    let gameName = title.replace(/^GeForce NOW - /, '').replace(/ on GeForce NOW$/, '');
    // Reset to "GeForce Infinity" if the title is "GeForce Infinity | GeForce NOW"
    if (title === 'GeForce Infinity | GeForce NOW') {
      mainWindow.setTitle('GeForce Infinity');
    }
    const modifiedTitle = `GeForce Infinity${gameName ? ' | ' + gameName : ''}`;
    mainWindow.setTitle(modifiedTitle);
  });
}

function createTray() {
  const trayIconPath = path.join(__dirname, 'resources/bluenvidia.png');
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open GeForce Infinity',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('GeForce Infinity'); // Set tray tooltip
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray(); // Initialize tray icon

  rpcClient.login({ clientId }).catch(console.error);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Record the start time when the app starts
  startTime = new Date();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
