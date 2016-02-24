import _ = require('lodash');
import Result from '../result';
import {RedirectUri} from './models';
import {logger} from '../logging';

function safeTrim(s: string): string {
    if (!s) {
        return null;
    }

    return _.trim(s);
}

const error = Result.createError;
const value = Result.createValue;

export default {
    tryGetFinalRedirectUri(storedClientRedirectUri: RedirectUri, requestedRedirectUri: RedirectUri): Result<RedirectUri> {
        const storedPath = storedClientRedirectUri.getPath();
        const requestedPath = requestedRedirectUri.getPath();
        logger.info('Determining final redirect uri', {storedPath, requestedPath});

        if (!storedPath.length) {
            return error<RedirectUri>('There is no stored client redirect URI');
        }

        if (!requestedPath.length) {
            return value(storedClientRedirectUri);
        }

        // todo: check that requested url points to subdomain of stored url

        if (storedPath.toLowerCase() !== requestedPath.toLowerCase()) {
            logger.info('Stored and requested URIs don\'t match', {storedPath, requestedPath});
            return error<RedirectUri>('Stored and requested URIs don\'t match');
        }

        return value(storedClientRedirectUri);
    }
};
