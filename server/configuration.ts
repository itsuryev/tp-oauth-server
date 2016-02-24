import nconfImport = require('nconf');
import fs = require('fs');
import path = require('path');

export const nconf = nconfImport;

nconf
    .argv()
    .env()
    .file('override', path.resolve(__dirname, '../build/config.private.json'))
    .defaults({
        port: 3000,
        ip: '0.0.0.0',
        accountResolver: 'localhost', // 'tpondemand.com', 'tpondemand.net' 'tpminsk.by',
        postgresConnectionString: ''
    });