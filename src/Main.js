const { exec } = require('child_process');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, net, protocol, dialog, webContents, webFrame, shell, Notification } = require('electron');
const { Tray, Menu } = require('electron');
const path = require('path');
const chalk = require('chalk');
const progress = require('request-progress');
const URL = require('lite-url');
const { extractor, createExtractorFromFile } = require('node-unrar-js');
const zl = require("zip-lib");
const zipLib = require("zip-lib");
const unrar = require("unrar");
const beautify = require("json-beautify");
const seven = require('node-7z');
const express = require('express');
const e = require('express');
const move = require('fs-move');
const { title } = require('process');
const { pathToFileURL } = require('url');
const { dbDeleteValue, dbGetAllEngines, dbReadValue, dbWriteValue, appDataPath, hto, whto } = require('./Database');

var whyHTE = whto;
var hasToError = hto;
var isLoad = false;
var appReady = false;

function makeErrWin(err) {
    if (appReady) {
        // Close all windows
        isLoad = true;
        BrowserWindow.getAllWindows().forEach(win => {
            win.close();
        });

        var errWin = new BrowserWindow({
            width: 1280,
            height: 720,
            resizable: false,
            fullscreen: false,
            fullscreenable: false,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'RendererIPC.js')
            }
        });
        errWin.loadURL(path.join(__dirname, '../', 'static', 'error.html') + "?error=" + btoa(err));

        isLoad = false;
    }
    else {
        app.whenReady().then(() => {
            appReady = true;
            makeErrWin();
        });
    }
}

process.on('uncaughtException', function (err) {
    hasToError = true;
    makeErrWin(err);
});

if (!fs.existsSync(path.join(appDataPath, 'errors'))) {
    fs.mkdirSync(path.join(appDataPath, 'errors'), { recursive: true });
}
// TODO: this function just acts as bridge but we need a firewall
function fastRequest(url, callback) {
    return require('request')(url, callback);
}
var ejson = {};
function request(url, callback) {
    var res;

    try {
        require('request')(url, (err, response, body) => {
            if (err) {
                if (dbReadValue('cache_res_' + btoa(url))) {
                    console.log('Using cached response for ' + url);
                    res = atob(dbReadValue('cache_res_' + btoa(url)));
                    callback(err, response, res);
                    return;
                }
                else {
                    console.error(err);
                    callback(err, response, body);
                    return;
                }
            }
            res = body;
            if (!dbReadValue('cache_res_' + btoa(url))) {
                dbWriteValue('cache_res_' + btoa(url), btoa(body));
            }
            callback(err, response, body);
        });
    }
    catch (err) {
        console.error(err);
    }
}


function isHealthy(url) {
    // TODO: sanitize url
    return true;
}

var konamiClosed = false;

function formattedDate() {
    var date = new Date(Date.now());
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-logs';
}



// Window configuration
var mmi;
var sw;
var win;

var launcherWindow = {
    width: 1280,
    height: 720,
    resizable: false,
    fullscreen: false,
    fullscreenable: false,
    frame: false,
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
    ejson = json;
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
    if (hasToError) {
        makeErrWin(whyHTE);
        return;
    }
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
        win.loadURL(path.join(__dirname, '../', 'static', (hasToError ? 'error.html' : 'index.html')));
        win.webContents.on('did-finish-load', () => {
            if (!hasToError) {
                win.webContents.executeJavaScript('versionPass("' + require('../package.json').version + (process.argv.includes('frombatch') ? '-BETA' : '') + '");');
                win.webContents.executeJavaScript('localStorage.setItem("engineSrc","' + dbReadValue('engineSrc') + '");');
            }
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
        const extractPath = path.join(selectedPath);

        fs.mkdirSync(selectedPath, { recursive: true });

        const downloadURL = `https://${dbReadValue('engineSrc')}/e${engineID}.zip`;
        console.log(`Downloading from ${downloadURL}`);

        var startTime = Date.now();

        progress(fastRequest(downloadURL))
            .on('progress', (state) => {
                console.log('percent: ' + Math.round(state.percent * 100) + '%');
                win.webContents.executeJavaScript('updateProgress(' + Math.round(state.percent * 100) + ');');
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



function initapp() {
    appReady = true;
    if (dbReadValue('corrupted') == 'true' || dbReadValue('corrupted') == true) {
        dialog.showMessageBox({
            title: 'Corrupted database',
            message: 'The database file was corrupted and has been reset.',
            buttons: ['OK']
        }).then(initapp);
        dbDeleteValue('corrupted');
        return;
    }
    request('https://ffm-backend.web.app/version.json', (err, res, body) => {
        if (err) {
            console.error("Failed to fetch the version data:", err);
            createWindow();
            return;
        }
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
}



app.whenReady().then(initapp);


app.on('window-all-closed', function () {
    if (!isLoad) {
        app.quit();
    }
});

function downloadAndUpdate(selectedPath, remoteVersion, downloadURL) {
        const zipPath = path.join(selectedPath, btoa(remoteVersion).replace('=','') + '_update.zip');

        console.log(`Downloading update from ${downloadURL} to ${zipPath}`);

        progress(fastRequest(downloadURL))
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
        return true;
    } catch (err) {
        console.error('Extraction failed:', err);
        return false;
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

async function __rarExtract(file, destination) {
    try {
      // Create the extractor with the file information (returns a promise)
      const extractor = await createExtractorFromFile({
        filepath: file,
        targetPath: destination
      });
  
      // Extract the files
      [...extractor.extract().files];

      return "";
    } catch (err) {
      // May throw UnrarError, see docs
      console.error(err);
      return err;
    }
  }

  
function extractRar(filePath, outputDir) {
    return new Promise((resolve, reject) => {
        (async () => {
            var thing = await __rarExtract(filePath, outputDir);
            resolve();
        })();
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