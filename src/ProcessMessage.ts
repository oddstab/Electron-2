import { BrowserWindow, ipcMain } from "electron";

export default class ProcessMessage {
  win: BrowserWindow;

  /**
   * 進程通信
   * @param win
   */
  constructor(win: BrowserWindow) {}

  init() {
    this.watch();
    this.on();
  }

  /**
   * 監聽渲染進程事件通信
   */
  watch() {
    ipcMain.on("page-ready", () => {
      this.sendFocus(false);
    });
  }

  /**
   * 監聽窗口,app,等模塊事件
   */
  on() {
    this.win.on("focus", () => this.sendFocus(true));
    this.win.on("blur", () => this.sendFocus(false));
  }

  /**
   * 窗口聚焦事件
   * @param isActive
   */
  sendFocus(isActive: boolean) {
    this.win.webContents.send("win-focus", isActive);
  }
}
