const { app, BrowserWindow, ipcMain, net, protocol, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const request = require('request');
const progress = require('request-progress');
const zl = require("zip-lib");
const express = require('express');
const e = require('express');
const move = require('fs-move');
const { title } = require('process');

var launcherWindow = {
    width: 1280,
    height: 720,
    resizable: false,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: 'rgba(0,0,0,0)',
        symbolColor: '#000000',
        height: 10
    },
    webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'ipc.js')
    }
};

var mmiWindow = {
    width: 1280,
    height: 720,
    resizable: false,
    fullscreenable: false,
    minimizable: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: 'rgba(0,0,0,0)',
        symbolColor: '#000000',
        height: 10
    },
    webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'ipc.js')
    }
};
var win;
var execName = [
    "KadeEngine",
    "PsychEngine",
    "Funkin"
];
request('https://ffm-backend.web.app/engines.json', (err, res, body) => {
    var json = JSON.parse(body);
    execName = json.execName;
});
if (!fs.existsSync(path.join(__dirname, 'engines'))) {
    fs.mkdirSync(path.join(__dirname, 'engines'), { recursive: true });
}
if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('flmod', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('flmod')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore()
            win.focus()
        }
        var url = commandLine.pop();
        if (url.startsWith('flmod:')) {
            mmi = new BrowserWindow(mmiWindow);
            mmi.loadFile(path.join(__dirname, 'static', 'mmi.html'));
            mmi.webContents.executeJavaScript('receiveUrl("' + url + '");');
        }
    })
}


function createWindow() {
    var launchLauncher = true;
    process.argv.forEach((val, index) => {
        if (val.startsWith('flmod:')) {
            mmi = new BrowserWindow(mmiWindow);
            mmi.loadFile(path.join(__dirname, 'static', 'mmi.html'));
            mmi.webContents.executeJavaScript('receiveUrl("' + val + '");');
            launchLauncher = false;
        }
    });

    if (launchLauncher) {
        win = new BrowserWindow(launcherWindow);
    }

    ipcMain.on('import-engine', (event, engineID) => {
        // prompt user to select a folder
        console.log('importing engine...');
        dialog.showOpenDialog(win, { properties: ['openDirectory'] }).then((result) => {
            if (!result.canceled) {
                var src = result.filePaths[0];
                var dest = path.join(__dirname, 'engines', 'engine' + engineID);
                move(src, dest, err => {
                    if (err) {
                      throw err;
                    }
                    win.webContents.executeJavaScript('window.alert("Imported engine successfully! Please note that the files were moved, not copied.");onGameClose();');
                });
            }
        });
    });
    ipcMain.on('download-engine', (event, engineID) => {
        downloadEngine(engineID);
    });
    ipcMain.on('open-engine-folder', (event) => {
        exec('explorer.exe ' + path.join(__dirname, 'engines'), (err, stdout, stderr) => {});
    });
    ipcMain.on('remove-engine', (event, engineID) => {
        fs.rmSync(path.join(__dirname, 'engines', 'engine' + engineID), { recursive: true });
    });
    ipcMain.on('load-game', (event, engineID) => {
        win.webContents.executeJavaScript('onGameLoad();');
        var gamePath = __dirname + "\\engines\\engine" + engineID + "\\" + execName[engineID] + ".exe";
        if (!fs.existsSync(gamePath)) {
            win.webContents.executeJavaScript('promptDownload();');
            return;
        }

            exec('start ' + execName[engineID], { cwd: path.join(__dirname, 'engines', 'engine' + engineID) }, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    win.webContents.executeJavaScript('onUnexpectedGameClose();');
                    return;
                }
                console.log(stdout);
                win.webContents.executeJavaScript('onGameClose();');
            });
    });
    ipcMain.on('open-settings', (event) => {
        var sw = new BrowserWindow({
            width: 800,
            height: 600,
            resizable: false,
            fullscreenable: false,
            minimizable: false,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'ipc.js')
            }
        });
        sw.loadFile(path.join(__dirname, 'static', 'settings.html'));
        sw.webContents.executeJavaScript('passData("' + fs.readdirSync(path.join(__dirname, 'engines')).join(',') + '");');   
    });
    ipcMain.on('load-mm', (event, engineID) => {
        // ENGINEID IS IRRELEVANT FOR MM
        win.webContents.executeJavaScript('onGameLoad();');
        var gamePath = __dirname + "\\engines\\engine1\\PsychEngine.exe";
        if (!fs.existsSync(gamePath)) {
            win.webContents.executeJavaScript('promptDownload();');
            return;
        }

            exec('' + execName[engineID] + ' -mm', { cwd: path.join(__dirname, 'engines', 'engine' + engineID) }, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    win.webContents.executeJavaScript('onUnexpectedGameClose();');
                    return;
                }
                console.log(stdout);
                win.webContents.executeJavaScript('onGameClose();');
            });
    });

    if (launchLauncher) {
        win.loadFile(path.join(__dirname, 'static', 'index.html'));
    }

    //win.webContents.executeJavaScript('window.alert("' + process.argv.join(',') + '")');
}
function downloadEngine(engineID) {
    console.log('installing some engines today...');

    fs.mkdirSync(path.join(__dirname, 'downloads'), { recursive: true });

    const downloadURL = "https://ffm-backend.web.app/e" + engineID + ".zip";
    const downloadPath = path.join(__dirname, 'downloads', 'engine' + engineID + '.zip');

    progress(request(downloadURL))
        .on('progress', (state) => {
            console.log('percent: ' + Math.round(state.percent * 100) + '%');
            win.webContents.executeJavaScript('updateProgress("' + Math.round(state.percent * 100) + '%");');
        })
        .on('error', (err) => {
            console.error(err);
            win.webContents.executeJavaScript('onDownloadError();');
        })
        .on('end', () => {
            fs.mkdirSync(path.join(__dirname, 'engines', 'engine' + engineID), { recursive: true });
            zl.extract(downloadPath, path.join(__dirname, 'engines', 'engine' + engineID), (err) => {
                if (err) {
                    console.error(err);
                    win.webContents.executeJavaScript('onDownloadError();');
                    return;
                }
                fs.rmSync(downloadPath, { recursive: true });
            });
            win.webContents.executeJavaScript('onDownloadComplete();');
        })
        .pipe(fs.createWriteStream(downloadPath));
}
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

var mmi;
ipcMain.on('install-mod', (event, url, ed) => {
    console.log('installing mod...');
    fs.mkdirSync(path.join(__dirname, 'downloads'), { recursive: true });

    const downloadPath = path.join(__dirname, 'downloads', 'mod-' + btoa(url) + '.zip');

    progress(request(url))
        .on('progress', (state) => {
            console.log('percent: ' + Math.round(state.percent * 100) + '%');
            mmi.webContents.executeJavaScript('updateProgress("' + Math.round(state.percent * 100) + '%");');
        })
        .on('error', (err) => {
            console.error(err);
            mmi.webContents.executeJavaScript('onDownloadError();');
        })
        .on('end', () => {
            zl.extract(downloadPath, path.join(__dirname, 'engines', 'engine' + ed, 'mods'), (err) => {
                if (err) {
                    console.error(err);
                    mmi.webContents.executeJavaScript('onDownloadError();');
                    return;
                }
                fs.rmSync(downloadPath, { recursive: true });
            });
            mmi.webContents.executeJavaScript('onDownloadComplete();');
        })
        .pipe(fs.createWriteStream(downloadPath));
});

/*
const eapp = express();

eapp.get('/', (req, res) => {
    var url = req.query.url;
    mmi = new BrowserWindow({
        width: 1280,
        height: 720,
        resizable: false,
        fullscreenable: false,
        minimizable: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'ipc.js')
        }
    });
    mmi.loadFile(path.join(__dirname, 'static', 'mmi.html'));
    mmi.webContents.executeJavaScript('receiveUrl("' + url + '");');
    res.send('ok');
});

eapp.listen(3000, () => {
    console.log('Server is running on port 3000');
});
*/
// no longer needed

module.exports = this;