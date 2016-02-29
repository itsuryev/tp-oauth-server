import path = require('path');
import {logger} from '../server/logging';
import serverFactory from '../server/serverFactory';

export default function createTestServer() {
    logger.level = 'warn';

    return serverFactory({
        configFileName: path.resolve(__dirname, './config.tests.json')
    });
}