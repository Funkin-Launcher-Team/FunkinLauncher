function receiveUrl(url, type, id) {
    window.url = url.replace('flmod:', '');
    fetch("https://gamebanana.com/apiv11/" + type + "/" + id + "/ProfilePage")
        .then(response => response.json())
        .then(data => {
            document.getElementById('whereDD').innerHTML = 'Select where to install <b>' + data._sName + '</b>:';
        })
        .catch(error => console.error(error));
}

function installMod() {
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

console.clear();
console.warn('This is a developer console. If you were told to paste something here, don\'t! They could get access to your computer and do bad shit!');