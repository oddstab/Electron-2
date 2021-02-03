import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import * as pty from "node-pty";

let mainWindow: BrowserWindow = null;
let ptyProcess: pty.IPty = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    backgroundColor: "red",
    width: 1200,
    show: false,
    // frame: false,
    icon: path.join(__dirname, "../src/favicon.ico"),
  });

  mainWindow.loadFile(path.join(__dirname, "../src/index.html"));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("ready-to-show", () => mainWindow.show());

  // ptyProcess = pty.spawn("powershell.exe", [], {
  //   name: "xterm-color",
  //   cols: 80,
  //   rows: 24,
  //   cwd: process.env.HOME,
  //   env: process.env,
  // });

  // ptyProcess.onData((data) => {
  //   mainWindow.webContents.send("terminal.incomingData", data);
  //   console.log("data sent:", data);
  // });

  // ipcMain.on("terminal.keystroke", (e, arg) => {
  //   ptyProcess.write(arg);
  // });
}

app.on("ready", () => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("fuck", (e, args) => {
  console.log(args);
  dialog.showMessageBox(mainWindow, {
    message: "ipcRenderer -> ipcMain",
  });
});

ipcMain.on("restart-app", (e, needConfirm) => {
  let code = 0;
  if (needConfirm) {
    code = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      title: "重啟提醒",
      message: "是否要重啟？",
      buttons: ["重啟", "先不要"],
      cancelId: 1,
      defaultId: 1,
    });
  }

  console.log("code是:", code);

  if (code === 0) {
    app.relaunch();
    app.exit();
  }
});

ipcMain.on("send-img2main", (e, val) => {});

ipcMain.on("open-terminal", (e, data) => {
  let terminalWindow = new BrowserWindow({
    width: 850,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  terminalWindow.loadFile(path.join(__dirname, "../src/terminal.html"));
  terminalWindow.webContents.openDevTools();

  ptyProcess = pty.spawn("powershell.exe", [], {
    name: "xterm-color",
    cols: 80,
    rows: 50,
    cwd: process.env.HOME,
    env: process.env,
  });

  ptyProcess.onData((data) => {
    terminalWindow.webContents.send("terminal.incomingData", data);
    console.log("data sent:", data);
  });

  ipcMain.on("terminal.keystroke", (e, arg) => {
    ptyProcess.write(arg);
  });
});
