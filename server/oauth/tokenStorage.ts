import Promise = require('bluebird');
import redisAsync from '../redisAsync';

function buildAccessTokenDbKey(accessToken: string): string {
    return `accesstokens:${accessToken}`;
}

interface TokenInfo {
    expires: Date,
    user: any
}

export default {
    getAccessToken(bearerToken: string): Promise<TokenInfo> {
        const key = buildAccessTokenDbKey(bearerToken);
        return redisAsync
            .doWithRedisClient(db => db.hgetallAsync(key))
            .then(results => {
                if (!results) {
                    return null;
                }

                return {
                    expires: null,
                    user: {id: results.userId}
                };
            });
    },

    saveAccessToken(accessToken: string, clientId: string, expires: Date, user): Promise<any> {
        const key = buildAccessTokenDbKey(accessToken);
        return redisAsync
            .doWithRedisClient(db => db.hmsetAsync(key, {
                accessToken: accessToken,
                clientId: clientId,
                expires: null,
                userId: user.id
            }))
    }
}
