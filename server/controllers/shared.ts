import * as querystring from 'querystring';
import {Request, Response} from 'express';
import {logger} from '../logging';
import UserInfoProvider from '../userInfoProvider';
import {TpUserInfo} from '../oauth/models';
import * as AccountInfo from '../integration/accountInfo';
import * as ExpressUtils from '../utils/expressUtils';
import ErrorPage from '../views/oauth/error';

import * as React from 'react';
/* tslint:disable */
const ReactDOMServer = require('react-dom/server');
/* tslint:enable */

const REQUEST_TP_USER_FIELD = 'tpUser';

export const wrap = fn => (...args) => fn(...args).catch(args[2]);

export function renderReact<P, S>(res: Response, component: React.ComponentClass<P>, props: P) {
    const element = React.createElement(component, props);
    const rendered = ReactDOMServer.renderToStaticMarkup(element);
    const output = `<!DOCTYPE html>\n${rendered}`;
    res.send(output);
}

export function useErrorPage(req: Request, res: Response, next): void {
    res['useErrorPageEnabled'] = true;
    next();
}

export function renderError(res: Response, message: string): void {
    renderReact(res, ErrorPage, {
        message
    });
}

export function jsonError(res: Response, error, statusCode: number = 500): void {
    res.status(statusCode).json(error);
}

function authorizeUserCore(onUnauthorized: Function, req: Request, next: Function): Promise<void> {
    return UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => {
            logger.debug('Got user info', userInfo);
            if (!userInfo) {
                onUnauthorized();
                return;
            }

            req[REQUEST_TP_USER_FIELD] = userInfo;
            logger.debug('Stored TpUser in request, moving next');
            next();
        });
}

export function authorizeUserWithRedirect(req: Request, res: Response, next): void {
    logger.debug('Enter oauth.authorizeUserWithRedirect');

    const accountName = UserInfoProvider.getAccountName(req);
    if (!accountName || !accountName.length) {
        logger.error('Unable to get account name for TP auth redirection');
        return renderError(res, 'Unable to get account name');
    }

    const accountUrl = AccountInfo.buildAccountUrl(AccountInfo.getAccountResolverFromConfig(), accountName);
    if (!accountUrl || !accountUrl.length) {
        logger.error('Unable to build account url for TP auth redirection');
        return renderError(res, 'Unable to build account url');
    }

    function onUnauthorized() {
        const returnUrl = AccountInfo.buildTargetprocessAuthReturnUrl(
            AccountInfo.getAccountConfigurationFromConfig(),
            accountName,
            ExpressUtils.getRequestUrl(req));

        const query = querystring.stringify({
            ReturnUrl: returnUrl
        });

        const redirectUrl = `${accountUrl}/login.aspx?${query}`;
        logger.debug('Redirecting user to Targetprocess', {redirectUrl});
        res.redirect(redirectUrl);
    }

    authorizeUserCore(onUnauthorized, req, next)
        .catch(err => {
            logger.error('oauth.authorizeUserWithRedirect', err);
            renderError(res, err);
            next(err);
        });
}

export function authorizeUser(req: Request, res: Response, next): void {
    logger.debug('Enter oauth.authorizeUser');
    function onUnauthorized() {
        res.status(401);
    }

    authorizeUserCore(onUnauthorized, req, next)
        .catch(err => {
            logger.error('oauth.authorizeUser', err);
            jsonError(res, err);
        });
}

export function getTpUserFromRequest(req: Request): TpUserInfo {
    return req[REQUEST_TP_USER_FIELD];
}