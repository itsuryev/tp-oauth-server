import express = require('express');
import bodyParser = require('body-parser');

import {logger} from './logging';
import {nconf, initConfig} from './configuration';

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

    app.get('/', (req, res) => {
        res.json({
            NODE_ENV: process.env.NODE_ENV || '<unset>',
            accountResolver: nconf.get('accountResolver')
        });
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