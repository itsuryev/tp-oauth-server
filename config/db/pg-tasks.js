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

const applicationConfig = require('../../build/config.private.json');

function readSqlScript(fileName) {
    return fs.readFileSync(path.resolve(__dirname, fileName), 'utf8');
}

function withPgAsync(conectionString, func) {
    return pg
        .connectAsync(conectionString)
        .then(client => {
            return func(client).finally(() => client.end());
        });
}

function runScript(client, fileName) {
    return client.queryAsync(readSqlScript(fileName));
}

module.exports = {
    defaultConnectionString: applicationConfig.postgresConnectionString,

    localRebuildWithSampleData(connectionString) {
        return withPgAsync(connectionString, client => {
            return runScript(client, './pg-drop-everything.sql')
                .then(() => runScript(client, './pg-create.sql'))
                .then(() => runScript(client, './pg-sample-data.sql'));
        })
    }
};