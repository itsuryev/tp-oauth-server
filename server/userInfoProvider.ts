import {Request} from 'express';
import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import {logger} from './logging';
import {nconf} from './configuration';
import {TpUserInfo} from './oauth/models';
import * as AccountInfo from './integration/accountInfo';

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
                firstName: 'FakeFirst',
                lastName: 'FakeLast',
                accountName,
                accountUrl: accountName,
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
                include: '[id, firstName, lastName]',
                format: 'json'
            },
            json: true,
            headers: {
                'Cookie': headerCookie
            }
        };

        const accountUrl = AccountInfo.buildAccountUrl(AccountInfo.getAccountResolverFromConfig(), accountName);

        return rp(`${accountUrl}/api/v1/Users/LoggedUser`, options)
            .then(response => {
                logger.debug('Got auth response from TP');

                return {
                    id: response.Id,
                    firstName: response.FirstName,
                    lastName: response.LastName,
                    accountName,
                    accountUrl,
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
