import _ = require('lodash');
import Result from '../result';
import {RedirectUri} from './models';

function safeTrim(s: string): string {
    if (!s) {
        return null;
    }

    return _.trim(s);
}

const error = Result.createError;
const value = Result.createValue;

export default {
    tryGetFinalRedirectUri(storedClientRedirectUri, requestedRedirectUri): Result<RedirectUri> {
        storedClientRedirectUri = safeTrim(storedClientRedirectUri);
        requestedRedirectUri = safeTrim(requestedRedirectUri);

        if (!storedClientRedirectUri || !storedClientRedirectUri.length) {
            return error<RedirectUri>('There is no stored client redirect URI');
        }

        if (!requestedRedirectUri || !requestedRedirectUri.length) {
            return value(storedClientRedirectUri);
        }

        // todo: check that requested url points to subdomain of stored url

        if (storedClientRedirectUri.toLowerCase() !== requestedRedirectUri.toLowerCase()) {
            return error<RedirectUri>('Stored and requested URIs don\'t match');
        }

        return value(storedClientRedirectUri);
    }
};
