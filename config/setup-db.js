/* eslint no-console: 0 */

const pg = require('pg');
const Promise = require('bluebird');

Promise.promisifyAll(pg.Client.prototype);
Promise.promisifyAll(pg.Client);
Promise.promisifyAll(pg.Connection.prototype);
Promise.promisifyAll(pg.Connection);
Promise.promisifyAll(pg.Query.prototype);
Promise.promisifyAll(pg.Query);
Promise.promisifyAll(pg);

const path = require('path');
const fs = require('fs');
const sqlScript = fs.readFileSync(path.resolve(__dirname, './setup-db.sql'), 'utf8');
console.log(sqlScript);

const defaultConnectionStrings = require('../build/config.private.json');

const connectionString = defaultConnectionStrings.postgresConnectionString;

pg
    .connectAsync(connectionString)
    .then(client => {
        return client
            .queryAsync(sqlScript)
            .then(res => {
                console.log(res);
            })
            .finally(() => client.end());
    });
