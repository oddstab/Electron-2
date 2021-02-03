import { ipcRenderer } from "electron";

console.log(ipcRenderer);

ipcRenderer.on("get-img", (e, val) => {
  console.log(e, val);
  alert(typeof val);
});

// let myimg = "123";

// alert("1234");

// window.onload = () => {
//   let s = document.querySelector("img");
//   console.log(s);
// };
