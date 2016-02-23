import Promise = require('bluebird');

import oauthClientUtils from './clientUtils';
import oauthClientStorage from './clientStorage';
import Result from '../result';
import ClientInfo from './clientInfo';
import RedirectUri from '../redirectUri';

interface AuthorizationRequest {
    clientInfo: ClientInfo;
    redirectUri: RedirectUri;
}

const error = msg => Result.createError<AuthorizationRequest>(msg);

export default {
    getAuthorizationRequest(req): Promise<AuthorizationRequest> {
        const responseType = req.query.response_type;
        // todo: shouldn't the lib handle it?
        if (responseType !== 'code') {
            return Promise.reject('Invalid response_type parameter (must be "code")');
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
                    redirectUri: uriVerification.value
                };
            });
    }
};
