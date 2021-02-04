import { ipcRenderer } from "electron";

ipcRenderer.on("get-img", (e, val) => {
  let img = document.querySelector("img");
  img.oncontextmenu = (e) => {
    e.preventDefault();
    ipcRenderer.send("show-img.html-contextmenu");
  };
  img.ondragstart = () => false;
  img.onselectstart = () => false;
  img.onselect = () => false;
  console.log(document.querySelector("img"));
  console.log(val);
  img.width = val.width;
  img.src = "data:image/jpeg;base64," + val.img;
});
