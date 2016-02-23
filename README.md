# OAuth 2.0 server for Targetprocess

## Prerequisites

- Node and NPM for building and running
- Redis to store authorization codes
- Postgres to store main domain entities, like clients or tokens

## Local development

Restore dependencies

    npm install
        
Server is built with TypeScript, and [typings](https://github.com/typings/typings) are used to manage module definitions (stored in `typings.json`).

    npm install -g typings
    typings install
    
Nodemon is used to start and restart server when source code changes

    npm install -g nodemon
    
Then:

    npm start

## Deployment

Not completed yet, but probably will use pm2 to daemonize and clusterize the application.
