// Generates a random RGB color
function randomRGB() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

// Runs the Konami code functionality
function runKonami() {
    const originalVolume = bgm.currentTime; // Store the current time of the background music
    bgm.volume = 1; // Set the volume to maximum
    let counter = 0;

    // Add the 'konami' class to the element with id "logoImg"
    document.getElementById('logoImg').src = 'glitchyLogo.png';
    document.getElementById('blur').classList.add('konami');

    // Set an interval to perform actions every 70 milliseconds
    setInterval(function () {
        const paragraphs = document.querySelectorAll('p');
        const links = document.querySelectorAll('a');
        const buttons = document.querySelectorAll('button');
        const allElements = [...paragraphs, ...links, ...buttons];

        // Randomize the innerHTML of all paragraphs, links, and buttons
        allElements.forEach(element => {
            element.innerHTML = randomString(10);
        });

        // Disable the onclick function for all buttons
        buttons.forEach(button => {
            button.onclick = function() {};
        });

        // Restore the background music's current time
        bgm.currentTime = originalVolume;

        counter++;

        // After 25 iterations, hide the body and change background color
        if (counter > 25) {
            document.body.style.display = 'none';
            document.querySelector('html').style.backgroundColor = 'black';
        }

        // After 50 iterations, close the window
        if (counter > 50) {
            window.electronAPI.konamiWinClose(); // Call some external API to close the window
        }
    }, 70);
}

// Stores the sequence of keys for the Konami code
var konamiCode = [];
var konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

// Listens for keydown events to detect the Konami code sequence
document.addEventListener('keydown', function(event) {
    konamiCode.push(event.key);

    // Keep the last part of the sequence in konamiCode
    konamiCode.splice(-konamiSequence.length - 1, konamiCode.length - konamiSequence.length);

    // Check if the input matches the Konami sequence
    if (konamiCode.join('') === konamiSequence.join('') && window.state == 'SelectGame') {
        runKonami(); // Run the Konami function when the code is detected
    }
});
