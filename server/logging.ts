import * as winston from 'winston';
import * as path from 'path';
export const logger = winston;

const isProduction = process.env.NODE_ENV === 'production';
logger.level = isProduction ? 'debug' : 'debug';

logger.remove(winston.transports.Console);
logger.add(winston.transports.Console, {
    colorize: true
} as winston.TransportOptions);

logger.add(winston.transports.File, {
    timestamp: true,
    filename: path.resolve(__dirname, '../logs/log.txt'),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
    json: true
} as winston.TransportOptions);
