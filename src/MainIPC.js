// We do not define anything since this file is evaluated when IPCs are defined.
// Maybe evaluation isn't the best approach, though.

function immb(modName, engineID) {
    return '<button onclick="removeMod(\'' + modName + '\', \'' + engineID + '\')">Remove</button>';
}
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
                    arrayOfStuff.push("<tr><td>" + element2 + "</td><td>" + formalName[parseInt(element.replace('engine', ''))] + '</td><td>' + immb(element2, element) + '</td></tr>');
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

ipcMain.on('reload-launcher', (event) => {
    if (win) {
        win.show();
        win.webContents.executeJavaScript('window.location.reload();');
    }
});

ipcMain.on('import-engine', (event, engineID) => {
    // prompt user to select a folder
    const webContents = event.sender;
    const eventer = BrowserWindow.fromWebContents(webContents);
    console.log('importing engine...');
    dialog.showOpenDialog(win, { properties: ['openDirectory'] }).then((result) => {
        var src = result.filePaths[0];
        dbWriteValue('engine' + engineID, src);
        eventer.webContents.executeJavaScript('window.alert(\'Imported engine successfully\');onGameClose();');
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
    exec('explorer.exe ' + path.join(appDataPath, 'logs'), (err, stdout, stderr) => {});
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
            preload: path.join(__dirname, 'RendererIPC.js')
        }
    });
    
    sw.loadFile(path.join(__dirname, '../', 'static', 'settings.html'));
    sw.webContents.on('did-finish-load', () => {
        passToSettings();
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