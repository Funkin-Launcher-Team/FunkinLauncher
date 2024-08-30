console.log = function (...args) {
    window.electronAPI.log(args.join(' '));
}

const lerp = (x, y, a) => x * (1 - a) + y * a;
var targetProgress = 0;
setInterval(function () {
    document.getElementById('progress').value = lerp(document.getElementById('progress').value, targetProgress, 0.95);
});
var bgm;

window.state = 'SelectGame';

// var isGameCloseEventGonnaFireAndTalkAbotuImportedEngine = false;

function onCloseSettings() {
    window.state = 'SelectGame';
    var ca = new Audio('cancel.mp3');
    ca.volume = 0.5;
    bgm.volume = localStorage.getItem('volume');
    ca.play();
}

function openSettings() {
    var ca = new Audio('confirm.mp3');
    window.state = 'Settings';
    ca.volume = 0.5;
    ca.play();
    bgm.volume = 0;
    window.electronAPI.settings();
}

function loadEngine() {
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;

    window.state = 'LoadedGame';

    bgm.volume = 0;
    document.getElementById('settings').disabled = true;
    window.electronAPI.loadGame(selectedOption);
}

function versionPass(data) {
    document.getElementById('version').innerText = "v." + data + ' - ';
    document.getElementById('version').innerHTML += '<a href="javascript:license()">Credits</a>';
}

function license() {
    document.getElementsByClassName('license')[0].style.display = 'block';
    window.state = 'License';
    document.getElementsByClassName('license')[0].classList.add('open');
}

function olicense() {
    document.getElementsByClassName('license')[0].style.display = 'none';
    window.state = 'SelectGame';
    document.getElementsByClassName('license')[0].classList.remove('open');
}

function loadPsychMM() {
    bgm.volume = 0
    window.state = 'LoadedGame';
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
    window.state = 'LoadedGame';

}

function onGameClose() {
    bgm.volume = localStorage.getItem('volume');
    window.state = 'SelectGame';
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    document.getElementsByClassName('doi')[0].style.display = 'none';
    document.getElementById('settings').disabled = false;
}

function updateProgress(percent) {
    targetProgress = percent;
    document.getElementById('mbs').innerText = '';
}

function onDownloadError() {
    window.state = 'SelectGame';
    bgm.volume = localStorage.getItem('volume');
    document.getElementById('settings').disabled = false;
    window.alert('An error occurred while downloading the engine.');
    document.getElementsByClassName('download')[0].style.display = 'none';
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
}

function onDownloadComplete() {
    window.state = 'SelectGame';
    bgm.volume = localStorage.getItem('volume');
    document.getElementById('settings').disabled = false;
    document.getElementById('progress').innerText = '';
    document.getElementsByClassName('download')[0].style.display = 'none';
    document.getElementsByClassName('launcher')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    window.alert('Download complete!');
}

function promptDownload() {
    window.state = 'Download';
    document.getElementById('settings').disabled = true;
    bgm.volume = localStorage.getItem('volume');
    // create option to either import or download
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    document.getElementsByClassName('download')[0].style.display = 'none';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    document.getElementsByClassName('doi')[0].style.display = 'block';
}

function downloadEngine() {
    window.state = 'Download';
    document.getElementsByClassName('launcher')[0].style.display = 'none';
    document.getElementsByClassName('download')[0].style.display = 'block';
    document.getElementsByClassName('instance')[0].style.display = 'none';
    document.getElementsByClassName('doi')[0].style.display = 'none';
    window.electronAPI.downloadEngine(document.getElementById('enginedd').value);
}

function importEngine() {
    window.state = 'Download';
    window.electronAPI.importEngine(document.getElementById('enginedd').value);
}

var formalName = [];
var i = -1;
fetch("https://" + localStorage.getItem('engineSrc') + "/engines.json")
    .then(response => response.json())
    .then(data => {
        formalName = data.formalName;
        var dropdown = document.getElementById('enginedd');
        data.engines.forEach(engine => {
            var option = document.createElement('option');
            option.text = engine.name;
            option.value = engine.id;
            dropdown.add(option);

            i++;
            if (i != 0) {
                document.getElementById('cso').innerHTML += '<br>';
            }
            var link = document.createElement('a');
            link.class = "cslink";
            link.style.marginLeft = '5px';
            link.href = 'javascript:goto("' + engine.id + '")';
            link.innerText = formalName[engine.id];
            var pl = document.createElement('span');
            pl.appendChild(link);
            document.getElementById('cso').appendChild(pl);
        });
    });

function oic() {
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;
    if (formalName[selectedOption] == 'Psych Engine') {
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

var deg = 0;
setInterval(function() {
    deg += 0.1;
    try {
        document.getElementById('settingsBtnImg').style.transform = 'rotate(' + deg + 'deg)';
    }
    catch (e) {
        // Do nothing
    }
},1/60);

// custom select dropdown

var csOpen = false;

setInterval(function() {
    document.getElementById('csv').innerText = formalName[parseInt(document.getElementById('enginedd').value)];
});

var isOpen = false;

function toggleDrop(forceState, state) {
    if (forceState == "yes") {
        isOpen = state;
        document.getElementById('cso').style.display = isOpen ? "block" : "none";
    }
    else {
        isOpen = !isOpen;
        document.getElementById('cso').style.display = isOpen ? "block" : "none";
    }
}
function goto(id) {
    document.getElementById('enginedd').value = id;
    // TODO: find out why toggleDrop is not working
    isOpen = false;
    document.getElementById('cso').style.display = isOpen ? "block" : "none";
    oic();
}
document.getElementById('csd').onclick = toggleDrop;
document.getElementById('csv').onclick = toggleDrop;
document.getElementById('csdi').onclick = toggleDrop;

document.body.onclick = function(e) {
    if (e.target.id != 'cso' && e.target.id != 'csd' && e.target.id != 'csdi') {
        toggleDrop("yes", false);
    }
}

document.getElementById('cso').style.height = "100px";
document.getElementById('cso').style.display = "none";
isOpen = false; // just for safety??

function randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}