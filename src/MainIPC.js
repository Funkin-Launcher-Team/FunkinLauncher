// We do not define anything since this file is evaluated when IPCs are defined.
// Maybe evaluation isn't the best approach, though.

const { ipcMain, dialog } = require("electron");
const { extract } = require("zip-lib");

// construct buttons
function immb(modName, engineID, shownName) {
    return '<button onclick ="removeMod(\'' + modName + '\', \'' + engineID + '\', \'' + shownName + '\')">Remove</button>';
}

ipcMain.on('send-db-file', (event) => {
    var win = BrowserWindow.fromWebContents(event.sender);
    const appDataPath = path.join(app.getPath('appData'), 'FNF Launcher');
    win.webContents.executeJavaScript('onDBFileDeliver("' + btoa(beautify(JSON.parse(fs.readFileSync(path.join(appDataPath, 'dbfile.json'))), null, 2, 100)) + '");');
});
ipcMain.on('save-db-file', (event, db) => {
    try {
        var a = JSON.parse(db);
        var win = BrowserWindow.fromWebContents(event.sender);
        const appDataPath = path.join(app.getPath('appData'), 'FNF Launcher');
        fs.writeFileSync(path.join(appDataPath, 'dbfile.json'), db);
        dialog.showMessageBox({
            message: 'Saved database file successfully! The app will now restart to apply the changes.'
        }).then(() => {
            app.relaunch();
            app.quit();
        });
    }
    catch (e) {
        dialog.showMessageBox({
            message: 'The database file is invalid. Please make sure it is a valid JSON file.\n\n' + e
        }).then(() => {
            return;
        });
    }
});
function passToSettings() {
    sw.webContents.executeJavaScript('passData("' + dbGetAllEngines() + '");');

    // Define top of the table
    var arrayOfStuff = ['<table><tr><th>Mod Name</th><th>Engine</th><th>Actions</th></tr>'];
    var allEngines = dbGetAllEngines();
    allEngines.forEach((element) => {
        var enginepather = dbReadValue(element);
        var atLeastOneMod = false;
        try {
            fs.readdirSync(path.join(enginepather, 'mods')).forEach((element2) => {
                if (fs.lstatSync(path.join(enginepather, 'mods', element2)).isDirectory()) {
                    if (element2 == 'introMod') {
                        return; // intromod is a default mod and should not be shown
                    }
                    if (element == 'engine1') {
                        // Read Psych Engine's pack.json
                        var pack = fs.readFileSync(path.join(enginepather, 'mods', element2, 'pack.json'), 'utf8');
                        arrayOfStuff.push("<tr><td>" + JSON.parse(pack).name + "</td><td>" + formalName[parseInt(element.replace('engine', ''))] + '</td><td>' + immb(element2, element, JSON.parse(pack).name) + '</td></tr>');
                    }
                    else {
                        arrayOfStuff.push("<tr><td>" + element2 + "</td><td>" + formalName[parseInt(element.replace('engine', ''))] + '</td><td>' + immb(element2, element, element2) + '</td></tr>');
                    }
                }
            });
        } catch (e) {
            // Do not do anything as this engine has no mods
        }
    });

    arrayOfStuff.push('</table>');
    sw.webContents.executeJavaScript("showMods('" + btoa(arrayOfStuff.join('')) + "')");
    
    return true;
}
ipcMain.on('log', (event, message) => {
    logStream.write('(RENDERER PROCESS) ' + message + '\n');
    process.stdout.write('(RENDERER PROCESS) ' + message + '\n');
});
ipcMain.on('open-url', (event, url) => {
    require('electron').shell.openExternal(url);
});

function randomNumber(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
ipcMain.on('randomize-window', (event) => {
    var sender = BrowserWindow.fromWebContents(event.sender);
    sender.setSize(randomNumber(800, 1200), randomNumber(600, 800));
    sender.setPosition(randomNumber(0, 1920), randomNumber(0, 1080));
});

ipcMain.on('konami-win-close', (event) => {
    konamiClosed = true;
    var sender = BrowserWindow.fromWebContents(event.sender);
    sender.close();
    app.quit();
});

/*
ipcMain.on('closed-settings', (event) => {
    win.webContents.executeJavaScript('onCloseSettings();');
});
*/

ipcMain.on('remove-mod', (event, mod, engine) => {
    console.log(path.join(dbReadValue('engine' + engine), 'mods', mod));
    fs.rmSync(path.join(dbReadValue('engine' + engine), 'mods', mod), { recursive: true });
});

ipcMain.on('import-engine', (event, engineID) => {
    // prompt user to select a folder
    const webContents = event.sender;
    const eventer = BrowserWindow.fromWebContents(webContents);
    console.log('importing engine...');
    dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'FNF Executables', extensions: ['exe'] }], title: 'Select your FNF .exe file' }).then((result) => {
        var src = path.dirname(result.filePaths[0]);
        if (!src || src == '' || src == null || src == undefined) {
            return;
        }
        console.log('importing engine from ' + src);
        dbWriteValue('engine' + engineID, src);
        var c = fs.readdirSync(src);
        c.forEach((element) => {
            if (element.split('.')[element.split('.').length - 1] == 'exe') {
                fs.renameSync(path.join(src, element), path.join(src, ejson.execName[engineID] + '.exe'));
            }
        });
        eventer.webContents.executeJavaScript('window.alert(\'Imported engine successfully!\');onGameClose();');
    });
});

ipcMain.on('download-engine', (event, engineID) => {
    win.show();
    downloadEngine(engineID);
});

ipcMain.on('open-engine-folder', (event) => {
    exec('explorer.exe ' + path.join(appDataPath, 'engines'), (err, stdout, stderr) => {});
});

ipcMain.on('open-logs-folder', (event) => {
    exec('notepad.exe ' + path.join(appDataPath, 'logs', startDate + '.log'), (err, stdout, stderr) => {});
});

ipcMain.on('remove-engine', (event, engineID, removeFiles) => {
    if (removeFiles) {
        fs.rmSync(dbReadValue('engine' + engineID), { recursive: true });
    }
    dbDeleteValue('engine' + engineID);
});

ipcMain.on('load-game', (event, engineID) => {
    win.webContents.executeJavaScript('onGameLoad();');
    win.hide();
    var gamePath = dbReadValue('engine' + engineID);
    console.log('loading game from ' + gamePath);
    if (!fs.existsSync(gamePath)) {
        win.show();
        win.webContents.executeJavaScript('promptDownload();');
        return;
    }

    exec('start ' + execName[engineID], { cwd: dbReadValue('engine' + engineID) }, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            win.show();
            win.webContents.executeJavaScript('onUnexpectedGameClose();');
            return;
        }
        console.log(stdout);
        win.show();
        win.webContents.executeJavaScript('onGameClose();');
    });
});

var openSettingsWin = 0;
ipcMain.on('open-settings', (event) => {
    openSettingsWin++;
    if (openSettingsWin > 1) {
        return;
    }
    sw = new BrowserWindow({
        parent: win,
        modal: true,
        width: 800,
        height: 600,
        resizable: false,
        fullscreenable: false,
        minimizable: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'RendererIPC.js')
        }
    });
    
    sw.loadFile(path.join(__dirname, '../', 'static', 'settings.html'));
    sw.webContents.on('did-finish-load', () => {
        passToSettings();
    });
    sw.on('closed', () => {
        openSettingsWin--;
        win.webContents.executeJavaScript('onCloseSettings();');
    });
});

ipcMain.on('reload-settings', (event) => {
    if (sw) {
        passToSettings();
    }
});

ipcMain.on('load-mm', (event, engineID) => {
    // ENGINEID IS IRRELEVANT FOR MM
    win.webContents.executeJavaScript('onGameLoad();');
    win.hide();
    var gamePath = dbReadValue('engine1');
    console.log('loading game from ' + gamePath);
    if (!fs.existsSync(gamePath)) {
        win.show();
        win.webContents.executeJavaScript('promptDownload();');
        return;
    }

    exec('' + execName[engineID] + ' -mm', { cwd: dbReadValue('engine' + engineID) }, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            win.show();
            win.webContents.executeJavaScript('onUnexpectedGameClose();');
            return;
        }
        console.log(stdout);
        win.show();
        win.webContents.executeJavaScript('onGameClose();');
    });
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

ipcMain.on('install-mod', (event, url, ed, ft) => {
    console.log('installing mod...');
    fs.mkdirSync(path.join(appDataPath, 'downloads'), { recursive: true });

    if (dbReadValue('engine' + ed) == undefined) {
        mmi.webContents.executeJavaScript('onEngineNotInstalled();');
        return;
    }

    const downloadPath = path.join(appDataPath, 'downloads', 'mod-' + btoa(url) + '.' + ft);

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
            (async function () {
                var didWork = await extractFile(downloadPath, path.join(dbReadValue('engine' + ed), 'mods'));
                if (didWork) {
                    mmi.webContents.executeJavaScript('onDownloadComplete();');
                }
                else {
                    mmi.webContents.executeJavaScript('onExtractionFailed();');
                }
            })();
        })
        .pipe(fs.createWriteStream(downloadPath));
});