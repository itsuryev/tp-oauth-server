# OAuth 2.0 server for Targetprocess

## Prerequisites

- Node and NPM for building and running
- Redis to store authorization codes
- Postgres to store main domain entities, like clients or tokens

## Local development

### First steps

Restore dependencies

    npm install

Server is built with TypeScript, and [typings](https://github.com/typings/typings) are used to manage module definitions (stored in `typings.json`).

    npm install -g typings
    typings install

Gulp is used for task running

    npm install -g gulp-cli

Nodemon is used to start and restart server when source code changes

    npm install -g nodemon

Then:

    npm start

Add `config.private.json` file to `/config` directory. You can find the list of available options in `/server/configuration.ts`.

You can also use [Sample OAuth client](https://github.com/khmylov/tp-oauth-client) to test the integration.

### Integration with Targetprocess

Most likely your local installation of Targetprocess will be served by IIS.

You will need to configure IIS url rewrite to

First of all, install [IIS URL Rewrite](http://www.iis.net/downloads/microsoft/url-rewrite) and [Application Request Routing module](http://www.iis.net/downloads/microsoft/application-request-routing) to make it all possible.
With ARR installed, enable Proxy in its settings, and disable "Reverse rewrite host" (otherwise, redirects to something like `localhost:3001` won't work).

Then, add the following config to IIS site's `web.config` (assuming that Targetprocess is served from `localhost/targetprocess` and this server is bound to `localhost:3000`):

    <configuration>
        <system.webServer>
            <rewrite>
                <rules>
                    <rule name="oauth">
                        <match url="^targetprocess/oauth/(.*)" />
                        <action type="Rewrite" url="http://localhost:3000/tp_oauth/testAccountName/{R:1}" />
                    </rule>
                </rules>
            </rewrite>
        </system.webServer>
    </configuration>

You can use any name instead of `testAccountName` in this config, this will correspond to the name of account to associate with incoming user requests.

## Deployment

Not completed yet, but probably will use pm2 to daemonize and clusterize the application.
