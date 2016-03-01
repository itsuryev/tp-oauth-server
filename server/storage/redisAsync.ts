import * as redis from 'redis';
import * as Promise from 'bluebird';
import {nconf} from '../configuration';

Promise.promisifyAll((redis as any).RedisClient.prototype);
Promise.promisifyAll((redis as any).Multi.prototype);

interface RedisConfig {
    host: string;
    port: number;
    dbNumber: number;
    password: string;
}

export default class RedisAsync {
    static get REDIS_KEY_PREFIX() {
        return 'tpauthservice:';
    }

    static get redisConnectionText() {
        const config = RedisAsync.redisConfig;
        return `${config.host}:${config.port} -> db ${config.dbNumber} -> ${config.password ? '<password>' : '<no password>'}`;
    }

    static get redisConfig(): RedisConfig {
        return nconf.get('redis');
    }

    static doWithRedisClient<T>(f: (c: any) => Promise<any>) {
        const config = RedisAsync.redisConfig;
        const client: any = redis.createClient({
            host: config.host,
            port: config.port,
            db: config.dbNumber,
            auth_pass: config.password
        } as redis.ClientOpts);

        return f(client).finally(() => client.quit());
    }

    static ping(): Promise<void> {
        const key = `${RedisAsync.REDIS_KEY_PREFIX}:nonexistingkey`;
        return RedisAsync.doWithRedisClient(c => c.hgetallAsync(key)).then(_ => null);
    }
};
