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
 * Tool published under the CC license (see README).
 * https://gamebanana.com/tools/17526
*/


const { app, BrowserWindow, ipcMain, net, protocol, dialog, webContents, webFrame, shell, Notification } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const progress = require('request-progress');
const URL = require('lite-url');
const zl = require("zip-lib");
const rar = require("unrar");
const seven = require('node-7z');
const express = require('express');
const e = require('express');
const move = require('fs-move');
const { title } = require('process');
const { pathToFileURL } = require('url');
const { dbDeleteValue, dbGetAllEngines, dbReadValue, dbWriteValue, appDataPath } = require('./Database');


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
var formalName = [];
request('https://' + dbReadValue('engineSrc') + '/engines.json', (err, res, body) => {
    //console.log(body);
    var json = JSON.parse(body);
    execName = json.execName;
    formalName = json.formalName;
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
            win.webContents.executeJavaScript('versionPass("' + require('../package.json').version + (process.argv.includes('frombatch') ? '-BETA' : '') + '");');
            win.webContents.executeJavaScript('localStorage.setItem("engineSrc","' + dbReadValue('engineSrc') + '");');
        });
    }

    //win.webContents.executeJavaScript('window.alert("' + process.argv.join(',') + '")');
}

function downloadEngine(engineID) {
    console.log('Installing engine...');

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
        const downloadPath = path.join(selectedPath, `temp_e${engineID}.zip`);
        const extractPath = path.join(selectedPath, `engine_${engineID}`);

        fs.mkdirSync(selectedPath, { recursive: true });

        const downloadURL = `https://${dbReadValue('engineSrc')}/e${engineID}.zip`;
        console.log(`Downloading from ${downloadURL}`);

        var startTime = Date.now();

        progress(request(downloadURL))
            .on('progress', (state) => {
                console.log('percent: ' + Math.round(state.percent * 100) + '%');
                var elapsedTime = Date.now() - startTime;
                var dlspeed = Math.round((state.size.transferred / elapsedTime) / (1024 * 1024) * 1000) / 1000;
                win.webContents.executeJavaScript('updateProgress(' + Math.round(state.percent * 100) + ', ' + dlspeed + ');');
            })
            .on('error', (err) => {
                console.error(err);
                win.webContents.executeJavaScript('onDownloadError();');
            })
            .on('end', async () => {
                try {
                    fs.mkdirSync(extractPath, { recursive: true });

                    console.log('Download complete. Extracting...');
                    await extractFile(downloadPath, extractPath);
                    
                    fs.rmSync(downloadPath, { recursive: true });

                    dbWriteValue(`engine${engineID}`, extractPath);
                    
                    win.webContents.executeJavaScript('onDownloadComplete();');
                    
                    const notification = new Notification({
                        title: 'Download Complete',
                        body: 'The engine download and installation are complete.',
                    });
                    notification.show();
                } catch (err) {
                    console.error(err);
                    win.webContents.executeJavaScript('onDownloadError();');
                }
            })
            .pipe(fs.createWriteStream(downloadPath));
    }).catch(err => {
        console.error(err);
        win.webContents.executeJavaScript('returnToMainMenu();');
    });
}



app.whenReady().then(() => {
    request('https://ffm-backend.web.app/version.json', (err, res, body) => {
        if (err) {
            console.error("Failed to fetch the version data:", err);
            createWindow();
            return;
        }
        // intCV and AV or whatever the fuck that was hurted my brain
        const remoteVersion = JSON.parse(body).version;
        const currentVersion = require('../package.json').version;

        const intRemoteVersion = parseInt(remoteVersion.replace(/\./g, ''));
        const intCurrentVersion = parseInt(currentVersion.replace(/\./g, ''));

        if (intRemoteVersion > intCurrentVersion) {
            dialog.showMessageBox({
                title: 'Update available',
                message: `An update is available for FNF Launcher. ${currentVersion} -> ${remoteVersion}`,
                buttons: ['Update now', 'Later (not recommended)']
            }).then((result) => {
                if (result.response === 0) {
                    const updatePath = __dirname;
                    console.log(`Updating at ${updatePath}`);
                    downloadAndUpdate(updatePath, remoteVersion, JSON.parse(body).vlink);
                } else {
                    console.log('User chose to skip the update.');
                    createWindow();
                }
            });
        } else {
            console.log('No update is needed.');
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

function downloadAndUpdate(selectedPath, remoteVersion, downloadURL) {
        const zipPath = path.join(selectedPath, btoa(remoteVersion).replace('=','') + '_update.zip');

        console.log(`Downloading update from ${downloadURL} to ${zipPath}`);

        progress(request(downloadURL))
            .on('progress', (state) => {
                console.log(`Download progress: ${Math.round(state.percent * 100)}%`);
            })
            .on('error', (err) => {
                console.error('Download failed:', err);
                dialog.showMessageBox({
                    title: 'Update Error',
                    message: 'The update failed to download. Please try again later.',
                    buttons: ['OK']
                });
            })
            .on('end', () => {
                console.log('Download complete. Installing update...');
                extractFile(zipPath, selectedPath)
                    .then(() => {
                        console.log('Update installed successfully!');
                        dialog.showMessageBox({
                            title: 'Update Complete',
                            message: 'The update has been installed successfully. Please restart the application for the changes to take effect.',
                            buttons: ['OK']
                        }).then(result => {
                            app.relaunch();
                        });
                    })
                    .catch(err => {
                        console.error('Failed to extract the update:', err);
                        dialog.showMessageBox({
                            title: 'Update Error',
                            message: 'The update was downloaded but failed to extract. Please try again later.',
                            buttons: ['OK']
                        });
                    });
            })
            .pipe(fs.createWriteStream(zipPath));
}


async function extractFile(filePath, outputDir) {
    try {
        const type = await getFileType(filePath);

        if (!type) {
            throw new Error('Unable to detect file type');
        }

        switch (type.ext) {
            case 'zip':
                console.log('Extracting ZIP file...');
                await extractZip(filePath, outputDir);
                break;
            case 'rar':
                console.log('Extracting RAR file...');
                await extractRar(filePath, outputDir);
                break;
            case '7z':
                console.log('Extracting 7z file...');
                await extract7z(filePath, outputDir);
                break;
            default:
                throw new Error('Unsupported file type: ' + type.ext);
        }

        console.log('Extraction complete');
    } catch (err) {
        console.error('Extraction failed:', err);
    }
}


function getFileType(filePath) {
    const extname = path.extname(filePath).toLowerCase();
    
    switch (extname) {
        case '.zip':
            return Promise.resolve({ ext: 'zip' });
        case '.rar':
            return Promise.resolve({ ext: 'rar' });
        case '.7z':
            return Promise.resolve({ ext: '7z' });
        default:
            return Promise.reject(new Error('Unsupported file type'));
    }
}



function extractZip(filePath, outputDir) {
    return zipLib.extract(filePath, outputDir);
}

function extractRar(filePath, outputDir) {
    return new Promise((resolve, reject) => {
        unrar.extract(filePath, outputDir, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function extract7z(filePath, outputDir) {
    return new Promise((resolve, reject) => {
        seven.extractFull(filePath, outputDir, {
            $progress: (progress) => console.log(progress),
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
}

module.exports = this;