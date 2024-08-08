console.log = function (...args) {
    window.electronAPI.log(args.join(' '));
}

const lerp = (x, y, a) => x * (1 - a) + y * a;
var targetProgress = 0;
setInterval(function () {
    document.getElementById('progress').value = lerp(document.getElementById('progress').value, targetProgress, 0.95);
});
var bgm;

// var isGameCloseEventGonnaFireAndTalkAbotuImportedEngine = false;

function loadEngine() {
    var dropdown = document.getElementById('enginedd');
    var selectedOption = dropdown.value;

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
    document.getElementsByClassName('license')[0].classList.add('open');
}

function olicense() {
    document.getElementsByClassName('license')[0].style.display = 'none';
    document.getElementsByClassName('license')[0].classList.remove('open');
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
    targetProgress = percent;
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

function goto(id) {
    document.getElementById('enginedd').value = id;
    oic();
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
            link.style.marginLeft = '5px';
            link.href = 'javascript:goto("' + engine.id + '")';
            link.innerText = formalName[engine.id];
            document.getElementById('cso').appendChild(link);
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
    document.getElementById('settingsBtnImg').style.transform = 'rotate(' + deg + 'deg)';
},1/60);

// custom select dropdown

var csOpen = false;

setInterval(function() {
    document.getElementById('csv').innerText = formalName[parseInt(document.getElementById('enginedd').value)];
    document.getElementById('le').style.display = csOpen ? 'none' : 'unset';
    document.getElementById('pmm').style.display = (csOpen) ? 'none' : (formalName[selectedOption] == 'Psych Engine' ? 'unset' : 'none');
});

document.getElementById('csd').onclick = function() {
    document.getElementById('cso').style.height = "100px";
    document.getElementById('cso').style.display = "block";
    csOpen = true;
};

document.body.onclick = function(e) {
    if (e.target.id != 'cso' && e.target.id != 'csd') {
        csOpen = false;
        document.getElementById('cso').style.height = "0px";
        document.getElementById('cso').style.display = "none";
    }
}