// import { app, BrowserWindow } from 'electron';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { remote, BrowserWindow } = require('electron');

console.log(app);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile('index.html');
};

app.whenReady().then(() => {
  createWindow();
});
