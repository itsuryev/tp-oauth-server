import {Request} from 'express';
import Promise = require('bluebird');

interface UserInfo {
    id: number;
    accountName: string;
}

export default {
    getUserInfoFromRequest(req: Request): Promise<UserInfo> {
        const accountName = req.params.accountName;

        return Promise.resolve({
            id: 140123,
            accountName: accountName
        });
    }
};
