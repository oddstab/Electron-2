import { remote } from "electron";
import React, { useState } from "react";
import { useEffect } from "react";

const TitleBar: React.FC = () => {
  const [mainWindow] = useState(remote.getCurrentWindow());
  const [text] = useState(mainWindow.title);

  const handleMaximize = () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  };

  return (
    <div className="title-bar">
      <div className="title">
        <div
          className="icon"
          style={{ backgroundImage: "url(../src/favicon.ico)" }}
        ></div>
        <div className="text">{text}</div>
      </div>
      <div className="buttons">
        <button className="min" onClick={() => mainWindow.minimize()}>
          &minus;
        </button>
        <button className="max" onClick={handleMaximize}>
          🗖
        </button>
        <button className="close" onClick={() => mainWindow.close()}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
