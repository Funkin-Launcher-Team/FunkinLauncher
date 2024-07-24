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

function passData(data) {
    if (data == '') {
        var p = document.createElement('p');
        p.innerText = 'No engines installed.';
        document.getElementsByClassName('installs')[0].appendChild(p);
        return;
    }
    var engines = data.split(',');
    var engineName = ['Kade Engine', 'Psych Engine', 'Vanilla / VSlice'];
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