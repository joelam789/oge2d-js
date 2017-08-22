import { app, BrowserWindow, dialog, ipcMain } from "electron";

import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as jsonstringify from 'json-stringify-deterministic';

let win = null;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({title: "Editor", width: 1280, height: 720, autoHideMenuBar: true, darkTheme: true});

    // and load the index.html of the app.
    //win.loadURL('file://' + __dirname + '/index.html');
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    //win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => createWindow());

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

ipcMain.on("show-select-img-dlg", (event) => {
    dialog.showOpenDialog({
        defaultPath: __dirname,
        filters: [ { name: 'Images', extensions: ['jpg', 'png', 'bmp'] } ],
    }, (filename) => {
        event.sender.send('select-img-dlg-return', filename ? filename : "");
    });
});

ipcMain.on("copy-tileset-img", (event, input) => {
    //console.log(input);
    let output = "img/tilesets/" + path.basename(input);
    let outputFilepath = __dirname + "/" + output;
    if (fs.existsSync(outputFilepath)) fs.unlinkSync(outputFilepath);
    fs.createReadStream(input).pipe(fs.createWriteStream(outputFilepath)
    .on("close", () => event.sender.send('copy-tileset-img-return', {err: null, url: output}))
    .on("error", (err) => event.sender.send('copy-tileset-img-return', {err: err, url: ""})));
});

ipcMain.on("save-tileset", (event, input) => {
    //console.log(input);
    let tileset = JSON.parse(JSON.stringify(input));
    for (let tile of tileset.tiles) {
        if (tile.id != undefined) delete tile.id;
        if (tile.cost != undefined && tile.cost == 0) delete tile.cost;
        if (tile.speed != undefined && tile.speed == 0) delete tile.speed;
    }
    let keys = [];
    //let jsonstr = JSON.stringify(tileset, null, 4);
    let jsonstr = jsonstringify(tileset, {
        space: '\t',
        stringify: (value, replacer, space) => {
            let key = keys.pop();
            return key == "offsets" && typeof value == "string" ? value : JSON.stringify(value);
        }, 
        compare: (a, b) => {
            if (typeof a.value === "number" && typeof b.value !== "number" && typeof b.value !== "string") return -1;
            else return a.key.length > b.key.length ? 1 : -1;
        },
        replacer: (k, v) => {
            keys.push(k);
            return k == "offsets" && Array.isArray(v) ? JSON.stringify(v) : v;
        }
    });
    let output = "json/tilesets/" + tileset.name + ".json";
    let outputFilepath = __dirname + "/" + output;
    if (fs.existsSync(outputFilepath)) fs.unlinkSync(outputFilepath);
    fs.writeFile(outputFilepath, jsonstr, 
    (err) => {
        if (err) event.sender.send('save-tileset-return', {err: err, url: ""});
        else event.sender.send('save-tileset-return', {err: null, url: output});
    });
});

ipcMain.on("get-tileset-list", (event) => {
    fs.readdir(__dirname + "/json/tilesets", (err, files) => {
        if (err) event.sender.send('get-tileset-list-return', []);
        else {
            let list = [];
            for (let filepath of files) {
                let file = path.basename(filepath);
                let pos = file.indexOf(".json");
                if (pos > 0) list.push(file.substring(0, pos));
            }
            event.sender.send('get-tileset-list-return', list);
        }
    });
});

ipcMain.on("save-tilemap", (event, input) => {
    //console.log(input);
    let tilemap = JSON.parse(JSON.stringify(input));
    let keys = [];
    let jsonstr = jsonstringify(tilemap, {
        space: '\t',
        stringify: (value, replacer, space) => {
            let key = keys.pop();
            return key == "ids" && typeof value == "string" ? value : JSON.stringify(value);
        }, 
        compare: (a, b) => {
            if (Array.isArray(a.value) && Array.isArray(b.value)) return a.value.length > b.value.length ? 1 : -1;
            else if (Array.isArray(a.value) && !Array.isArray(b.value)) return 1;
            else if (!Array.isArray(a.value) && Array.isArray(b.value)) return -1;
            else if (typeof a.value === "number" && typeof b.value === "string") return 1;
            else if (typeof a.value === "string" && typeof b.value === "number") return -1;
            else if (typeof a.value === "string" && typeof b.value === "string") return a.key.length > b.key.length ? 1 : -1;
            else return a.key > b.key ? -1 : 1;
        },
        replacer: (k, v) => {
            keys.push(k);
            return k == "ids" && Array.isArray(v) ? JSON.stringify(v) : v;
        }
    });
    let output = "json/tilemaps/" + tilemap.name + ".json";
    let outputFilepath = __dirname + "/" + output;
    if (fs.existsSync(outputFilepath)) fs.unlinkSync(outputFilepath);
    fs.writeFile(outputFilepath, jsonstr, 
    (err) => {
        if (err) event.sender.send('save-tilemap-return', {err: err, url: ""});
        else event.sender.send('save-tilemap-return', {err: null, url: output});
    });
});

ipcMain.on("get-tilemap-list", (event) => {
    fs.readdir(__dirname + "/json/tilemaps", (err, files) => {
        if (err) event.sender.send('get-tilemap-list-return', []);
        else {
            let list = [];
            for (let filepath of files) {
                let file = path.basename(filepath);
                let pos = file.indexOf(".json");
                if (pos > 0) list.push(file.substring(0, pos));
            }
            event.sender.send('get-tilemap-list-return', list);
        }
    });
});
