import redis = require('redis');
import Promise = require('bluebird');

export default {
    doWithRedisClient<T>(f: (c: any) => Promise<any>) {
        const client: any = Promise.promisifyAll(redis.createClient());
        return f(client).finally(() => client.quit());
    }
};
