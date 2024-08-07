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
    .mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-text-field__input {
      caret-color: #00b6ff !important;
    }
    .theme-noir mat-form-field:not(.ng-valid .mat-form-field-invalid).mat-focused .mat-mdc-input-element {
      border-color: #0089ff !important;}
    .btn.alt-btn{
    border-color: #0089ff !important; }
    .ng-valid{
      border-color: #3113ff !important;
}
   .btn:disabled {
    background-color: #333;
    color: #666; }
    .btn{
      background: #0de0ff !importannt}
    .btn:hover{
      background-color: #4aa3ff !important}
    .theme-noir{
--mdc-checkbox-selected-focus-icon-color: #0bfdff !important;
--mdc-checkbox-selected-hover-icon-color: #0bfdff !important;
--mdc-checkbox-selected-icon-color: #0bfdff !important;
--mat-minimal-pseudo-checkbox-selected-checkmark-color: #0bfdff !important;
--mdc-checkbox-selected-pressed-icon-color: #0bfdff !important;
--mdc-checkbox-selected-focus-state-layer-color:#001dff !important;
--mdc-checkbox-selected-hover-state-layer-color:#001dff !important;
--mdc-checkbox-selected-pressed-state-layer-color: :#001dff !important;
--mdc-filled-text-field-caret-color: #0bfdff !important;
--mdc-filled-text-field-focus-label-text-color: #0bfdff !important;


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
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadURL('https://play.geforcenow.com/');

  // Set the window to windowed fullscreen mode
  mainWindow.setFullScreenable(true);
  mainWindow.setFullScreen(false); // This makes it windowed fullscreen

  // Inject custom CSS and replace colors once the page has finished loading
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
    if (title === 'GeForce Infinity | GeForce NOW' || title === 'GeForce NOW') {
      mainWindow.setTitle('GeForce Infinity');
    } else {
      const modifiedTitle = `GeForce Infinity${gameName ? ' | ' + gameName : ''}`;
      mainWindow.setTitle(modifiedTitle);
    }
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
