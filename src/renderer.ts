import { Stream, Writable } from "stream";
import {
  exec,
  spawn,
  ChildProcess,
  ChildProcessWithoutNullStreams,
} from "child_process";
import { remote, ipcRenderer } from "electron";
import * as iconv from "iconv-lite";
import * as path from "path";
import * as fs from "fs";
import * as pty from "node-pty";

const { BrowserWindow, dialog } = remote;
const SCROLL_POS = "__SCROLL_TOP__";

let isFullScreen = false; //是否為全螢幕
// let terminal: ChildProcess = null; //終端機

function addPart(id: string, func: () => void) {
  document.querySelector(`#${id} > button`).addEventListener("click", func);
}

function setTitleBar() {
  let mainWindow = remote.getCurrentWindow();
  let iconDiv: HTMLDivElement = document.querySelector(".icon");

  iconDiv.style.backgroundImage = "url(../src/favicon.ico)";
  document.querySelector(".title >.text").innerHTML = mainWindow.title;

  document
    .querySelector(".title-bar .min")
    .addEventListener("click", () => mainWindow.minimize());
  document.querySelector(".title-bar .max").addEventListener("click", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  document
    .querySelector(".title-bar .close")
    .addEventListener("click", () => mainWindow.close());
}

/**
 * 紀錄滾動位置
 */
function saveScrollPosition() {
  document.querySelector(".container").addEventListener("scroll", (e) => {
    if (remote.getCurrentWindow().isMaximized()) {
      console.log("ismax", remote.getCurrentWindow().isMaximized());
      return;
    }

    if (remote.getCurrentWindow().isFullScreen()) {
      return;
    }

    let div = e.target as HTMLDivElement;
    localStorage.setItem(SCROLL_POS, div.scrollTop.toString());
  });
}

/**
 * 讀取滾動位置
 */
function readScrollPosition() {
  const scroll = () => {
    let div: HTMLDivElement = document.querySelector(".container");
    div.scrollTo({ top: Number(localStorage.getItem(SCROLL_POS)) });
  };
  remote.getCurrentWindow().on("enter-full-screen", scroll);
  remote.getCurrentWindow().on("resize", scroll);
  scroll();
}

readScrollPosition();
saveScrollPosition();
setTitleBar();

//取得系統資訊
addPart("system-info", () => {
  console.log(process.env);
  document.querySelector("#system-info > div").innerHTML =
    "例如目前檔案路徑是：" + process.env.INIT_CWD;
});

//系統通知
addPart("system-notification", () => {
  const myNotification = new Notification("通知", {
    body: "哈哈是我啦",
    icon: "../dist/logo.png",
  });

  myNotification.onclick = () => {
    console.log("哈哈你點到我了");
  };
});

//執行cmd命令
// addPart("run-cmd", () => {
//   let cmd: HTMLInputElement = document.querySelector("#run-cmd > input");
//   exec(cmd.value, { encoding: "buffer" }, (err, stdout, stderr) => {
//     console.log("執行完畢");
//     let out = iconv.decode(stdout, "cp950"); //解決中文亂碼問題
//     console.log({ err, out, stderr });
//     document.querySelector("#run-cmd > div").innerHTML = cmd.value + "<br/>";
//     document.querySelector("#run-cmd > div").innerHTML += out.replace(
//       /\n/gi,
//       "<br/>"
//     );
//   });
// });

//開啟新視窗
addPart("open-dialog", () => {
  //是否鎖定父級窗口
  const { checked: lockParent }: HTMLInputElement = document.querySelector(
    "#lock-parent"
  );

  const subWindow = new BrowserWindow({
    width: 500,
    height: 200,
    parent: lockParent ? remote.getCurrentWindow() : null, //取得父級(當前)窗口
    modal: lockParent, //要鎖定父級窗口的話此屬性也要打開
    show: false,
    backgroundColor: "#292a2d",
  });

  subWindow.loadFile(path.join(__dirname, "../src/sub.html"));
  subWindow.on("ready-to-show", () => subWindow.show());
  subWindow.menuBarVisible = false;
  subWindow.webContents.openDevTools();
});

//執行cmd
addPart("run-cmd", () => {
  ipcRenderer.send("fuck", "test");
  // console.log(pty);

  // 在windows下的用法
  // let t = spawn("cmd", [
  //   "/c",
  //   "C:\\Users\\User\\Desktop\\TestApp\\Test\\Test\\bin\\Debug\\netcoreapp3.1\\Test.exe",
  // ],{
  //   stdio:"pipe"
  // });

  return;
  let s = new Writable();

  s._write = function (data) {
    console.log(data.toString());
  };

  let t = spawn(
    "cmd",
    [
      "/c",
      "C:\\Users\\User\\Desktop\\TestApp\\Test\\Test\\bin\\Debug\\netcoreapp3.1\\Test.exe",
    ],
    {
      stdio: ["pipe", "inherit", "inherit"],
    }
  );

  t.stdin.pipe(s);

  t.stdin.write("QQ\r\n");

  // t.stdin.on("pipe", (src) => console.log(src));

  // t.stdout.on("data", (data) => {
  //   console.log(data.toString());
  //   // console.log(iconv.decode(data, "cp950"));
  //   // t.stdin.write("ha\r\n");
  // });

  // t.stderr.on("data", (err) => {
  //   console.log(iconv.decode(err, "cp950"));
  // });

  // // process.stdin.pipe(t.stdin);

  // document
  //   .querySelector("#run-exe>.cmd-input>button")
  //   .addEventListener("click", () => {
  //     let { value: text }: HTMLInputElement = document.querySelector(
  //       "#run-exe>.cmd-input>input"
  //     );

  //     t.stdin.write(text + "\r\n", "utf-8");
  //     t.stdin.end();
  //     // t.stdin.end("ASD");
  //   });
});

//全螢幕
addPart("open-fullscreen", () => {
  let current = remote.getCurrentWindow();
  isFullScreen = !isFullScreen;
  current.setFullScreen(isFullScreen);

  document.querySelector("#open-fullscreen>button").innerHTML = isFullScreen
    ? "離開全螢幕"
    : "執行";
});

addPart("restart-app", () => {
  //是否詢問
  let needConfirm: boolean = (document.querySelector(
    "#need-confirm"
  ) as HTMLInputElement).checked;

  ipcRenderer.send("restart-app", needConfirm);
});
