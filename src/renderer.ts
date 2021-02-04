import { Stream, Writable } from "stream";
import {
  exec,
  spawn,
  ChildProcess,
  ChildProcessWithoutNullStreams,
} from "child_process";
import { remote, ipcRenderer, ipcMain } from "electron";
import { decode } from "iconv-lite";
import * as path from "path";
import * as fs from "fs";
import * as pty from "node-pty";
import { Terminal } from "xterm";

ipcRenderer.send("GET_KEY", "哈哈");

const { BrowserWindow, dialog } = remote;
const SCROLL_POS = "__SCROLL_TOP__";

let isFullScreen = false; //是否為全螢幕
let terminal: ChildProcessWithoutNullStreams = null; //終端機
let lastOutput: string = "";

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
  if (terminal && terminal.exitCode == null) {
    return;
  }

  function updateLastOutput(text: string) {
    lastOutput = text;
    document.querySelector(".cmd-input>p").innerHTML = text;
  }

  function updateCmdResult(text: string) {
    text = text.replace(/\r\n/gi, "<br/>");

    document.querySelector(".cmd-result").innerHTML += text + "<br/>";

    console.log(document.querySelector(".cmd-result").scrollHeight);
    document
      .querySelector(".cmd-result")
      .scrollTo({ top: document.querySelector(".cmd-result").scrollHeight });
  }

  function clearCmdResult() {
    document.querySelector(".cmd-result").innerHTML = "";
  }

  let cmd =
    "C:/Users/User/Desktop/TestApp/Test/Test/bin/Debug/netcoreapp3.1/Test.exe";

  let cmd1 = `cd /D "C:/Program Files (x86)/Steam/SteamApps/common/Don't Starve Together Dedicated Server/bin"`;

  let proc = spawn(
    "cmd.exe",
    [
      "/c",
      // "C:/Users/PC206/Desktop/ConsoleApp1/ConsoleApp1/bin/Debug/ConsoleApp1.exe",
      // "dir && C:/Users/PC206/Desktop/ConsoleApp1/ConsoleApp1/bin/Debug/ConsoleApp1.exe -dd",
      // "dir",
      // "chdir",
      "dontstarve_dedicated_server_nullrenderer.exe -console -cluster DST_Server -shard Caves",
    ] /* , ["-console,", "-cluster DST_Server", "-shard Master"] */,
    {
      cwd:
        "C:/Program Files (x86)/Steam/SteamApps/common/Don't Starve Together Dedicated Server/bin",
    }
  );

  proc.send;

  proc.on("exit", (code) => {
    console.log("exit code:", code);
    clearCmdResult();
  });

  proc.stdout.on("data", (data) => {
    let buffer = Buffer.from(data);
    // console.log(buffer);
    let str = decode(buffer, "utf-8");
    console.log(str);
    updateLastOutput(str);
    // console.log("on data:", str);
    // updateCmdResult(str);
  });

  proc.stdin.setDefaultEncoding("utf8");
  proc.stdout.setEncoding("utf8");

  terminal = proc;

  let btn: HTMLButtonElement = document.querySelector("#check-cmd");
  btn.disabled = false;
  btn.addEventListener("click", () => {
    console.log(terminal);
  });

  let resetBtn: HTMLButtonElement = document.querySelector("#run-cmd .reset");

  resetBtn.addEventListener("click", () => {
    terminal = null;
    btn.disabled = true;
    btn.removeEventListener("click", () => {
      console.log(terminal);
    });
  });

  let inputBtn: HTMLButtonElement = document.querySelector(".cmd-input>button");
  inputBtn.addEventListener("click", () => {
    let val = (document.querySelector(".cmd-input>input") as HTMLInputElement)
      .value;

    if (!val) {
      return;
    }

    terminal.stdin.write(val + "\r\n");
  });
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

addPart("open-terminal", () => {
  ipcRenderer.send("open-terminal");
});

addPart("read-file", () => {
  let fileName = path.join(__dirname, "../src/terminal.html");
  fs.readFile(fileName, (_, data) => {
    console.log(data.toString());
  });
});

let readFileEl: HTMLFieldSetElement = document.querySelector("#read-file");

readFileEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

readFileEl.addEventListener("dragenter", () => {
  if (!readFileEl.querySelector("p").classList.contains("active")) {
    readFileEl.querySelector("p").classList.add("active");
  }
});

readFileEl.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();

  readFileEl.querySelector("p").classList.remove("active");

  let files = Array.from(e.dataTransfer.files);

  ipcRenderer.send(
    "show-img",
    files.map((f) => f.path)
  );
});
