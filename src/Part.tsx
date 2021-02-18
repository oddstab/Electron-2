import { IpcMain } from "electron";
import * as React from "react";

interface IPart {
  title: string;
}

const Part: React.FC<IPart> = ({ title, children }) => {
  return (
    <fieldset>
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
};

export default Part;
