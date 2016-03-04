import 'babel-polyfill';

import * as express from 'express';

import {logger} from './logging';
import {nconf, initConfig} from './configuration';

import configureApplication from './startup/configure';

export default class ServerFactory {
    static createServer({configFileName}) {
        // TODO: handle oauth2-server errors (e.g. OAuth2Error for invalid code, Client credentials are invalid, etc.)
        // TODO: add typings for promisified modules?

        initConfig(configFileName);

        const app = express();

        configureApplication(app);

        const PORT = nconf.get('port');
        const IP = nconf.get('ip');

        const server = app.listen(PORT, IP, () => {
            logger.info(`App started on port ${PORT}`);
        });

        return server;
    }
}
