import { Terminal } from "xterm";
import { ipcRenderer } from "electron";

let t = new Terminal();

t.open(document.querySelector("#terminal"));

t.onData((e) => {
  ipcRenderer.send("terminal.keystroke", e);
});

ipcRenderer.on("terminal.incomingData", (e, val) => {
  t.write(val);
});
