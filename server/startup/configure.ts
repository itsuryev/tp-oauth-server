import * as express from 'express';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';

import {logger} from '../logging';
import {nconf} from '../configuration';
import {renderError, jsonError} from '../controllers/shared';

import initOAuthController from '../controllers/tpOauthFlow';
import initClientsController from '../controllers/clientsApi';
import initAuthorizationsController from '../controllers/tpAuthorizationsApi';

export default function configureApplication(app: express.Application) {

    app.use(methodOverride('X-HTTP-Method-Override'));
    app.use(methodOverride('X-HTTP-Method'));

    app.use((req, res, next) => {
        logger.debug(`~ ${req.method} ${req.url}`);
        next();
    });

    app.use(compression());

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

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
}