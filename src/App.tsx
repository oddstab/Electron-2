import React, { useEffect, useRef, useState } from "react";
import Part from "./Part";
import TitleBar from "./components/TitleBar";
import { remote, shell, clipboard } from "electron";
import path from "path";
import "./init";
import fs from "fs";

const { Menu } = remote;
const SCROLL_POS = "__SCROLL_TOP__";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [appdata, setAppdata] = useState("");
  const [lockParent, setLockParent] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [windowCount, setWindowCount] = useState(1);
  const [filesPath, setFilesPath] = useState<any[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [currentViewFile, setCurrentViewFile] = useState("");

  /**
   * 取得系統資訊
   */
  const getSystemInfo = () => {
    console.log(process.env);
    setAppdata("%APPDATA%: " + process.env["APPDATA"]);
  };

  /**
   * 發送系統通知
   */
  const sendNotification = () => {
    const notification = new Notification("哈哈是我啦", {
      body: "通知來囉",
      icon: "../src/favicon.ico",
    });

    notification.onclick = () => {
      console.log("哈哈是我啦...");
    };
  };

  /**
   * 開啟新視窗
   */
  const openNewWindow = () => {
    const subWindow = new remote.BrowserWindow({
      title: subTitle ? subTitle : "sub-window",
      width: 500,
      height: 200,
      parent: lockParent ? remote.getCurrentWindow() : null, //取得父級(當前)窗口
      modal: lockParent, //要鎖定父級窗口的話此屬性也要打開
      show: false,
      backgroundColor: "#292a2d",
      webPreferences: {
        nodeIntegration: true,
      },
    });

    subWindow.loadFile(path.join(__dirname, "../src/sub.html"));
    subWindow.on("ready-to-show", () => {
      subWindow.title += ` - ${subWindow.id}`;
      subWindow.show();
    });
    subWindow.menuBarVisible = false;
    // subWindow.webContents.openDevTools();
    subWindow.on("closed", () => {
      setWindowCount(remote.BrowserWindow.getAllWindows().length);
    });
    setWindowCount(remote.BrowserWindow.getAllWindows().length);
  };

  /**
   * 選擇檔案
   */
  const selectFolder = async () => {
    const current = remote.getCurrentWindow();
    const paths = remote.dialog.showOpenDialogSync(current, {
      properties: ["openFile", "multiSelections"],
    });

    const filesData: { name: string; size: number }[] = [];

    if (!paths) {
      return;
    }

    paths.forEach((path) => {
      let size = Math.ceil(fs.statSync(path).size / 1024);
      filesData.push({
        name: path,
        size,
      });
      setFilesPath(filesData);
    });
  };

  useEffect(() => {
    /**
     * 讀取滾動位置
     */
    function readScrollPosition() {
      const scroll = () => {
        containerRef.current.scrollTo({
          top: Number(localStorage.getItem(SCROLL_POS)),
        });
      };
      remote.getCurrentWindow().on("enter-full-screen", scroll);
      remote.getCurrentWindow().on("resize", scroll);
      scroll();
    }

    /**
     * 紀錄滾動位置
     */
    function saveScrollPosition() {
      containerRef.current.addEventListener("scroll", (e) => {
        if (remote.getCurrentWindow().isMaximized()) {
          return;
        }

        if (remote.getCurrentWindow().isFullScreen()) {
          return;
        }

        let div = e.target as HTMLDivElement;
        localStorage.setItem(SCROLL_POS, div.scrollTop.toString());
      });
    }

    readScrollPosition();
    saveScrollPosition();
  }, []);

  return (
    <>
      <TitleBar />
      <div className="container" ref={containerRef}>
        <Part title="typescript出現export is not defined">
          <div>
            改成 <code>require("xxx")</code> 即可
          </div>
        </Part>
        <Part title="取得系統資訊">
          <button onClick={getSystemInfo}>取得</button>
          <div>{appdata}</div>
        </Part>
        <Part title="發送系統通知">
          <button onClick={sendNotification}>通知</button>
        </Part>
        <Part title="開啟新視窗">
          <button onClick={openNewWindow} style={{ marginRight: "10px" }}>
            開啟
          </button>
          {windowCount > 1 && (
            <button
              onClick={() => {
                const currentWindow = remote.getCurrentWindow();
                const allWindow = remote.BrowserWindow.getAllWindows();
                allWindow.forEach((w) => {
                  if (currentWindow.id !== w.id) {
                    w.close();
                  }
                });
                setWindowCount(remote.BrowserWindow.getAllWindows().length);
              }}
            >
              關閉{windowCount - 1}個視窗
            </button>
          )}
          <ul>
            <li>
              <input
                type="text"
                placeholder="輸入視窗標題"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
              />
            </li>
            <li>
              <input
                type="checkbox"
                name=""
                id="lock-parent"
                checked={lockParent}
                onChange={() => setLockParent(!lockParent)}
              />
              <label htmlFor="lock-parent">鎖定父級</label>
            </li>
          </ul>
        </Part>
        <Part title="讀取檔案大小">
          <button onClick={selectFolder} disabled={fileLoading}>
            選擇檔案
          </button>
          <span className="loading pl-1" hidden={!fileLoading}>
            讀取中
          </span>
          <ul>
            {filesPath.map((f) => {
              return (
                <li
                  className={`file-detail ${currentViewFile == f && "active"}`}
                  key={f.name}
                  title="在資料夾中顯示"
                  onClick={() => {
                    setCurrentViewFile(f);
                    shell.showItemInFolder(f.name);
                  }}
                  onContextMenu={() => {
                    const contextMenu = Menu.buildFromTemplate([
                      {
                        label: "開啟檔案",
                        accelerator: "Ctrl+O",
                        click: () => {
                          shell.openPath(f.name);
                        },
                      },
                      {
                        label: "複製檔案",
                        accelerator: "Ctrl+C",
                        click: () => {
                          const buffer = fs.readFileSync(f.name);
                          console.log(buffer);
                        },
                      },
                    ]);
                    contextMenu.popup();
                  }}
                >
                  <div>{f.name}</div>
                  <div>{f.size} KB</div>
                </li>
              );
            })}
          </ul>
        </Part>
        <Part title="逼逼">
          <button onClick={() => shell.beep()}>beep</button>
        </Part>
      </div>
    </>
  );
};

export default App;
