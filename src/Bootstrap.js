var os = require('os');

if (os.platform() === 'win32') {
    var release = os.release();
    var version = parseInt(release.split('.')[0]);
    
    if (version >= 10) {
        var app = require('./Main');
    } else {
        process.exit(1203);
    }
}