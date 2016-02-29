import path = require('path');
import createServer from './serverFactory';

createServer({
    configFileName: path.resolve(__dirname, '../build/config.private.json')
});