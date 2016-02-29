import path = require('path');
import _ = require('lodash');
import {logger} from '../server/logging';
import {nconf} from '../server/configuration';
import serverFactory from '../server/serverFactory';

export default function createTestServer() {
    logger.level = 'warn';

    const server = serverFactory({
        configFileName: path.resolve(__dirname, './config.tests.json')
    });

    nconf.set('devModeFakeUserIdToSkipAuthentication', _.uniqueId());

    return server;
}