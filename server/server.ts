import express = require('express');
import bodyParser = require('body-parser');
import Promise = require('bluebird');
import {ClientStorage} from './oauth/clientStorage';
import initOAuthController from './controllers/oauth';
import initClientsController from './controllers/clients';
import UserInfoProvider from './userInfoProvider';
import {logger} from './logging';
import Request = Express.Request;
import {User} from 'oauth2-server';
import {nconf, URL_PREFIX} from './configuration';

const isDevelopmentMode = process.env.NODE_ENV !== 'production';

// TODO: handle oauth2-server errors (e.g. OAuth2Error for invalid code, Client credentials are invalid, etc.)
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

function getInfo(req: express.Request, res: express.Response) {
    const accountName = UserInfoProvider.getAccountName(req);

    function send(userInfo) {
        res.json({
            userId: userInfo.id,
            accountName: accountName,
            NODE_ENV: process.env.NODE_ENV || '<unset>',
            requestUrl: req.url,
            accountResolver: nconf.get('accountResolver'),
            postgres: nconf.get('postgresConnectionString'),
            cookie: userInfo.cookie
        });
    }

    UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => send(userInfo))
        .catch(err => send({id: 'Unable to retrieve user info'}));
}

app.get(URL_PREFIX + '/', getInfo);
app.get(URL_PREFIX + '/tp_oauth/:accountName/', getInfo);

app.get(URL_PREFIX + '/test/:accountName', (req: express.Request, res) => {
    UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => res.json(userInfo))
        .catch(err => res.status(500).json(err));
});

initOAuthController(app);
initClientsController(app);

const PORT = nconf.get('port');
const IP = nconf.get('ip');
app.listen(PORT, IP, () => {
    logger.info(`App started on port ${PORT}`);
});
