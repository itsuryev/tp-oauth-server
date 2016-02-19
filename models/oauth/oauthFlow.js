const oauthClientUtils = require('./clientUtils');
const oauthClientStorage = require('./clientStorage');

function renderError(message) {
    return {
        error: message
    };
}

module.exports = {
    getAuthorizationRequest(req) {
        const responseType = req.query.response_type;
        // todo: shouldn't the lib handle it?
        if (responseType !== 'code') {
            return renderError('Invalid response_type parameter (must be "code")');
        }

        const clientId = req.query.client_id;
        const storedClientInfo = oauthClientStorage.getClientById(clientId);
        if (!storedClientInfo) {
            return renderError('Client with specified ID does not exist');
        }

        const redirectUri = req.query.redirect_uri;
        const uriVerification = oauthClientUtils.tryGetFinalRedirectUri(
            storedClientInfo.redirectUri, redirectUri);
        if (uriVerification.error) {
            return renderError(uriVerification.error);
        }

        return {
            value: {
                clientInfo: storedClientInfo,
                redirectUri: uriVerification.value
            }
        };
    }
};