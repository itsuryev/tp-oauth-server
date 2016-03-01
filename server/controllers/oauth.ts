import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as oauthserver from 'oauth2-server';
import {Express, Request, Response} from 'express';
import {logger} from '../logging';
import redisAsync from '../storage/redisAsync';
import pgAsync from '../storage/pgAsync';
import OAuthModel from '../oauth/oauthAdapter';
import oauthFlow from '../oauth/oauthFlow';
import TokenStorage from '../oauth/tokenStorage';
import UserInfoProvider from '../userInfoProvider';
import {wrap, useErrorPage, jsonError, authorizeUserWithRedirect} from './shared';
import PromiseUtils from '../utils/promise';

export default function init(app: Express) {
    const appOAuth = oauthserver({
        model: new OAuthModel(),
        grants: ['authorization_code'],
        accessTokenLifetime: null,
        authCodeLifetime: 300,
        debug: process.env.NODE_ENV !== 'production'
    });

    app.get('/tp_oauth/:accountName/status', wrap(async (req: Request, res) => {
        function safePing(pingPromise, getResult = null) {
            return PromiseUtils.wrapSafe(pingPromise, getResult || (x => 'OK'));
        }

        const join: Function = Promise.join;

        await join(
            safePing(pgAsync.ping()), safePing(redisAsync.ping()), safePing(UserInfoProvider.getUserInfoFromRequest(req), x => x),
            (pgPing, redisPing, userInfo) => {
                res.json({
                    redis: redisPing,
                    pg: pgPing,
                    userInfo: userInfo,
                    accountName: UserInfoProvider.getAccountName(req)
                });
            });
    }));

    app.all('/tp_oauth/:accountName/access_token', appOAuth.grant());

    app.get('/tp_oauth/:accountName/authorize', useErrorPage, authorizeUserWithRedirect, wrap(async (req: Request, res, next) => {
        const authRequest = await oauthFlow.getAuthorizationRequest(req);
        const clientInfo = authRequest.clientInfo;

        // Try to automatically allow if user has already authorized the client before
        // It's important to ensure that redirect_uri of request is the same as the one specified in client info,
        // to prevent authorizing anyone who knows some client_id.

        const existingToken = await TokenStorage.getAccessTokenForClientAndUser(clientInfo.clientId, authRequest.user);
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
    }));

    app.post('/tp_oauth/:accountName/authorize', useErrorPage, authorizeUserWithRedirect, (req, res, next) => {
        // todo: CSRF handling
        // todo: clickjacking

        next();
    }, (appOAuth as any).authCodeGrant((req, next) => {
        next(null, req.body.allow === 'yes', req['tpUser']);
    }));

    app.get('/tp_oauth/:accountName/tokens/:token', wrap(async (req: Request, res: Response) => {
        const token = req.params.token;
        if (!_.isString(token) || !token.length) {
            logger.error('Invalid token parameter. Should be a non-empty string', {token});
            jsonError(res, {message: 'Invalid token parameter. Should be a non-empty string.'}, 400);
            return;
        }

        const tokenInfo = await TokenStorage.getAccessToken(token);
        const userInfo = tokenInfo ? tokenInfo.user : null;
        if (!userInfo) {
            logger.debug('Specified token does not exist');
            res.json({
                status: 'error',
                message: 'Specified token does not exist'
            });
            return;
        }

        res.json({
            status: 'ok',
            token: {
                userId: userInfo.id,
                accountName: userInfo.accountName
            }
        });
    }));
};
