import {Request} from 'express';
import http = require('http');
import Promise = require('bluebird');
import {logger} from './logging';
import rp = require('request-promise');

interface UserInfo {
    id: number;
    accountName: string;
    cookie: string;
}

function buildAccountUrl(accountName: string): string {
    return 'http://localhost/targetprocess';
    //return `http://${accountName}.tpondemand.com`;
}

export default class UserInfoProvider {
    static getUserInfoFromRequest(req: Request): Promise<UserInfo> {
        logger.debug('Enter getUserInfoFromRequest');
        logger.debug('Headers', req.headers['cookie']);

        const accountName = UserInfoProvider.getAccountName(req);

        return UserInfoProvider.getUserInfo(req.headers['cookie'], accountName);
    }

    static getUserInfo(headerCookie: string, accountName: string): Promise<UserInfo> {
        if (!headerCookie || !headerCookie.length) {
            return Promise.resolve(null);
        }

        const options = {
            qs: {
                include: '[id]',
                format: 'json'
            },
            json: true
        };

        return rp(`${buildAccountUrl(accountName)}/api/v1/Users/LoggedUser`, options)
            .then(response => {
                return {
                    id: response.Id,
                    accountName: accountName,
                    cookie: headerCookie
                }
            });
    }

    static getAccountName(req: Request): string {
        logger.debug('getAccountName', {url: req.url, host: req.host, hostname: req.hostname});
        const accountName = req.params.accountName;

        if (!accountName || !accountName.length) {
            logger.error('Unable to resolve account name');
            return null;
        }

        logger.debug(`Resolved account name '${accountName}'`);
        return accountName;
    }
};
