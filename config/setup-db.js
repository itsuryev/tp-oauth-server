const pg = require('pg');
const Promise = require('bluebird');

Promise.promisifyAll(pg.Client.prototype);
Promise.promisifyAll(pg.Client);
Promise.promisifyAll(pg.Connection.prototype);
Promise.promisifyAll(pg.Connection);
Promise.promisifyAll(pg.Query.prototype);
Promise.promisifyAll(pg.Query);
Promise.promisifyAll(pg);

const defaultConnectionStrings = require('./db.private.json');

const connectionString = process.env.POSTGRES_CONNECTION_STRING || defaultConnectionStrings.postgres;

pg
    .connectAsync(connectionString)
    .then(client => {
        return client
            .queryAsync([
                'CREATE TABLE accessTokens (',
                '   id SERIAL PRIMARY KEY,',
                '   token TEXT',
                ')'
            ].join('\n'))
            .then(res => {
                console.log(res);
            })
            .finally(() => client.end());
    });
