import Promise = require('bluebird');

import {Request} from 'express';
import oauthClientUtils from './clientUtils';
import {ClientStorage} from './clientStorage';
import {ClientInfo, RedirectUri, AuthorizationRequest} from './models';
import {getTpUserFromRequest} from '../controllers/shared';
import {logger} from '../logging';

export default {
    getAuthorizationRequest(req: Request): Promise<AuthorizationRequest> {
        const responseType = req.query.response_type;
        // todo: shouldn't the lib handle it?
        if (responseType !== 'code') {
            return Promise.reject('Invalid response_type parameter (must be "code")');
        }

        const user = getTpUserFromRequest(req);
        if (!user) {
            logger.error('getAuthorizationRequest: User is not set');
            return Promise.reject('User is not set');
        }

        const clientId = req.query.client_id;

        return ClientStorage
            .getClientByIdAsync(clientId)
            .then(storedClientInfo => {
                if (!storedClientInfo) {
                    return Promise.reject('Client with specified ID does not exist');
                }

                const redirectUriValue: string = req.query.redirect_uri;
                const redirectUriValidationError = RedirectUri.validateUriPath(redirectUriValue);
                if (redirectUriValidationError) {
                    return Promise.reject(redirectUriValidationError);
                }

                const uriVerification = oauthClientUtils.tryGetFinalRedirectUri(
                    new RedirectUri(storedClientInfo.redirectUri), new RedirectUri(redirectUriValue));
                if (uriVerification.error) {
                    return Promise.reject(uriVerification.error);
                }

                return {
                    clientInfo: storedClientInfo,
                    redirectUri: uriVerification.value,
                    user
                };
            });
    }
};
