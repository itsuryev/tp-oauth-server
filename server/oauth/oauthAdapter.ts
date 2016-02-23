import oauthserver = require('oauth2-server');
import Promise = require('bluebird');
import redisAsync from '../redisAsync';
import ClientStorage from './clientStorage';
import TokenStorage from './tokenStorage';
import TokenUserInfo from './tokenUserInfo';

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
            .then(() => {console.log('~Saved')})
            .then(() => redisAsync.doWithRedisClient(db => db.expireatAsync(entryKey, expireAtDb)))
            .then(() => {console.log('~Saved and expired')})
            .then(() => callback(null))
            .catch(err => { console.error(err); callback(err);});
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
        const key = buildAccessTokenDbKey(accessToken);
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
