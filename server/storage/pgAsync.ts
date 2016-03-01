import * as pg from 'pg';
import * as Promise from 'bluebird';

import {nconf} from '../configuration';

Promise.promisifyAll(pg.Client.prototype);
Promise.promisifyAll(pg.Client);
Promise.promisifyAll(pg.Query.prototype);
Promise.promisifyAll(pg.Query);
Promise.promisifyAll(pg);

export default class PostgresAsync {
    static async doWithPgClient<T>(f: (c: any) => Promise<any>) {
        const connectionString = nconf.get('postgresConnectionString');

        const client = await (pg as any).connectAsync(connectionString);
        try {
            return await f(client);
        } finally {
            client.end();
        }
    }

    static ping(): Promise<void> {
        return PostgresAsync.doWithPgClient(c => c.queryAsync('SELECT * FROM access_tokens LIMIT 0'));
    }
};
