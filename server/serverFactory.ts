import 'babel-polyfill';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';

import {logger} from './logging';
import {nconf, initConfig} from './configuration';
import {renderError, jsonError} from './controllers/shared';

import initOAuthController from './controllers/oauth';
import initClientsController from './controllers/clients';
import initAuthorizationsController from './controllers/authorizations';

export default class ServerFactory {
    static createServer({configFileName}) {
        // TODO: handle oauth2-server errors (e.g. OAuth2Error for invalid code, Client credentials are invalid, etc.)
        // TODO: add typings for promisified modules?

        initConfig(configFileName);

        const app = express();

        app.use(methodOverride('X-HTTP-Method-Override'));
        app.use(methodOverride('X-HTTP-Method'));
        
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

        app.use((err: Error, req: express.Request, res: express.Response, next) => {
            logger.error(`${req.method} ${req.url}`, err);

            if (res.headersSent) {
                return next(err);
            }

            // TODO: maybe also check 'Accept' header?
            if (res['useErrorPageEnabled']) {
                renderError(res, err.toString());
            } else {
                jsonError(res, err);
            }
        });

        const PORT = nconf.get('port');
        const IP = nconf.get('ip');

        const server = app.listen(PORT, IP, () => {
            logger.info(`App started on port ${PORT}`);
        });

        return server;
    }
}
