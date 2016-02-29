import {Express, Request, Response} from 'express';
import {logger} from '../logging';
import UserInfoProvider from '../userInfoProvider';
import {TpUserInfo} from '../oauth/models';

const REQUEST_TP_USER_FIELD = 'tpUser';

export function renderError(res: Response, message: string): void {
    res.render('pages/oauth-error', {message});
}

export function jsonError(res: Response, error): void {
    res.status(500).json(error);
}

function authorizeUserCore(onUnauthorized: Function, req: Request): Promise<any> {
    return UserInfoProvider
        .getUserInfoFromRequest(req)
        .then(userInfo => {
            logger.debug('Got user info', userInfo);
            if (!userInfo) {
                return onUnauthorized();
            }

            req[REQUEST_TP_USER_FIELD] = userInfo;
            logger.debug('Stored TpUser in request, moving next');
        });
}

export function authorizeUserWithRedirect(req: Request, res: Response, next): void {
    logger.debug('Enter oauth.authorizeUserWithRedirect');
    function onUnauthorized() {
        // TODO: redirect to TP for authorization
        renderError(res, 'User not authorized');
    }

    authorizeUserCore(onUnauthorized, req)
        .then(next)
        .catch(err => {
            logger.error('oauth.authorizeUserWithRedirect', err);
            renderError(res, err);
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
            res.status(500).json(err);
        });
}

export function getTpUserFromRequest(req: Request): TpUserInfo {
    return req[REQUEST_TP_USER_FIELD];
}