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
const chalk = require('chalk');
const progress = require('request-progress');
const URL = require('lite-url');
const zl = require("zip-lib");
const express = require('express');
const e = require('express');
const move = require('fs-move');
const { title } = require('process');
const { pathToFileURL } = require('url');
const { dbDeleteValue, dbGetAllEngines, dbReadValue, dbWriteValue } = require('./Database');

// Create AppData (for the logs)
var appDataPath = app.getPath('appData') + '\\FNF Launcher';

if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
}

// Migrate 1.4 engines to 1.5
if (fs.existsSync(path.join(__dirname, '../', 'engines'))) {
    fs.readdirSync(path.join(__dirname, '../', 'engines')).forEach((element) => {
        dbWriteValue(element, path.join(appDataPath, 'engines', element));
        move(path.join(__dirname, '../', 'engines', element), path.join(appDataPath, 'engines', element), (err) => {
            if (err) {
                console.error(err);
            }
        });
    });
}

// TODO: this function just acts as bridge but we need a firewall
function request(url, callback) {
    return require('request')(url, callback);
}


function isHealthy(url) {
    // TODO: sanitize url
    return true;
}

function formattedDate() {
    var date = new Date(Date.now());
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-logs';
}
  
// Print console to logs too
if (!fs.existsSync(path.join(appDataPath, 'logs'))) {
    fs.mkdirSync(path.join(appDataPath, 'logs'), { recursive: true });
}

var logStream = fs.createWriteStream(path.join(appDataPath, 'logs', formattedDate() + '.log'), { flags: 'w' });

// Better logs to terminal

const oldLog = console.log;
console.log = function (d) {
    const stack = new Error().stack.split('\n');
    const caller = stack[2].trim().split(' ');
    const fileName = caller[1].split('/').pop();
    const lineNumber = caller[caller.length - 1].split(':')[1];
    const logMessage = `${lineNumber.replace(__dirname, '')} ${d}`;
    logStream.write(logMessage + '\n');
    process.stdout.write(chalk.red(lineNumber.replace(__dirname, '')) + ': ' + d);
};


// Window configuration
var mmi;
var sw;
var win;

var launcherWindow = {
    width: 1280,
    height: 720,
    resizable: false,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: 'rgba(0,0,0,0)',
        symbolColor: '#000000',
        height: 50
    },
    webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'RendererIPC.js')
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
        preload: path.join(__dirname, 'RendererIPC.js')
    }
};

// Get executable names from our build host
var execName = [];
request('https://' + dbReadValue('engineSrc') + '/engines.json', (err, res, body) => {
    //console.log(body);
    var json = JSON.parse(body);
    execName = json.execName;
});


// Set flmod as default protocol for app (needed for 1-click mod installation)
if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('flmod', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('flmod')
}


// Check if a flmod link was clicked and open the app with the link
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
        if (url.startsWith('flmod://')) {
            mmi = new BrowserWindow(mmiWindow);
            mmi.loadFile(path.join(__dirname, '../', 'static', 'mmi.html'));
            mmi.webContents.on('did-finish-load', () => {
                mmi.webContents.executeJavaScript('receiveUrl("' + url.split('$')[0] + '", "' + url.split('$')[1] + '", "' + url.split('$')[2] + '");');
                mmi.webContents.executeJavaScript('localStorage.setItem("engineSrc","' + dbReadValue('engineSrc') + '");');
            });
        }
    })
}

function defineIPC() {
    eval(fs.readFileSync(path.join(__dirname, 'MainIPC.js')).toString());
}


function createWindow() {
    var launchLauncher = true;
    process.argv.forEach((val, index) => {
        if (val.startsWith('flmod://')) {
            var url = val;
            mmi = new BrowserWindow(mmiWindow);
            mmi.loadFile(path.join(__dirname, '../', 'static', 'mmi.html'));
            if (!isHealthy(url)) return;
            mmi.webContents.on('did-finish-load', () => {
                mmi.webContents.executeJavaScript('receiveUrl("' + url.split('$')[0] + '", "' + url.split('$')[1] + '", "' + url.split('$')[2] + '");');
                mmi.webContents.executeJavaScript('localStorage.setItem("engineSrc","' + dbReadValue('engineSrc') + '");');
            });
            launchLauncher = false;
        }
    });

    if (launchLauncher) {
        win = new BrowserWindow(launcherWindow);
    }

    defineIPC();

    if (launchLauncher) {
        win.loadURL(path.join(__dirname, '../', 'static', 'index.html'));
        win.webContents.on('did-finish-load', () => {
            win.webContents.executeJavaScript('versionPass("' + require('../package.json').version + '");');
            win.webContents.executeJavaScript('localStorage.setItem("engineSrc","' + dbReadValue('engineSrc') + '");');
        });
    }

    //win.webContents.executeJavaScript('window.alert("' + process.argv.join(',') + '")');
}
function downloadEngine(engineID) {
    console.log('installing some engines today...');

    dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    }).then(result => {
        if (result.canceled) {
            win.show();
            win.webContents.executeJavaScript('promptDownload();');
            console.log('User canceled the directory selection');
            return;
        }

        const selectedPath = result.filePaths[0];
        const downloadPath = path.join(selectedPath, 'temp_e' + engineID + '.zip');
        const extractPath = path.join(selectedPath);

        fs.mkdirSync(selectedPath, { recursive: true });

        const downloadURL = "https://" + dbReadValue('engineSrc') + "/e" + engineID + ".zip";
        console.log(downloadURL);

        progress(request(downloadURL))
            .on('progress', (state) => {
                console.log('percent: ' + Math.round(state.percent * 100) + '%');
                win.webContents.executeJavaScript('updateProgress(' + Math.round(state.percent * 100) + ');');
            })
            .on('error', (err) => {
                console.error(err);
                win.webContents.executeJavaScript('onDownloadError();');
            })
            .on('end', () => {
                dbWriteValue('engine' + engineID, extractPath);
                zl.extract(downloadPath, extractPath, (err) => {
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
    }).catch(err => {
        console.error(err);
        win.webContents.executeJavaScript('returnToMainMenu();');
    });
}



app.whenReady().then(() => {
    request('https://ffm-backend.web.app/version.json', (err, res, body) => {
        var ver = JSON.parse(body).version;
        var blist = ['Let\'s update','Later (not reccomended)'];
        if (require('../package.json').version != ver) {
            dialog.showMessageBox({
                title: 'Update available',
                message: 'An update is available for FNF Launcher. ' + require('../package.json').version + ' -> ' + ver,
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

ipcMain.on('security-alert', (event, setHost, host) => {
    if (!setHost) {
        dialog.showMessageBox({
            title: 'Security Alert',
            message: 'Warning! Third party servers are not controlled by us and may be harmful. We do not take responsibility for any damage caused by third party servers and their content. Please be sure to trust the author of this build host before proceeding.',
            buttons: ['Ok']
        });
    }
    else {
        dialog.showMessageBox({
            title: (host == 'ffm-backend.web.app' ? 'Warning' : 'Security Warning'),
            message: (host == 'ffm-backend.web.app' ? 'Are you sure you want to make these changes?' : 'Warning! Third party servers are not controlled by us and may be harmful. We do not take responsibility for any damage caused by third party servers and their content. Please be sure to trust the author of this build host before proceeding. Are you sure you want to trust ' + host + ' and use it as your build host?'),
            buttons: ['Yes','No'],
            defaultId: 1
        }).then((result) => {
            if (result.response == 0) {
                dbWriteValue('engineSrc', host);
                dialog.showMessageBox({
                    message: 'The app will now restart to apply the changes.',
                }).then(() => {
                    app.relaunch();
                    app.quit();
                });
            }
        });
    }
});

ipcMain.on('install-mod', (event, url, ed) => {
    console.log('installing mod...');
    fs.mkdirSync(path.join(appDataPath, 'downloads'), { recursive: true });

    if (dbReadValue('engine' + ed) == undefined) {
        mmi.webContents.executeJavaScript('onEngineNotInstalled();');
        return;
    }

    const downloadPath = path.join(appDataPath, 'downloads', 'mod-' + btoa(url) + '.zip');

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
            zl.extract(downloadPath, path.join(dbReadValue('engine' + ed), 'mods'), (err) => {
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
            preload: path.join(__dirname, '../', 'RendererIPC.js')
        }
    });
    mmi.loadFile(path.join(__dirname, '../', 'static', 'mmi.html'));
    mmi.webContents.executeJavaScript('receiveUrl("' + url + '");');
    res.send('ok');
});

eapp.listen(3000, () => {
    console.log('Server is running on port 3000');
});
*/
// no longer needed

module.exports = this;