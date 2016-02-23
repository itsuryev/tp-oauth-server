import pg = require('pg');
import Promise = require('bluebird');

const defaultConnectionStrings = require('../config/db.private.json');
const connectionString = process.env.POSTGRES_CONNECTION_STRING || defaultConnectionStrings.postgres;

Promise.promisifyAll(pg.Client.prototype);
Promise.promisifyAll(pg.Client);
Promise.promisifyAll(pg.Query.prototype);
Promise.promisifyAll(pg.Query);
Promise.promisifyAll(pg);

export default {
    doWithPgClient<T>(f: (c: any) => Promise<any>) {
        return (pg as any)
            .connectAsync(connectionString)
            .then(client => {
                return f(client).finally(() => client.end());
            });
    }
};
