import Promise = require('bluebird');

import {Request} from 'express';
import oauthClientUtils from './clientUtils';
import oauthClientStorage from './clientStorage';
import {ClientInfo, RedirectUri, AuthorizationRequest} from './models';
import {logger} from '../logging';

export default {
    getAuthorizationRequest(req: Request): Promise<AuthorizationRequest> {
        const responseType = req.query.response_type;
        // todo: shouldn't the lib handle it?
        if (responseType !== 'code') {
            return Promise.reject('Invalid response_type parameter (must be "code")');
        }

        // Should be set by user authorization middleware
        const user = req['tpUser'];
        if (!user) {
            logger.error('getAuthorizationRequest: User is not set');
            return Promise.reject('User is not set');
        }

        const clientId = req.query.client_id;

        return oauthClientStorage
            .getClientByIdAsync(clientId)
            .then(storedClientInfo => {
                if (!storedClientInfo) {
                    return Promise.reject('Client with specified ID does not exist');
                }

                const redirectUri = req.query.redirect_uri;
                const uriVerification = oauthClientUtils.tryGetFinalRedirectUri(
                    storedClientInfo.redirectUri, redirectUri);
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
