import express = require('express');
import bodyParser = require('body-parser');
import ClientStorage from './oauth/clientStorage';
import initOAuthController from './controllers/oauth';
import UserInfoProvider from './userInfoProvider';

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get('/test/:accountName', (req, res) => {
    UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => res.json(userInfo))
        .catch(err => res.status(500).json(err));
});

initOAuthController(app);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App started on port ${PORT}.`);
});
