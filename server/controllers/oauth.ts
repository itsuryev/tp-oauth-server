import _ = require('lodash');
import {Express, Request} from 'express';
import Promise = require('bluebird');
import oauthserver = require('oauth2-server');
import {logger} from '../logging';
import redisAsync from '../storage/redisAsync';
import pgAsync from '../storage/pgAsync';
import OAuthModel from '../oauth/oauthAdapter';
import oauthFlow from '../oauth/oauthFlow';
import TokenStorage from '../oauth/tokenStorage';
import UserInfoProvider from '../userInfoProvider';
import {renderError, jsonError, authorizeUserWithRedirect} from './shared';
import PromiseUtils from '../utils/promise';

export default function init(app: Express) {
    const appOAuth = oauthserver({
        model: new OAuthModel(),
        grants: ['authorization_code'],
        accessTokenLifetime: null,
        authCodeLifetime: 300,
        debug: process.env.NODE_ENV !== 'production'
    });

    app.get('/tp_oauth/:accountName/status', (req: Request, res) => {
        function safePing(pingPromise, getResult = null) {
            return PromiseUtils.wrapSafe(pingPromise, getResult || (x => 'OK'));
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
            .catch(err => jsonError(res, err));
    });

    app.all('/tp_oauth/:accountName/access_token', appOAuth.grant());

    app.get('/tp_oauth/:accountName/authorize', authorizeUserWithRedirect, (req: Request, res, next) => {
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

    app.post('/tp_oauth/:accountName/authorize', authorizeUserWithRedirect, (req, res, next) => {
        // todo: CSRF handling
        // todo: clickjacking

        next();
    }, (appOAuth as any).authCodeGrant((req, next) => {
        next(null, req.body.allow === 'yes', req['tpUser']);
    }));

    app.get('/tp_oauth/:accountName/tokens/:token', (req, res) => {
        const token = req.params.token;
        if (!_.isString(token) || !token.length) {
            logger.error('Invalid token parameter. Should be a non-empty string', {token});
            return jsonError(res, {message: 'Invalid token parameter. Should be a non-empty string.'}, 400);
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
            .catch(err => jsonError(res, err));
    });
};
