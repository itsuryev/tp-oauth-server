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

            // Sets the proxied address of this service in the scope of some on-demand account.
            // For example, on 'testAccount' on-demand you will have this service available at https://testAccount.tpondemand.com/oauth/authorize
            targetprocessAuthorizationProxyPath: '/oauth/authorize',

            // When user is not authorized in Targetprocess, we redirect him to %targetprocess%/login.aspx?ReturnUrl=**
            // ReturnUrl parameter points back to this application url.
            // In production you will most likely build this url as %targetprocess%/%targetprocessAuthorizationProxyPath%,
            // However, when testing locally, you may not want to map this application to Targetprocess sub-path,
            // and instead address this service as localhost:%port%/tp_oauth/%account%/**, for example.
            // Set this option to true to use hostname of the incoming request to determine ReturnUrl value instead of relying on proxy settings.
            useRequestHostNameForTpLoginReturnUrl: false,

            // Can be used to avoid any user authentication with Targetprocess instance.
            // Specified value will always be substituted instead of actual user ID.
            // Should be used for testing only
            // devModeFakeUserIdToSkipAuthentication: 1
        });
}
