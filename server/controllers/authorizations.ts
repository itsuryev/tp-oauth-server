import {Express, Request} from 'express';
import _ = require('lodash');

import TokenStorage from '../oauth/tokenStorage';
import {jsonError, authorizeUser, getTpUserFromRequest} from './shared';

export default function init(app: Express) {
    app.get('/tp_oauth/:accountName/authorizations', authorizeUser, (req: Request, res) => {
        const user = getTpUserFromRequest(req);
        TokenStorage
            .getAuthorizationsForUser(user)
            .then(authorizations => {
                res.json({
                    items: authorizations
                });
            })
            .catch(err => jsonError(res, err));
    });

    app.delete('/tp_oauth/:accountName/authorizations/:clientId', authorizeUser, (req: Request, res) => {
        const user = getTpUserFromRequest(req);
        const clientId = _.trim(req.params.clientId);

        if (!_.isString(clientId)) {
            return jsonError(res, {message: 'Required clientId parameter was not specified'});
        }

        TokenStorage
            .deleteAuthorizationForUser(clientId, user)
            .then(deletedCount => res.json({deleted: deletedCount}))
            .catch(err => jsonError(res, err));
    });
}