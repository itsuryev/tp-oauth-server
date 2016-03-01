import * as url from 'url';
import * as _ from 'lodash';
import Result from '../result';
import {RedirectUri} from './models';
import {logger} from '../logging';

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

        const storedUrlObject = url.parse(storedPath);
        const requestedUrlObject = url.parse(requestedPath);

        if (storedUrlObject.protocol !== requestedUrlObject.protocol) {
            return error<RedirectUri>('Stored and requested URIs have different protocols');
        }

        if (storedUrlObject.hostname !== requestedUrlObject.hostname) {
            return error<RedirectUri>('Stored and requested URIs have different hostnames');
        }

        if (!_.startsWith(requestedUrlObject.path, storedUrlObject.path)) {
            return error<RedirectUri>('Requested URI may only point to sub-path of stored URI');
        }

        return value(requestedRedirectUri);
    }
};
