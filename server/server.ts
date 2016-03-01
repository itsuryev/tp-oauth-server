import * as path from 'path';
import ServerFactory from './serverFactory';

ServerFactory.createServer({
    configFileName: path.resolve(__dirname, '../build/config.private.json')
});