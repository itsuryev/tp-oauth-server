import nconfImport = require('nconf');
import fs = require('fs');
import path = require('path');

export const nconf = nconfImport;

nconf
    .argv()
    .env()
    .file('override', path.resolve(__dirname, '../build/config.private.json'))
    .defaults({
        accountResolver: 'localhost', // 'tpondemand', 'tpminsk',
        postgresConnectionString: ''
    });