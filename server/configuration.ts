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
        postgresConnectionString: '',

        // Specifies how to build URL of Targetprocess instance from oauth-related requests
        // like /tp_oauth/{accountName}/authorize.
        // Possible options:
        //   - localhost; always point to localhost/targetprocess
        //   - tpondemand.com, tpondemand.net, tpminsk.by; prepend account name to specified host
        accountResolver: 'localhost', // 'tpondemand.com', 'tpondemand.net' 'tpminsk.by',

        // Can be used to avoid any user authentication with Targetprocess instance.
        // Specified value will always be substituted instead of actual user ID.
        // Works for non-production environment only
        // devModeFakeUserIdToSkipAuthentication: 1,

        // A prefix to prepend to all routes of this app.
        // Might be required when app is served from some virtual directory.
        urlPrefix: ''
    });

export const URL_PREFIX = nconf.get('urlPrefix');