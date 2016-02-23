import winston = require('winston');
export const logger = winston;

export function configureForDebug() {
    logger.level = 'debug';
}