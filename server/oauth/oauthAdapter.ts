import oauthserver = require('oauth2-server');
import Promise = require('bluebird');
import {Request} from 'express';
import redisAsync from '../storage/redisAsync';
import ClientStorage from './clientStorage';
import TokenStorage from './tokenStorage';
import {TokenUserInfo} from './models';

function buildAuthDbCodeKey(authCode: string): string {
    return `authcodes:${authCode}`;
}

function buildAccessTokenDbKey(accessToken: string): string {
    return `accesstokens:${accessToken}`;
}

export default class OAuthAdapter implements oauthserver.AuthorizationCodeModel {
    getAuthCode(authCode: string, callback: oauthserver.GetAuthCodeCallback): void {
        console.log('~Enter getAuthCode', authCode);

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
        console.log('~Enter saveAuthCode', authCode, clientId, expires, user);
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
        console.log('~Enter getClient', clientId, clientSecret);

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
        console.log('~Enter grantTypeAllowed', clientId, grantType);
        callback(false, grantType === 'authorization_code');
    }

    generateToken(type: string, request: Request, callback: oauthserver.GenerateTokenCallback) {
        console.log('~Enter generateToken', type);
        if (type !== 'accessToken') {
            return callback(null, null);
        }

        const clientId: string = request.body.client_id;
        const user = request.user;
        if (!clientId || !user) {
            console.error('Unable to retrieve clientId or user from request for possible token re-issue');
            return callback(null, null);
        }

        TokenStorage
            .getAccessTokenForClientAndUser(clientId, user.id, user.accountName)
            .then(existingToken => {
                if (!existingToken) {
                    return callback(null, null);
                }

                callback(null, {accessToken: existingToken.token});
            })
            .catch(err => callback(err, null));
    }

    getAccessToken(bearerToken: string, callback: oauthserver.GetAccessTokenCallback) {
        console.log('~Enter getAccessToken', bearerToken);
        TokenStorage
            .getAccessToken(bearerToken)
            .then(({expires, user}) => callback(null, {
                expires,
                user: { id: user.id.toString() }
            }))
            .catch(err => callback(err, null));
    }

    saveAccessToken(accessToken: string, clientId: string, expires: Date, user, callback: oauthserver.SaveAccessTokenCallback) {
        console.log('~Enter saveAccessToken', accessToken, clientId, expires, user);
        TokenStorage
            .saveAccessToken(accessToken, clientId, expires, user)
            .then(() => callback(null))
            .catch(err => callback(err));
    }

    saveRefreshToken(refreshToken, clientId, expires, user, callback) {
        return callback('saveRefreshToken not implemented');
    }

    getUser(username, password, callback) {
        return callback('getUser not implemented');
    }
}
