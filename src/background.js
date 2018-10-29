'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let showVisu

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600 })

  if (isDevelopment) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadFile('index.html')
  }

  win.on('closed', () => {
    win = null
    if (showVisu)
      showVisu.close()
  })

  win.webContents.on('will-navigate', (ev, str) => {
    ev.preventDefault()
    let re = /^file\:\/\/\//;
    if (str.match(re)) {
      let fic = str.replace(re,'');
      win.webContents.send('fic-drop', fic)
    }
  })
}

function createVisu () {
  // Create the browser window.
  showVisu = new BrowserWindow({
    width: 400,
    height: 300,
    show: false
  })

  showVisu.setMenu(null);
  showVisu.on('closed', function() { showVisu = null });
  showVisu.once('ready-to-show', function() { showVisu.show(); });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
    createVisu()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  createWindow()
  createVisu()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('show-visu', function(event, arg) {

  if (showVisu === null) {
    createVisu()
  }
  showVisu.setMenu(null);
  showVisu.loadURL("data:text/html;charset=utf-8," + encodeURI(arg));

})
