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

Nodemon is used to start and restart server when source code changes

    npm install -g nodemon

Then:

    npm start

You can also use [Sample OAuth client](https://github.com/khmylov/tp-oauth-client) to test the integration.

### Integration with Targetprocess

Most likely your local installation of Targetprocess will be served by IIS.

You will need to install [iisnode](https://github.com/tjanczuk/iisnode). Follow the instructions to initialize samples.

Then change settings of created `node` IIS application to point to `/build` directory of this application instead of the samples.

Add the following `web.config` file to `/build` directory:

    <configuration>
      <system.webServer>
        <handlers>
          <add name="iisnode" path="backend.js" verb="*" modules="iisnode" />
        </handlers>
        <rewrite>
          <rules>
            <rule name="myapp">
              <match url="/*" />
              <action type="Rewrite" url="backend.js" />
            </rule>
          </rules>
        </rewrite>
      </system.webServer>
    </configuration>

Run `npm run build` if you haven't done so yet to create `/build/backend.js` file.

Configure IIS url rewriting to map `localhost/targetprocess/oauth/{action_name}`
to `localhost/node/tp_oauth/{account_name}/{action_name}`

`account_name` can be any string representing the name of Targetprocess account you'd like to associate users with, for example `localhost`.

Optionally, you can rename `node` IIS application to anything you see fit, like `tp-oauth`.
Don't forget to update url rewriting config in that case.

## Deployment

Not completed yet, but probably will use pm2 to daemonize and clusterize the application.
