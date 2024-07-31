console.log = function (...args) {
    window.electronAPI.log(args.join(' '));
}

function receiveUrl(url, type, id) {
    window.url = url.replace('flmod://', '');
    window.subID = id;
    fetch("https://gamebanana.com/apiv11/" + type + "/" + id + "/ProfilePage")
        .then(response => response.json())
        .then(data => {
            document.getElementById('whereDD').innerHTML = 'What engine is <b>' + data._sName + '</b> for?';
        })
        .catch(error => console.error(error));
}

function installMod() {
    // todo: find smth to check for mod updates
    var ma = localStorage.getItem('installedMods');
    ma.push(window.subID);
    localStorage.setItem('installedMods',ma);
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;

    document.getElementsByClassName('download')[0].style.display = 'block';
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    window.electronAPI.installMod(window.url,selectedOption);
}

function updateProgress(percent) {
    document.getElementById('progress').innerText = percent;
}

function onDownloadError() {
    window.alert('An error occurred while downloading the mod.');
    window.close();
}

function onDownloadComplete() {
    window.alert('Download complete!');
    window.close();
}

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
    
if (localStorage.getItem('installedMods') == null || localStorage.getItem('installedMods') == undefined) {
    localStorage.setItem('installedMods',[]);
}

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