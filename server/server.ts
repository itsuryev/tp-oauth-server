import express = require('express');
import bodyParser = require('body-parser');
import oauthserver = require('oauth2-server');
import ClientStorage from './oauth/clientStorage';
import OAuthModel from './oauth/oauthAdapter';
import oauthFlow from './oauth/oauthFlow';
import TokenUserInfo from './oauth/tokenUserInfo';
import TokenStorage from './oauth/tokenStorage';

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

function renderError(res : express.Response, message : string) {
    res.render('pages/oauth-error', {message});
}

const TEST_USER: TokenUserInfo = {
    id: 140123,
    accountName: 'localhost'
};

app.get('/', (req, res) => {
    ClientStorage
        .getClientByIdAsync('testApp1')
        .then(client => res.send(JSON.stringify(client)))
        .catch(err => res.send(err));
});

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

                    var nextMiddleware = (appOAuth as any).authCodeGrant((req, next) => {
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App started on port ${PORT}.`);
});
