import {Express, Response} from 'express';
import oauthserver = require('oauth2-server');
import {TokenUserInfo} from '../oauth/models';
import OAuthModel from '../oauth/oauthAdapter';
import oauthFlow from '../oauth/oauthFlow';
import TokenStorage from '../oauth/tokenStorage';

const TEST_USER: TokenUserInfo = {
    id: 140123,
    accountName: 'localhost'
};

function renderError(res: Response, message: string) {
    res.render('pages/oauth-error', {message});
}

export default function init(app: Express) {
    const appOAuth = oauthserver({
        model: new OAuthModel(),
        grants: ['authorization_code'],
        accessTokenLifetime: null,
        authCodeLifetime: 300,
        debug: true
    });

    app.all('/oauth/access_token', appOAuth.grant());

    app.get('/oauth/authorize', (req, res, next) => {
        console.log('~ GET /oauth/authorize');

        oauthFlow
            .getAuthorizationRequest(req)
            .then(authRequest => {
                const clientInfo = authRequest.clientInfo;

                // Try to automatically allow if user has already authorized the client before
                // It's important to ensure that redirect_uri of request is the same as the one specified in client info,
                // to prevent authorizing anyone who knows some client_id.

                TokenStorage
                    .getAccessTokenForClientAndUser(clientInfo.clientId, TEST_USER.id, TEST_USER.accountName)
                    .then(existingToken => {
                        if (!existingToken) {
                            return res.render('pages/oauth-authorize', {
                                clientId: clientInfo.clientId,
                                clientName: clientInfo.name,
                                redirectUri: authRequest.redirectUri
                            });
                        }

                        const nextMiddleware = (appOAuth as any).authCodeGrant((req, next) => {
                            next(null, true, TEST_USER);
                        });

                        nextMiddleware(req, res, next);
                    });
            })
            .catch(err => renderError(res, err));
    });

    app.post('/oauth/authorize', (req, res, next) => {
        console.log('~ POST /oauth/authorize');
        // todo: CSRF handling
        // todo: clickjacking

        next();
    }, (appOAuth as any).authCodeGrant((req, next) => {
        next(null, req.body.allow === 'yes', TEST_USER);
    }));
};
