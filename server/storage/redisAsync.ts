import _ = require('lodash');
import redis = require('redis');
import Promise = require('bluebird');
import {nconf} from '../configuration';

interface RedisConfig {
    host: string;
    port: number;
    dbNumber: number;
}

export default class RedisAsync {
    static get redisConnectionText() {
        const config = RedisAsync.redisConfig;
        return `${config.host}:${config.port} -> db ${config.dbNumber}`;
    }

    static get redisConfig(): RedisConfig {
        return nconf.get('redis');
    }

    static doWithRedisClient<T>(f: (c: any) => Promise<any>) {
        const config = RedisAsync.redisConfig;
        const client: any = Promise.promisifyAll(redis.createClient(config.port, config.host));

        const computation = config.dbNumber ?
            client.selectAsync(config.dbNumber).then(() => f(client)) :
            f(client);

        return computation.finally(() => client.quit());
    }
};
