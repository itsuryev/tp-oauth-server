/* eslint no-console: 0 */
const express = require('express');
const bodyParser = require('body-parser');
const oauthserver = require('oauth2-server');
const oauthModel = require('./models/oauth/oauthAdapter');
const oauthFlow = require('./models/oauth/oauthFlow');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

function renderError(res, message) {
    res.render('pages/oauth-error', {message});
}

const TEST_USER = {
    id: 140123,
    name: 'Andrew'
};

app.oauth = oauthserver({
    model: oauthModel,
    grants: ['authorization_code'],
    accessTokenLifetime: null,
    authCodeLifetime: 300,
    debug: true
});
app.all('/oauth/access_token', app.oauth.grant());
app.get('/oauth/authorize', (req, res) => {
    console.log('~ GET /oauth/authorize');

    //if (!req.session.user) {
    //    // todo: redirect to TP and/or parse request properly
    //    return res.redirect('/login?redirect=' + req.path +
    //        '&client_id=' + req.query.client_id +
    //        '&redirect_uri=' + req.query.redirect_uri);
    //}

    const authRequest = oauthFlow.getAuthorizationRequest(req);
    if (authRequest.error) {
        return renderError(res, authRequest.error);
    }

    const clientInfo = authRequest.value.clientInfo;

    res.render('pages/oauth-authorize', {
        clientId: clientInfo.clientId,
        clientName: clientInfo.name,
        redirectUri: authRequest.value.redirectUri
    });
});

app.post('/oauth/authorize', (req, res, next) => {
    console.log('~ POST /oauth/authorize');
    // todo: CSRF handling
    // todo: clickjacking

    //if (!req.session.user) {
    //    // todo: redirect to TP and/or parse request properly
    //    return res.redirect('/login?redirect=' + req.path +
    //        '&client_id=' + req.query.client_id +
    //        '&redirect_uri=' + req.query.redirect_uri);
    //}

    next();
}, app.oauth.authCodeGrant((req, next) => {
    next(null, req.body.allow === 'yes', TEST_USER);
}));

app.use(app.oauth.errorHandler());

app.get('/', (req, res) => {
    res.render('pages/index');
});
app.get('/private', app.oauth.authorise(), (req, res) => {
    res.send('Secret area');
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App started on port ${port}.`);
});