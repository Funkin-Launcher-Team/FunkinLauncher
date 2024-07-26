/*
 * FNF Launcher
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, 
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software 
 * is furnished to do so, subject to the following conditions:
 * 
 * 1) The software is not republished in any form, modified or unmodified, without the explicit permission of the original author.
 * 2) The software is not used for any commercial purposes, including but not limited to selling the software, selling services that use the software, or selling the software as part of a service.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
 * UNDER NO CIRCUMSTANCES SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH 
 * THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * Tool published under the MIT license.
 * https://gamebanana.com/tools/17526
*/



const { app, BrowserWindow, ipcMain, net, protocol, dialog, webContents, webFrame, shell } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const progress = require('request-progress');
const URL = require('lite-url');
const zl = require("zip-lib");
const express = require('express');
const e = require('express');
const move = require('fs-move');
const { title } = require('process');
const { pathToFileURL } = require('url');

function request(url, callback) {
    const allowedURLs = ['ffm-backend.web.app', 'fonts.gstatic.com', 'fonts.googleapis.com', 'gamebanana.com', 'mmdl.gamebanana.com',''];
    console.log("remote content requested from: " + new URL(url).hostname);
    if (allowedURLs.includes(new URL(url).hostname) || new URL(url).hostname.includes('gamebanana.com')) {
        return require('request')(url, callback);
    }
    else {
        callback("not allowed","","not allowed");
    }
}


var sw;

function isHealthy(url) {
    // TODO: sanitize url
    return true;
}
  

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
        if (!isHealthy(url)) return;
        if (url.startsWith('flmod:')) {
            mmi = new BrowserWindow(mmiWindow);
            mmi.loadFile(path.join(__dirname, 'static', 'mmi.html'));
            mmi.webContents.executeJavaScript('receiveUrl("' + url.split('$')[0] + '", "' + url.split('$')[1] + '", "' + url.split('$')[2] + '");');
        }
    })
}


function createWindow() {
    var launchLauncher = true;
    process.argv.forEach((val, index) => {
        if (val.startsWith('flmod:')) {
            var url = val;
            mmi = new BrowserWindow(mmiWindow);
            mmi.loadFile(path.join(__dirname, 'static', 'mmi.html'));
            if (!isHealthy(url)) return;
            mmi.webContents.executeJavaScript('receiveUrl("' + url.split('$')[0] + '", "' + url.split('$')[1] + '", "' + url.split('$')[2] + '");');
            launchLauncher = false;
        }
    });

    if (launchLauncher) {
        win = new BrowserWindow(launcherWindow);
    }

    ipcMain.on('reload-launcher', (event) => {
        if (win) {
            win.webContents.executeJavaScript('window.location.reload();');
        }
    });

    ipcMain.on('import-engine', (event, engineID) => {
        // prompt user to select a folder
        console.log('importing engine...');
        dialog.showOpenDialog(win, { properties: ['openDirectory'] }).then((result) => {
            if (!result.canceled) {
                var src = result.filePaths[0];
                var dest = path.join(__dirname, 'engines', 'engine' + engineID);
                move(src, dest, err => {
                    if (err) {
                        win.webContents.executeJavaScript('window.alert("An error occurred while importing the engine. Please try again.");onGameClose();');
                      throw err;
                    }
                    var elem = "";
                    fs.readdirSync(dest).forEach((element) => {
                        if (element.includes('.exe')) {
                            elem = element;
                        }
                    });
                    
                    fs.rename(path.join(dest, elem), path.join(dest, execName[engineID] + '.exe'), (err) => {
                        if (err) {
                            win.webContents.executeJavaScript('window.alert("An error occurred while renaming the engine. Please try again.");onGameClose();');
                            throw err;
                        }
                        win.webContents.executeJavaScript('window.alert("Imported engine successfully! Please note that the files were moved, not copied.");onGameClose();');
                    });
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
        sw = new BrowserWindow({
            parent: win,
            modal: true,
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
        var arrayOfStuff = [];
        sw.webContents.on('did-finish-load', () => {
            sw.webContents.executeJavaScript('passData("' + fs.readdirSync(path.join(__dirname, 'engines')).join(',') + '");');

            // im so sorry for this bulky ass code
            fs.readdirSync(path.join(__dirname, 'engines')).forEach((element) => {
                var atLeastOneMod = false;
                arrayOfStuff.push("<h3>" + execName[parseInt(element.replace('script','').replace('engine',''))] + "</h2>");
                fs.readdirSync(path.join(__dirname, 'engines', element, 'mods')).forEach((element2) => {
                    if (fs.lstatSync(path.join(__dirname, 'engines', element, 'mods', element2)).isDirectory()) {
                        arrayOfStuff.push("<p>" + element2 + "</p>");
                        atLeastOneMod = true;
                    }
                });
                if (!atLeastOneMod) arrayOfStuff.push("<p>No mods installed for this engine.</p>");
            });
            sw.webContents.executeJavaScript("showMods('" + arrayOfStuff.join('') + "')");  
        }); 
    });
    ipcMain.on('reload-settings', (event) => {
        if (sw) {
            sw.webContents.executeJavaScript('window.location.reload();');
            sw.webContents.executeJavaScript('passData("' + fs.readdirSync(path.join(__dirname, 'engines')).join(',') + '");');
            var arrayOfStuff = [];

            // im so sorry for this
            fs.readdirSync(path.join(__dirname, 'engines')).forEach((element) => {
                var atLeastOneMod = false;
                arrayOfStuff.push("<h3>" + execName[parseInt(element.replace('script','').replace('engine',''))] + "</h2>");
                fs.readdirSync(path.join(__dirname, 'engines', element, 'mods')).forEach((element2) => {
                    if (fs.lstatSync(path.join(__dirname, 'engines', element, 'mods', element2)).isDirectory()) {
                        arrayOfStuff.push("<p>" + element2 + "</p>");
                        atLeastOneMod = true;
                    }
                });
                if (!atLeastOneMod) arrayOfStuff.push("<p>No mods installed for this engine.</p>");
            });
            sw.webContents.executeJavaScript("showMods('" + arrayOfStuff.join('') + "')");  
        }
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
        win.loadURL(path.join(__dirname, 'static', 'index.html'));
        win.webContents.executeJavaScript('versionPass("' + require('./package.json').version + '");');
        win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
            if (new URL(details.url).protocol.startsWith('http')) {
                console.log("remote content requested from: " + new URL(details.url).hostname);
            }
            if (new URL(details.url).hostname.includes('gamebanana.com')) {
                callback({ cancel: false });
                return;
            }
            const allowedURLs = ['ffm-backend.web.app', 'fonts.gstatic.com', 'fonts.googleapis.com'];
            if (new URL(details.url).protocol == 'file:' || new URL(details.url).protocol == 'devtools:') {
                callback({ cancel: false });
                return;
            }

            if (!allowedURLs.includes(new URL(details.url).hostname)) {
                console.log('blocked request to ' + new URL(details.url).hostname);
                
            }
            else {
                callback({ cancel: false });
            }
        });
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
    request('https://ffm-backend.web.app/version.json', (err, res, body) => {
        var ver = JSON.parse(body).version;
        var blist = ['Let\'s update'];
        if (process.argv.includes('--nfu')) {
            blist.push('No, thanks');
        }
        if (require('./package.json').version != ver) {
            dialog.showMessageBox({
                title: 'Update available',
                message: 'An update is available for FNF Launcher. ' + require('./package.json').version + ' -> ' + ver,
                buttons: blist
            }).then((result) => {
                if (result.response == 0) {
                    shell.openExternal('https://gamebanana.com/tools/17526');
                    app.quit(0);
                }
                if (result.response == 1) {
                    console.log('User is a fricking geek cuz he used the funny flags');
                    createWindow();
                }
            });
        }
        else {
            createWindow();
        }
    });

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