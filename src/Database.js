const fs = require('fs');
const path = require('path');
const { app } = require('electron')

// Create AppData folder
const appDataPath = path.join(app.getPath('appData'), 'FNF Launcher')

if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
}

// Create database if not existing
if (!fs.existsSync(path.join(appDataPath, 'dbfile.json'))) {
    fs.writeFileSync(path.join(appDataPath, 'dbfile.json'),JSON.stringify({"version": "1"}));
}

async function dbWriteValue(key, value) {
    var db = JSON.parse(fs.readFileSync(path.join(appDataPath, 'dbfile.json'), 'utf8'));
    db[key] = value;
    fs.writeFileSync(path.join(appDataPath, 'dbfile.json'), JSON.stringify(db));
}

function dbReadValue(key) {
    var db = JSON.parse(fs.readFileSync(path.join(appDataPath, 'dbfile.json'), 'utf8'));
    return db[key];
}

function dbGetAllEngines() {
    var db = JSON.parse(fs.readFileSync(path.join(appDataPath, 'dbfile.json'), 'utf8'));
    var engines = [];
    for (var key in db) {
        if (key.startsWith('engine') && key.startsWith('engineSrc') == false) {
            try {
                fs.readdirSync(path.join(db[key]));
                engines.push(key);
            }
            catch (e) {
                // Delete engine from database if it does not exist anymore
                console.log('Engine ' + key + ' does not exist anymore. Deleting from database.');
                dbDeleteValue(key);
            }
        }
    }
    return engines;
}

function dbDeleteValue(key) {
    var db = JSON.parse(fs.readFileSync(path.join(appDataPath, 'dbfile.json'), 'utf8'));
    delete db[key];
    fs.writeFileSync(path.join(appDataPath, 'dbfile.json'), JSON.stringify(db));
}

if (dbReadValue('engineSrc') == null || dbReadValue('engineSrc') == undefined) {
    dbWriteValue('engineSrc', 'ffm-backend.web.app');
}

module.exports = {
    dbWriteValue: dbWriteValue,
    dbReadValue: dbReadValue,
    dbGetAllEngines: dbGetAllEngines,
    dbDeleteValue: dbDeleteValue,
    appDataPath: appDataPath
};