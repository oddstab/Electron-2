import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as isDev from "electron-is-dev";
import * as pty from "node-pty";
import { imageSize } from "image-size";

let mainWindow: BrowserWindow = null;
let ptyProcess: pty.IPty = null;
let newWindows: BrowserWindow[] = [];

console.log("wow !!!!!");

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

ipcMain.on("show-img", (_, val: string[]) => {
  let show = dialog.showMessageBoxSync({
    title: "顯示提醒",
    message: `是否要顯示${val.length}張圖片？`,
    buttons: ["是", "否"],
    cancelId: 1,
  });

  if (show !== 0) {
    return;
  }

  newWindows = [];

  val.forEach((p, i) => {
    //接受渲染進程傳過來的圖片路徑
    let file = fs.readFileSync(p);
    let { width, height } = imageSize(file);

    newWindows[i] = new BrowserWindow({
      width: width + 16,
      height: height + 39,
      autoHideMenuBar: true,
      title: p,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "./show-img-preload.js"),
        nodeIntegration: true,
      },
    });
    newWindows[i].loadFile(path.join(__dirname, "../src/show-img.html"));

    newWindows[i].on("ready-to-show", () => {
      newWindows[i].webContents.send("get-img", {
        img: file.toString("base64"),
        width,
        height,
      });
      newWindows[i].show();
    });
  });

  ipcMain.on("show-img.html-contextmenu", (e) => {
    console.log("trigger");
    const menu = new Menu();
    menu.append(
      new MenuItem({
        // accelerator: "Ctrl+Shift+I", //快捷鍵
        label: "Toggle Devtools",
        click() {
          e.sender.toggleDevTools();
        },
      })
    );
    menu.append(
      new MenuItem({
        accelerator: "Ctrl+Shift+I", //快捷鍵
        label: "Close All",
        click() {
          console.log("ctrl+shift+e");
          newWindows.forEach((win) => win.close());
        },
      })
    );
    menu.append(new MenuItem({ type: "separator" }));
    menu.append(
      new MenuItem({
        label: "item-3",
        click() {
          console.log("3333");
        },
      })
    );

    menu.popup({ window: BrowserWindow.fromWebContents(e.sender) });
  });
});
