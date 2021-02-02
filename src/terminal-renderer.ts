import { Terminal } from "xterm";
import { ipcRenderer } from "electron";

let t = new Terminal();

t.open(document.querySelector("#terminal"));
t.write("Hello");

t.onData((e) => {
  console.log(e);
  ipcRenderer.send("GET_KEY", e);
});
