import {Request} from 'express';
import Promise = require('bluebird');
import {logger} from './logging';

interface UserInfo {
    id: number;
    accountName: string;
}

export default class UserInfoProvider {
    static getUserInfoFromRequest(req: Request): Promise<UserInfo> {
        logger.debug('Enter getUserInfoFromRequest');
        const accountName = UserInfoProvider.getAccountName(req);

        return Promise.resolve({
            id: 140123,
            accountName: accountName
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
