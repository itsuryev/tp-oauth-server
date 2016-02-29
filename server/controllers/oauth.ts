import {nconf} from '../configuration';
import _ = require('lodash');
import {Express, Request, Response} from 'express';
import Promise = require('bluebird');
import oauthserver = require('oauth2-server');
import redisAsync from '../storage/redisAsync';
import pgAsync from '../storage/pgAsync';
import {TokenUserInfo} from '../oauth/models';
import OAuthModel from '../oauth/oauthAdapter';
import oauthFlow from '../oauth/oauthFlow';
import TokenStorage from '../oauth/tokenStorage';
import UserInfoProvider from '../userInfoProvider';
import {logger} from '../logging';

function renderError(res: Response, message: string) {
    res.render('pages/oauth-error', {message});
}

function authorizeUser(req: Request, res: Response, next) {
    logger.debug('Enter oauth.authorizeUser');
    UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => {
            logger.debug('Got user info', userInfo);
            if (!userInfo) {
                // TODO: redirect to TP for authorization
                renderError(res, 'User not authorized');
                return;
            }

            req['tpUser'] = userInfo;
            next();
        })
        .catch(err => {
            logger.error('oauth.authorizeUser', err);
            renderError(res, err);
        });
}

export default function init(app: Express) {
    const URL_PREFIX = nconf.get('urlPrefix');

    const appOAuth = oauthserver({
        model: new OAuthModel(),
        grants: ['authorization_code'],
        accessTokenLifetime: null,
        authCodeLifetime: 300,
        debug: process.env.NODE_ENV !== 'production'
    });

    app.get(URL_PREFIX + '/tp_oauth/:accountName/status', (req: Request, res) => {
        function safePing(pingPromise, getResult = null) {
            return new Promise(resolve => {
                pingPromise.then(res => resolve(getResult ? getResult(res) : 'OK')).catch(err => resolve(err.toString()));
            });
        }

        const join: Function = Promise.join;

        join(
            safePing(pgAsync.ping()), safePing(redisAsync.ping()), safePing(UserInfoProvider.getUserInfoFromRequest(req), x => x),
            (pgPing, redisPing, userInfo) => {
                res.json({
                    redis: redisPing,
                    pg: pgPing,
                    userInfo: userInfo,
                    accountName: UserInfoProvider.getAccountName(req)
                });
            })
            .catch(err => res.json(err));
    });

    app.all(URL_PREFIX + '/tp_oauth/:accountName/access_token', appOAuth.grant());

    app.get(URL_PREFIX + '/tp_oauth/:accountName/authorize', authorizeUser, (req: Request, res, next) => {
        oauthFlow
            .getAuthorizationRequest(req)
            .then(authRequest => {
                const clientInfo = authRequest.clientInfo;

                // Try to automatically allow if user has already authorized the client before
                // It's important to ensure that redirect_uri of request is the same as the one specified in client info,
                // to prevent authorizing anyone who knows some client_id.

                TokenStorage
                    .getAccessTokenForClientAndUser(clientInfo.clientId, authRequest.user)
                    .then(existingToken => {
                        if (!existingToken) {
                            return res.render('pages/oauth-authorize', {
                                clientId: clientInfo.clientId,
                                clientName: clientInfo.name,
                                redirectUri: authRequest.redirectUri
                            });
                        }

                        const nextMiddleware = (appOAuth as any).authCodeGrant((req, next) => {
                            next(null, true, authRequest.user);
                        });

                        nextMiddleware(req, res, next);
                    });
            })
            .catch(err => renderError(res, err));
    });

    app.post(URL_PREFIX + '/tp_oauth/:accountName/authorize', authorizeUser, (req, res, next) => {
        // todo: CSRF handling
        // todo: clickjacking

        next();
    }, (appOAuth as any).authCodeGrant((req, next) => {
        next(null, req.body.allow === 'yes', req['tpUser']);
    }));

    app.get(URL_PREFIX + '/tp_oauth/:accountName/tokens/:token', (req, res) => {
        const token = req.params.token;
        if (!_.isString(token) || !token.length) {
            return res.status(400).send('Invalid token parameter. Should be a non-empty string.');
        }

        TokenStorage
            .getAccessToken(token)
            .then(tokenInfo => tokenInfo.user)
            .then(userInfo => {
                if (!userInfo) {
                    return res.json({
                        status: 'error',
                        message: 'Specified token does not exist'
                    });
                }

                res.json({
                    status: 'ok',
                    token: {
                        userId: userInfo.id,
                        accountName: userInfo.accountName
                    }
                });
            })
            .catch(err => res.status(500).send(err));
    });
};
