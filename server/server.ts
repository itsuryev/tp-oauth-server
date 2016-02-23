import express = require('express');
import bodyParser = require('body-parser');
import ClientStorage from './oauth/clientStorage';
import initOAuthController from './controllers/oauth';

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    ClientStorage
        .getClientByIdAsync('testApp1')
        .then(client => res.send(JSON.stringify(client)))
        .catch(err => res.send(err));
});

initOAuthController(app);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App started on port ${PORT}.`);
});
