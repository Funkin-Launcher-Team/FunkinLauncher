console.log = function (...args) {
    window.electronAPI.log(args.join(' '));
}

var modEngine = '1';
var ft = "";

async function analyzePackage(url, type, id) {
    var info = {};
    await fetch("https://gamebanana.com/apiv11/File/" + url.split('mmdl/')[1])
        .then(a => a.json())
        .then(fileInfo => {
            info = fileInfo;
            ft = info._sFile.split('.')[info._sFile.split('.').length - 1];
        });

    // Phase 1: Check if the mod is for the correct engine
    if (info._sClamAvResult && info._sAvastAvResult) {
        if (info._sClamAvResult != 'clean' && info._sAvastAvResult != 'clean') {
            console.log('failed check 1');
            window.alert('This mod has been flagged as malicious by GameBanana. To prevent any damage to your system, this mod cannot be installed.');
            window.close();
            return;
        }
    }
    
    // Phase 2: Check if the mod has an executable
    if (info._bContainsExe) {
        console.log('failed check 2');
        window.alert('This mod is not supported!');
        window.close();
        return;
    }

    // Analyze the package
    var filetree = info._aMetadata._aArchiveFileTree;

    if(Object.prototype.toString.call(filetree) === '[object Array]') {
        // It's an array... strange.
        console.log('failed array check');
        window.alert('This mod is not supported!');
        window.close(); 
        return;
    }
    else {
        var keys = Object.keys(filetree);
        var folders = 0;
        var fToCheck = {};
        for (var i = 0; i < keys.length; i++) {
            if (typeof filetree[keys[i]] == 'object') {
                folders++;
                fToCheck = filetree[keys[i]];
            }
        }
        if (folders != 1) {
            console.log('failed folder count check');
            window.alert('This mod is not supported!');
            window.close();
            return;
        }
        else {
            var files = fToCheck;
            var daThing = JSON.stringify(files);
            if (daThing.includes('meta.json') && !daThing.includes('_meta.json')) {
                modEngine = '1';
            }
            if (daThing.includes('_polymod_meta.json')) {
                modEngine = '2';
            }
            document.getElementsByClassName('launcher')[0].style.display = 'block';
            document.getElementsByClassName('loading')[0].style.display = 'none';
        }
    }
}

function onEngineNotInstalled() {
    window.alert('The selected engine is not installed. Please install the engine and try again.');
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('download')[0].style.display = 'none';
}

function receiveUrl(url, type, id) {
    window.url = url.replace('flmod://', '');
    window.subID = id;

    
    fetch("https://gamebanana.com/apiv11/" + type + "/" + id + "/ProfilePage")
        .then(response => response.json())
        .then(data => {
            document.getElementById('whereDD').innerHTML = 'What engine is <b>' + data._sName + '</b> for?';
            analyzePackage(url,type,id);
        })
        .catch(error => console.error(error));
}


function installMod() {
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;

    document.getElementsByClassName('download')[0].style.display = 'block';
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    window.electronAPI.installMod(window.url,selectedOption,ft);
}

function updateProgress(percent) {
    document.getElementById('progress').innerText = percent;
}

function onDownloadError() {
    window.alert('An error occurred while downloading the mod.');
    window.close();
}

function onExtractionFailed() {
    window.alert('An error occurred while extracting the mod. Please try again or report this issue.');
    window.close();
}

function onDownloadComplete() {
    window.alert('Download complete!');
    window.close();
}

fetch("https://" + localStorage.getItem('engineSrc') + "/engines.json")
    .then(response => response.json())
    .then(data => {
        var dropdown = document.getElementById('enginedd');
        data.engines.forEach(engine => {
            var option = document.createElement('option');
            option.text = engine.name;
            option.value = engine.id;
            dropdown.add(option);
        });
        dropdown.value = modEngine;
    });
    

// initialize hls stream
var video = document.getElementById('bgvE');
if (Hls.isSupported()) {
    var hls = new Hls({
        debug: true,
    });
    hls.loadSource('./bgv/bgv.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        video.muted = true;
        video.play();
    });
}
else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = './bgv/bgv.m3u8';
    video.addEventListener('canplay', function () {
        video.play();
    });
}