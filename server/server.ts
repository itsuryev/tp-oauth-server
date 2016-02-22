import express = require('express');
import bodyParser = require('body-parser');
import oauthserver = require('oauth2-server');
import ClientStorage from './oauth/clientStorage';
import OAuthModel from './oauth/oauthAdapter';
import oauthFlow from './oauth/oauthFlow';

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

function renderError(res : express.Response, message : string) {
    res.render('pages/oauth-error', {message});
}

const TEST_USER = {
    id: 140123,
    name: 'Andrew'
};

app.get('/', (req, res) => {
    const client = ClientStorage.getClientById('testApp1');
    res.send(JSON.stringify(client));
});

const appOAuth = oauthserver({
    model: new OAuthModel(),
    grants: ['authorization_code'],
    accessTokenLifetime: null,
    authCodeLifetime: 300,
    debug: true
});

app.all('/oauth/access_token', appOAuth.grant());
app.get('/oauth/authorize', (req, res) => {
    console.log('~ GET /oauth/authorize');

    oauthFlow
        .getAuthorizationRequest(req)
        .then(authRequest => {
            const clientInfo = authRequest.clientInfo;

            res.render('pages/oauth-authorize', {
                clientId: clientInfo.clientId,
                clientName: clientInfo.name,
                redirectUri: authRequest.redirectUri
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
