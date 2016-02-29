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

function runScript(connectionString, fileName) {
    return withPgAsync(connectionString, client => client.queryAsync(readSqlScript(fileName)));
}

module.exports = {
    dropEverything(connectionString, done) {
        runScript(connectionString, './db/pg-drop-everything.sql').finally(done);
    },

    createDatabase(connectionString, done) {
        runScript(connectionString, './db/pg-create.sql').finally(done);
    },

    createSampleData(connectionString, done) {
        runScript(connectionString, './db/pg-sample-data.sql').finally(done);
    }
};