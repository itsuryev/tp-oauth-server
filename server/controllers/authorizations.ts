import {Express, Request} from 'express';
import * as _ from 'lodash';

import TokenStorage from '../oauth/tokenStorage';
import {jsonError, authorizeUser, getTpUserFromRequest} from './shared';

export default function init(app: Express) {
    app.get('/tp_oauth/:accountName/authorizations', authorizeUser, async (req: Request, res) => {
        const user = getTpUserFromRequest(req);

        try {
            const authorizations = await TokenStorage.getAuthorizationsForUser(user);
            res.json({
                items: authorizations
            });
        } catch (err) {
            jsonError(res, err);
        }
    });

    app.delete('/tp_oauth/:accountName/authorizations/:clientId', authorizeUser, async (req: Request, res) => {
        const user = getTpUserFromRequest(req);
        const clientId = _.trim(req.params.clientId);

        if (!_.isString(clientId)) {
            return jsonError(res, {message: 'Required clientId parameter was not specified'});
        }

        try {
            const deletedCount = await TokenStorage.deleteAuthorizationForUser(clientId, user);
            res.json({deleted: deletedCount});
        } catch (err) {
            jsonError(res, err);
        }
    });
}