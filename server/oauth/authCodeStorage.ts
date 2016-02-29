import redisAsync from '../storage/redisAsync';
import {TokenUserInfo} from './models';

function buildAuthDbCodeKey(authCode: string): string {
    return `${redisAsync.REDIS_KEY_PREFIX}authcodes:${authCode}`;
}

export default class AuthCodeStorage {
    static getAuthCode(authCode: string): Promise<{clientId: string, expires: Date, user: TokenUserInfo}> {
        const entryKey = buildAuthDbCodeKey(authCode);

        return redisAsync
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
            });
    }

    static saveAuthCode(authCode: string, clientId: string, expires: Date, user) {
        const entryKey = buildAuthDbCodeKey(authCode);
        const expireAtDb = Math.ceil(expires.getTime() / 1000);
        return redisAsync
            .doWithRedisClient(db => db.hmsetAsync(entryKey, {
                authCode: authCode,
                clientId: clientId,
                expires: expires.toISOString(),
                userId: user.id,
                accountName: user.accountName
            }))
            .then(() => redisAsync.doWithRedisClient(db => db.expireatAsync(entryKey, expireAtDb)));
    }
}