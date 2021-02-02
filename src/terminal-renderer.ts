import { Terminal } from "xterm";

let t = new Terminal();

t.open(document.querySelector("#terminal"));
t.write("Hello");

t.onData((e) => {
  console.log(e);
});
