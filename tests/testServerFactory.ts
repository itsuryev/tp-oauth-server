import * as path from 'path';
import * as _ from 'lodash';
import {logger} from '../server/logging';
import {nconf} from '../server/configuration';
import ServerFactory from '../server/serverFactory';

export default function createTestServer() {
    logger.level = 'warn';

    const server = ServerFactory.createServer({
        configFileName: path.resolve(__dirname, '../config/config.tests.json')
    });

    nconf.set('devModeFakeUserIdToSkipAuthentication', _.uniqueId());

    return server;
}