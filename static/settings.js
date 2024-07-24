function btngen(element, div) {
    var btn = document.createElement('button');
    btn.innerText = 'Remove';
    btn.className = 'erb';
    btn.onclick = function() {
        if (window.confirm('Are you sure you want to remove this engine? This action is irreversible.')) {
            window.electronAPI.removeEngine(element);
            done();
        }
    }
    div.appendChild(btn);
}

function done() {
    window.alert('The engine has been removed successfully.');
    window.electronAPI.settings();
    window.close();
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
    engines.forEach(element => {
        var div = document.getElementsByClassName('installs')[0];
        var adiv = document.createElement('div');
        adiv.className = 'install';
        
        var p = document.createElement('p');
        p.className = "en";
        p.innerText = engineName[parseInt(element.replace('engine',''))];
        adiv.appendChild(p);

        btngen(parseInt(element.replace('engine','')), adiv);

        div.appendChild(document.createElement('br'));
        div.appendChild(document.createElement('br'));

        div.appendChild(adiv);
    });
}

function getFromArray(array, index) {
    return (array[index] ? array[index] : '');
}

function showMods(modsHTML) {
    document.getElementById('mods').innerHTML = modsHTML;
}