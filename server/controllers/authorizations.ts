import {Express, Request} from 'express';
import * as _ from 'lodash';

import TokenStorage from '../oauth/tokenStorage';
import {wrap, jsonError, authorizeUser, getTpUserFromRequest} from './shared';

import '../assets/oauth-confirm/style.css';

export default function init(app: Express) {
    app.get('/tp_oauth/:accountName/authorizations', authorizeUser, wrap(async (req: Request, res) => {
        const user = getTpUserFromRequest(req);

        const authorizations = await TokenStorage.getAuthorizationsForUser(user);
        res.json({
            items: authorizations
        });
    }));

    app.delete('/tp_oauth/:accountName/authorizations/:clientId', authorizeUser, wrap(async (req: Request, res) => {
        const user = getTpUserFromRequest(req);
        const clientId = _.trim(req.params.clientId);

        if (!_.isString(clientId)) {
            return jsonError(res, {message: 'Required clientId parameter was not specified'});
        }

        const deletedCount = await TokenStorage.deleteAuthorizationForUser(clientId, user);
        res.json({deleted: deletedCount});
    }));
}