var _ = require('lodash');

function safeTrim(s) {
    if (!s) {
        return null;
    }

    return _.trim(s);
}

function error(message) {
    return {
        error: message
    };
}

function value(x) {
    return {
        value: x
    };
}

module.exports = {
    tryGetFinalRedirectUri(storedClientRedirectUri, requestedRedirectUri) {
        storedClientRedirectUri = safeTrim(storedClientRedirectUri);
        requestedRedirectUri = safeTrim(requestedRedirectUri);

        if (!storedClientRedirectUri || !storedClientRedirectUri.length) {
            return error('There is no stored client redirect URI');
        }

        if (!requestedRedirectUri || !requestedRedirectUri.length) {
            return value(storedClientRedirectUri);
        }

        // todo: check that requested url points to subdomain of stored url

        if (storedClientRedirectUri.toLowerCase() !== requestedRedirectUri.toLowerCase()) {
            return error('Stored and requested URIs don\'t match');
        }

        return value(storedClientRedirectUri);
    }
};