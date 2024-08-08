const express = require('express');

const app = express();
const port = 9340;

var keys = [];

function generateKey() {
    var k = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    keys.push(k);
    return k;
}

app.get('/fls/getMods', (req, res) => {
    if (!keys.contains(req.query.key)) {
        res.status(403).send('Invalid game key');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

module.exports = app;