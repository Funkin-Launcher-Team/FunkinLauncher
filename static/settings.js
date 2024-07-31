console.log = function (...args) {
    window.electronAPI.log(args.join(' '));
}

var onHellYeah = function(){};
var onNope = function(){};
function btngen(element, div) {
    var btn = document.createElement('button');
    btn.innerHTML = '<b>X</b>';
    btn.className = 'erb';
    btn.onclick = function() {
        /*
        if (window.confirm('Are you sure you want to remove this engine? This action is irreversible.')) {
            window.electronAPI.removeEngine(element);
            done();
        }
            */
        document.getElementsByClassName('areyousure')[0].style.display = 'block';
        onHellYeah = function() {
            window.electronAPI.removeEngine(element);
            done();
            onHellYeah = function(){};
        }
        onNope = function() {
            document.getElementsByClassName('areyousure')[0].style.display = 'none';
            onNope = function(){};
        }
    }
    div.appendChild(btn);
}

function done() {
    window.alert('The engine has been removed successfully.');
    window.location.reload();
}

var engineName = ['Kade Engine', 'Psych Engine', 'Vanilla / VSlice'];

fetch("https://ffm-backend.web.app/engines.json")
.then(response => response.json())
.then(data => {
    engineName = data.execName;
});
function passData(data) {
    if (data == '') {
        var p = document.createElement('p');
        p.innerText = 'No engines installed.';
        document.getElementsByClassName('installs')[0].appendChild(p);
        return;
    }
    var engines = data.split(',');
    var didFirst = false;
    engines.forEach(element => {
        var div = document.getElementsByClassName('installs')[0];
        var adiv = document.createElement('div');
        adiv.className = 'install';
        
        var p = document.createElement('p');
        p.className = "en";
        p.innerText = engineName[parseInt(element.replace('engine',''))];
        adiv.appendChild(p);

        btngen(parseInt(element.replace('engine','')), adiv);

        if (didFirst) {
            div.appendChild(document.createElement('br'));
            div.appendChild(document.createElement('br'));
        }
        else {
            didFirst = true;
        }

        div.appendChild(adiv);
    });
}

function getFromArray(array, index) {
    return (array[index] ? array[index] : '');
}

function showMods(modsHTML) {
    if (modsHTML == '') {
        document.getElementById('mods').innerHTML = 'No engines installed.';
        return;
    }
    document.getElementById('mods').innerHTML = modsHTML;
}

document.getElementById('volSlider').value = localStorage.getItem('volume') * 100;

function apply() {
    localStorage.setItem('volume', document.getElementById('volSlider').value / 100);
    window.electronAPI.reloadLauncher();
}


/*

var fps = 0;
var frames = 0;
var startTime = performance.now();

function calculateFPS() {
    var currentTime = performance.now();
    var elapsedTime = currentTime - startTime;
    
    if (elapsedTime >= 1000) {
        fps = frames / (elapsedTime / 1000);
        frames = 0;
        startTime = currentTime;
    }
    
    frames++;

    console.log(fps);
}

setInterval(calculateFPS, 1000);

*/

window.camera.init(125,70);