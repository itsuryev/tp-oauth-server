import oauthserver = require('oauth2-server');
import Promise = require('bluebird');
import {Request} from 'express';
import {logger} from '../logging';
import redisAsync from '../storage/redisAsync';
import {ClientStorage} from './clientStorage';
import TokenStorage from './tokenStorage';
import {TokenUserInfo} from './models';

function buildAuthDbCodeKey(authCode: string): string {
    return `${redisAsync.REDIS_KEY_PREFIX}authcodes:${authCode}`;
}

export default class OAuthAdapter implements oauthserver.AuthorizationCodeModel {
    getAuthCode(authCode: string, callback: oauthserver.GetAuthCodeCallback): void {
        logger.debug('Enter getAuthCode', {authCode});

        const entryKey = buildAuthDbCodeKey(authCode);

        redisAsync
            .doWithRedisClient(client => client.hgetallAsync(entryKey))
            .then(results => {
                if (!results) {
                    return null;
                }

                const user: TokenUserInfo = {
                    id: results.userId,
                    accountName: results.accountName
                };

                return {
                    clientId: results.clientId,
                    expires: new Date(results.expires),
                    user: user
                };
            })
            .then(authCode => {
                if (authCode) {
                    // Use auth code only once
                    return redisAsync
                        .doWithRedisClient(client => client.delAsync(entryKey))
                        .then(() => authCode);
                }

                return null;
            })
            .then((x: any) => callback(null, x))
            .catch(err => callback(err, null));
    }

    saveAuthCode(authCode: string, clientId: string, expires: Date, user, callback: oauthserver.SaveAuthCodeCallback) {
        logger.debug('Enter saveAuthCode', {authCode, clientId, expires, user});

        const entryKey = buildAuthDbCodeKey(authCode);
        const expireAtDb = Math.ceil(expires.getTime() / 1000);
        redisAsync
            .doWithRedisClient(db => db.hmsetAsync(entryKey, {
                authCode: authCode,
                clientId: clientId,
                expires: expires.toISOString(),
                userId: user.id,
                accountName: user.accountName
            }))
            .then(() => redisAsync.doWithRedisClient(db => db.expireatAsync(entryKey, expireAtDb)))
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
                    redirectUri: clientInfo.redirectUri.getPath()
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
