import * as nconfImport from 'nconf';

export const nconf = nconfImport;

export function initConfig(configFileName: string) {
    nconf
        .argv()
        .env()
        .file('override', configFileName)
        .defaults({
            port: 3000,
            ip: '0.0.0.0',
            postgresConnectionString: '',

            redis: {
                host: '127.0.0.1',
                port: '6379',
                dbNumber: 0,
                password: null
            },

            // Specifies how to build URL of Targetprocess instance from oauth-related requests
            // like /tp_oauth/{accountName}/authorize.
            // Possible options:
            //   - localhost; always point to localhost/targetprocess
            //   - tpondemand.com, tpondemand.net, tpminsk.by; prepend account name to specified host
            accountResolver: 'localhost', // 'tpondemand.com', 'tpondemand.net' 'tpminsk.by',

            // Can be used to avoid any user authentication with Targetprocess instance.
            // Specified value will always be substituted instead of actual user ID.
            // Should be used for testing only
            // devModeFakeUserIdToSkipAuthentication: 1
        });
}
