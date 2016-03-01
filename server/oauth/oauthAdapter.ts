import * as oauthserver from 'oauth2-server';
import {Request} from 'express';
import {logger} from '../logging';
import {ClientStorage} from './clientStorage';
import TokenStorage from './tokenStorage';
import AuthCodeStorage from './authCodeStorage';
import {TokenUserInfo} from './models';

export default class OAuthAdapter implements oauthserver.AuthorizationCodeModel {
    getAuthCode(authCode: string, callback: oauthserver.GetAuthCodeCallback): void {
        logger.debug('Enter getAuthCode', {authCode});
        AuthCodeStorage
            .getAuthCode(authCode)
            .then((x: any) => callback(null, x))
            .catch(err => callback(err, null));
    }

    saveAuthCode(authCode: string, clientId: string, expires: Date, user, callback: oauthserver.SaveAuthCodeCallback) {
        logger.debug('Enter saveAuthCode', {authCode, clientId, expires, user});
        AuthCodeStorage
            .saveAuthCode(authCode, clientId, expires, user)
            .then(() => callback(null))
            .catch(err => callback(err));
    }

    getClient(clientId: string, clientSecret: string, callback: oauthserver.GetClientCallback) {
        logger.debug('Enter getClient', {clientId, clientSecret});

        ClientStorage
            .getClientByIdAsync(clientId)
            .then(clientInfo => {
                if (!clientInfo) {
                    return null;
                }

                if (clientSecret && clientInfo.clientSecret !== clientSecret) {
                    return null;
                }

                return {
                    clientId: clientInfo.clientId,
                    redirectUri: clientInfo.redirectUri
                };
            })
            .then(x => callback(null, x))
            .catch(err => callback(err, null));
    }

    grantTypeAllowed(clientId: string, grantType: string, callback: oauthserver.GrantTypeAllowedCallback) {
        logger.debug('Enter grantTypeAllowed', {clientId, grantType});
        callback(false, grantType === 'authorization_code');
    }

    generateToken(type: string, request: Request, callback: oauthserver.GenerateTokenCallback) {
        logger.debug('Enter generateToken', {type});

        if (type !== 'accessToken') {
            logger.debug('generateToken: Returning because type is not supported');
            return callback(null, null);
        }

        const clientId: string = request.body.client_id;
        const user: TokenUserInfo = request.user;
        if (!clientId || !user) {
            logger.error('Unable to retrieve clientId or user from request for possible token re-issue');
            return callback(null, null);
        }

        TokenStorage
            .getAccessTokenForClientAndUser(clientId, user)
            .then(existingToken => {
                if (!existingToken) {
                    logger.debug('generateToken: There is no existing access token for specified client and user, falling back to default generation');
                    return callback(null, null);
                }

                const accessToken = existingToken.token;
                logger.debug('generateToken: Found existing token, reusing', {accessToken});
                callback(null, {accessToken});
            })
            .catch(err => callback(err, null));
    }

    getAccessToken(bearerToken: string, callback: oauthserver.GetAccessTokenCallback) {
        logger.debug('Enter getAccessToken', {bearerToken});
        TokenStorage
            .getAccessToken(bearerToken)
            .then(token => callback(null, {
                expires: token.expires,
                user: { id: token.user.id.toString() }
            }))
            .catch(err => callback(err, null));
    }

    saveAccessToken(accessToken: string, clientId: string, expires: Date, user, callback: oauthserver.SaveAccessTokenCallback) {
        logger.debug('Enter saveAccessToken', {accessToken, clientId, expires, user});
        TokenStorage
            .saveAccessToken(accessToken, clientId, expires, user)
            .then(() => callback(null))
            .catch(err => callback(err));
    }
}
