import * as Promise from 'bluebird';

import {Request} from 'express';
import oauthClientUtils from './clientUtils';
import {ClientStorage} from './clientStorage';
import {RedirectUri, AuthorizationRequest} from './models';
import {getTpUserFromRequest} from '../controllers/shared';
import {logger} from '../logging';

export default {
    async getAuthorizationRequest(req: Request): Promise<AuthorizationRequest> {
        const responseType = req.query.response_type;
        // todo: shouldn't the lib handle it?
        if (responseType !== 'code') {
            throw new Error('Invalid response_type parameter (must be "code")');
        }

        const user = getTpUserFromRequest(req);
        if (!user) {
            logger.error('getAuthorizationRequest: User is not set');
            throw new Error('User is not set');
        }

        const clientId = req.query.client_id;

        const storedClientInfo = await ClientStorage.getClientByIdAsync(clientId);
        if (!storedClientInfo) {
            throw new Error('Client with specified ID does not exist');
        }

        const redirectUriValue: string = req.query.redirect_uri;
        const redirectUriValidationError = RedirectUri.validateUriPath(redirectUriValue);
        if (redirectUriValidationError) {
            throw redirectUriValidationError;
        }

        const uriVerification = oauthClientUtils.tryGetFinalRedirectUri(
            new RedirectUri(storedClientInfo.redirectUri), new RedirectUri(redirectUriValue));
        if (uriVerification.error) {
            throw uriVerification.error;
        }

        return {
            clientInfo: storedClientInfo,
            redirectUri: uriVerification.value,
            user
        };
    }
};
