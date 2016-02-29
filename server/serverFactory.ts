import Promise = require('bluebird');
import express = require('express');
import Request = Express.Request;
import bodyParser = require('body-parser');

import {logger} from './logging';
import {nconf, initConfig} from './configuration';

import {ClientStorage} from './oauth/clientStorage';
import UserInfoProvider from './userInfoProvider';
import RedisAsync from './storage/redisAsync';

import initOAuthController from './controllers/oauth';
import initClientsController from './controllers/clients';
import initAuthorizationsController from './controllers/authorizations';

export default function createServer({configFileName}) {
    // TODO: handle oauth2-server errors (e.g. OAuth2Error for invalid code, Client credentials are invalid, etc.)
    // TODO: add typings for promisified modules?

    initConfig(configFileName);

    const app = express();

    app.use((req, res, next) => {
        logger.debug(`~ ${req.method} ${req.url}`);
        next();
    });

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
                redis: RedisAsync.redisConnectionText,
                cookie: userInfo.cookie
            });
        }

        UserInfoProvider
            .getUserInfoFromRequest(req)
            .then(userInfo => send(userInfo))
            .catch(err => send({id: 'Unable to retrieve user info'}));
    }

    const URL_PREFIX = nconf.get('urlPrefix');

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
    initAuthorizationsController(app);

    const PORT = nconf.get('port');
    const IP = nconf.get('ip');

    const server = app.listen(PORT, IP, () => {
        logger.info(`App started on port ${PORT}`);
    });

    return server;
}