import express = require('express');
import bodyParser = require('body-parser');
import {ClientStorage} from './oauth/clientStorage';
import initOAuthController from './controllers/oauth';
import initClientsController from './controllers/clients';
import UserInfoProvider from './userInfoProvider';
import {logger} from './logging';

const isDevelopmentMode = process.env.NODE_ENV !== 'production';

// TODO: handle oauth2-server errors (e.g. OAuth2Error for invalid code)
// TODO: add typings for promisified modules?

const app = express();

if (isDevelopmentMode) {
    app.use((req, res, next) => {
        logger.debug(`~ ${req.method} ${req.url}`);
        next();
    });
}

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
initClientsController(app);

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`App started on port ${PORT}`);
});
