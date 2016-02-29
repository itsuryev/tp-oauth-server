import {Request} from 'express';
import rp = require('request-promise');
import http = require('http');
import Promise = require('bluebird');
import {logger} from './logging';
import {nconf} from './configuration';
import {TpUserInfo} from './oauth/models';

function buildAccountUrl(accountName: string): string {
    const accountResolver = nconf.get('accountResolver');
    switch (accountResolver) {
        case 'localhost':
            return 'http://localhost/targetprocess';
        case 'tpminsk.by':
        case 'tpondemand.net':
        case 'tpondemand.com':
            // TODO: HTTPS support
            return `http://${accountName}.${accountResolver}`;
        default:
            logger.error('Unknown accountResolver', {accountResolver});
            throw new Error('Unknown accountResolver');
    }
}

export default class UserInfoProvider {
    static getUserInfoFromRequest(req: Request): Promise<TpUserInfo> {
        logger.debug('Enter getUserInfoFromRequest');
        logger.debug('Headers', req.headers['Cookie']);

        const accountName = UserInfoProvider.getAccountName(req);

        return UserInfoProvider._getUserInfo(req, accountName);
    }

    private static _getUserInfo(req: Request, accountName: string): Promise<TpUserInfo> {
        const fakeUserId: number = nconf.get('devModeFakeUserIdToSkipAuthentication');
        if (fakeUserId) {
            logger.debug('Using fake user ID', fakeUserId);
            return Promise.resolve({
                id: fakeUserId,
                accountName,
                cookie: ''
            });
        }

        return UserInfoProvider._getUserInfoFromHeaderCookie(req.headers['cookie'], accountName);
    }

    private static _getUserInfoFromHeaderCookie(headerCookie: string, accountName: string): Promise<TpUserInfo> {
        logger.debug('Enter getUserInfo');
        if (!headerCookie || !headerCookie.length) {
            return Promise.resolve(null);
        }

        const options = {
            qs: {
                include: '[id]',
                format: 'json'
            },
            json: true,
            headers: {
                'Cookie': headerCookie
            }
        };

        return rp(`${buildAccountUrl(accountName)}/api/v1/Users/LoggedUser`, options)
            .then(response => {
                logger.debug('Got auth response from TP');

                return {
                    id: response.Id,
                    accountName: accountName,
                    cookie: headerCookie
                };
            });
    }

    static getAccountName(req: Request): string {
        logger.debug('getAccountName', {url: req.url, hostname: req.hostname});
        const accountName = req.params.accountName;

        if (!accountName || !accountName.length) {
            logger.error('Unable to resolve account name');
            return null;
        }

        logger.debug(`Resolved account name '${accountName}'`);
        return accountName;
    }
};
