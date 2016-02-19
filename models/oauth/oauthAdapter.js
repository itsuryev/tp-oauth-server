/* eslint no-console: 0 */

const redis = require('redis');
const clientStorage = require('./clientStorage');

const db = redis.createClient();

function buildAuthDbCodeKey(authCode) {
    return `authcodes:${authCode}`;
}

function buildAccessTokenDbKey(accessToken) {
    return `accesstokens:${accessToken}`;
}

module.exports = {
    getAuthCode(authCode, callback) {
        console.log('~Enter getAuthCode', authCode);

        const entryKey = buildAuthDbCodeKey(authCode);
        db.hgetall(entryKey, (err, results) => {
            if (err) {
                return callback(err);
            }

            if (!results) {
                return callback(false, null);
            }

            callback(false, {
                clientId: results.clientId,
                expires: new Date(results.expires),
                user: {id: results.userId }
            });
        });

        //return callback('getAuthCode not implemented');
    },

    saveAuthCode(authCode, clientId, expires, user, callback) {
        console.log('~Enter saveAuthCode', authCode, clientId, expires, user);
        const entryKey = buildAuthDbCodeKey(authCode);
        db.hmset(entryKey, {
            authCode: authCode,
            clientId: clientId,
            expires: expires.toISOString(),
            userId: user.id
        }, (err) => {
            if (err) {
                return callback(err);
            }

            db.expireat(entryKey, parseInt(expires / 1000, 10), (err) => {
                if (err) {
                    return callback(err);
                }

                callback();
            });
        });
    },

    getAccessToken(bearerToken, callback) {
        console.log('~Enter getAccessToken', bearerToken);
        const key = buildAccessTokenDbKey(bearerToken);
        db.hgetall(key, (err, results) => {
            if (err) {
                return callback(err);
            }

            if (!results) {
                return callback(false, null);
            }

            callback(false, {
                expires: null,
                user: {id: results.userId}
            });
        });
    },

    getClient(clientId, clientSecret, callback) {
        console.log('~Enter getClient', clientId, clientSecret);

        const clientInfo = clientStorage.getClientById(clientId);
        if (!clientInfo) {
            return callback();
        }

        if (clientSecret && clientInfo.clientSecret !== clientSecret) {
            return callback();
        }

        callback(null, {
            clientId: clientInfo.clientId,
            redirectUri: clientInfo.redirectUri
        });
    },

    grantTypeAllowed(clientId, grantType, callback) {
        console.log('~Enter grantTypeAllowed', clientId, grantType);
        callback(false, grantType === 'authorization_code');
    },

    saveAccessToken(accessToken, clientId, expires, user, callback) {
        console.log('~Enter saveAccessToken', accessToken, clientId, expires, user);
        const key = buildAccessTokenDbKey(accessToken);
        db.hmset(key, {
            accessToken: accessToken,
            clientId: clientId,
            expires: null,
            userId: user.id
        }, (err) => {
            if (err) {
                return callback(err);
            }
            callback();
        });
    },

    saveRefreshToken(refreshToken, clientId, expires, user, callback) {
        return callback('saveRefreshToken not implemented');
    },

    getUser(username, password, callback) {
        return callback('getUser not implemented');
    }
};