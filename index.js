/* eslint no-console: 0 */
const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.end('It works!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App started on port ${port}.`);
});