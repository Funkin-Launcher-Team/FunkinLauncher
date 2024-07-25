var bgm;

var isGameCloseEventGonnaFireAndTalkAbotuImportedEngine = false;

function loadEngine() {
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;

    bgm.volume = 0;
    document.getElementById('settings').disabled = true;
    window.electronAPI.loadGame(selectedOption);
}

function versionPass(data) {
    document.getElementById('version').innerText = "v." + data;
}

function updaterUI() {
    document.getElementsByClassName('update')[0].style.display = 'block';
    document.getElementsByClassName('update')[0].classList.add('open');
}

function loadPsychMM() {
    bgm.volume = 0
    document.getElementById('settings').disabled = true;
    window.electronAPI.loadMM(1);
}

function onUnexpectedGameClose() {
    onGameClose();
    window.alert('The game unexpectedly closed. Maybe the engine is corrupted?');
    document.getElementById('settings').disabled = false;
}

function onGameLoad() {
    bgm.volume = 0;
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    document.getElementsByClassName('instance')[0].style.display = 'block';
    document.getElementById('settings').disabled = true;

}

function onGameClose() {
    bgm.volume = localStorage.getItem('volume');
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    document.getElementsByClassName('doi')[0].style.display = 'none';
    document.getElementById('settings').disabled = false;
}

function updateProgress(percent) {
    document.getElementById('progress').innerText = percent;
}

function onDownloadError() {
    bgm.volume = localStorage.getItem('volume');
    document.getElementById('settings').disabled = false;
    window.alert('An error occurred while downloading the engine.');
    document.getElementsByClassName('download')[0].style.display = 'none';
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
}

function onDownloadComplete() {
    bgm.volume = localStorage.getItem('volume');
    document.getElementById('settings').disabled = false;
    document.getElementById('progress').innerText = '';
    document.getElementsByClassName('download')[0].style.display = 'none';
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    window.alert('Download complete!');
}

function promptDownload() {
    document.getElementById('settings').disabled = true;
    bgm.volume = localStorage.getItem('volume');
    // create option to either import or download
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    document.getElementsByClassName('download')[0].style.display = 'none';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    document.getElementsByClassName('doi')[0].style.display = 'block';
}

function downloadEngine() {
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    document.getElementsByClassName('download')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    document.getElementsByClassName('doi')[0].style.display = 'none';
    window.electronAPI.downloadEngine(document.getElementById('enginedd').value);
}

function importEngine() {
    window.electronAPI.importEngine(document.getElementById('enginedd').value);
}

document.getElementById('enginedd').onchange = function () {
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;
    if (selectedOption == "1") {
        document.getElementById('pmm').style.display = '';
    }
    else {
        document.getElementById('pmm').style.display = 'none';
    }
};

localStorage.setItem('imported', '');
if (!localStorage.getItem('volume')) {
    localStorage.setItem('volume', 0.5);
}

bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = localStorage.getItem('volume');
bgm.play();

var version = '0.9';

fetch("https://ffm-backend.web.app/engines.json")
    .then(response => response.json())
    .then(data => {
        var dropdown = document.getElementById('enginedd');
        data.engines.forEach(engine => {
            var option = document.createElement('option');
            option.text = engine.name;
            option.value = engine.id;
            dropdown.add(option);
        });
    });
console.clear();
console.warn('This is a developer console. If you were told to paste something here, don\'t! They could get access to your computer and do bad shit!');

fetch("https://ffm-backend.web.app/version.vem?" + Date.now())
    .then(r => r.text())
    .then(latestVersion => {
        var versionInt = parseInt(version.replace('.',''));
        var latestVersionInt = parseInt(version.replace('.',''));

        if (latestVersionInt > versionInt) {
            window.alert('A new version of the app is available for download: ' + latestVersion + '. Go check our GameBanana page and download it!');
        }
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