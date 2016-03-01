import * as url from 'url';
import * as querystring from 'querystring';
import {Request, Response} from 'express';
import {logger} from '../logging';
import UserInfoProvider from '../userInfoProvider';
import {TpUserInfo} from '../oauth/models';

const REQUEST_TP_USER_FIELD = 'tpUser';

export const wrap = fn => (...args) => fn(...args).catch(args[2]);

function getFullUrl(req: Request) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.path,
        search: querystring.stringify(req.query)
    });
}

export function useErrorPage(req: Request, res: Response, next): void {
    res['useErrorPageEnabled'] = true;
    next();
}

export function renderError(res: Response, message: string): void {
    res.render('pages/oauth-error', {message});
}

export function jsonError(res: Response, error, statusCode: number = 500): void {
    res.status(statusCode).json(error);
}

function authorizeUserCore(onUnauthorized: Function, req: Request): Promise<boolean> {
    return UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => {
            logger.debug('Got user info', userInfo);
            if (!userInfo) {
                onUnauthorized();
                return false;
            }

            req[REQUEST_TP_USER_FIELD] = userInfo;
            logger.debug('Stored TpUser in request, moving next');
            return true;
        });
}

export function authorizeUserWithRedirect(req: Request, res: Response, next): void {
    logger.debug('Enter oauth.authorizeUserWithRedirect');

    const accountName = UserInfoProvider.getAccountName(req);
    if (!accountName || !accountName.length) {
        logger.error('Unable to get account name for TP auth redirection');
        return renderError(res, 'Unable to get account name');
    }

    const accountUrl = UserInfoProvider.buildAccountUrl(accountName);
    if (!accountUrl || !accountUrl.length) {
        logger.error('Unable to build account url for TP auth redirection');
        return renderError(res, 'Unable to build account url');
    }

    function onUnauthorized() {
        const query = querystring.stringify({
            ReturnUrl: getFullUrl(req)
        });
        const redirectUrl = `${accountUrl}/login.aspx?${query}`;
        logger.debug('Redirecting user to Targetprocess', {redirectUrl});
        res.redirect(redirectUrl);
    }

    authorizeUserCore(onUnauthorized, req)
        .then(shouldContinue => {
            if (shouldContinue) {
                next();
            }
        })
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

    authorizeUserCore(onUnauthorized, req)
        .then(next)
        .catch(err => {
            logger.error('oauth.authorizeUser', err);
            jsonError(res, err);
        });
}

export function getTpUserFromRequest(req: Request): TpUserInfo {
    return req[REQUEST_TP_USER_FIELD];
}