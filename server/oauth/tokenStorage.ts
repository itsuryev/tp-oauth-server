import * as _ from 'lodash';
import * as Promise from 'bluebird';
import {logger} from '../logging';
import pgAsync from '../storage/pgAsync';
import {TokenInfo, TokenUserInfo, ClientAuthorizationInfo} from './models';
import {ClientStorage} from './clientStorage';

function getClientDbId(pgClient, clientId: string): Promise<number> {
    return ClientStorage
        .clientByIdGetter(pgClient, clientId)
        .then(clientInfo => {
            if (!clientInfo) {
                return Promise.reject<number>('Client with specified clientId does not exist');
            }

            return clientInfo.id;
        });
}

export default {
    async getAccessTokenForClientAndUser(clientId: string, user: TokenUserInfo): Promise<TokenInfo> {
        logger.debug('Enter TokenStorage.getAccessTokenForClientAndUser', {clientId, user});

        const result = await pgAsync.doWithPgClient(client => client.queryAsync(
            'SELECT at.token, at.account_name, at.user_id FROM access_tokens at INNER JOIN clients c ON at.client_id = c.id AND c.delete_date IS NULL AND c.client_key = $1 AND at.user_id = $2 AND at.account_name = $3 LIMIT 1',
            [clientId, user.id, user.accountName]));

        if (!result.rowCount) {
            return null;
        }

        const tokenRow = result.rows[0];
        const tokenInfo: TokenInfo = {
            user: {id: tokenRow.user_id, accountName: tokenRow.account_name},
            expires: null,
            token: tokenRow.token
        };

        return tokenInfo;
    },

    async getAccessToken(bearerToken: string): Promise<TokenInfo> {
        logger.debug('TokenStorage.getAccessToken: Enter', {bearerToken});
        const result = await pgAsync.doWithPgClient(client => client.queryAsync(
            'SELECT at.token, at.account_name, at.user_id FROM access_tokens at INNER JOIN clients c ON at.client_id = c.id AND c.delete_date IS NULL AND at.token = $1 LIMIT 1',
            [bearerToken]));

        if (!result.rowCount) {
            logger.debug('TokenStorage.getAccessToken: No such token');
            return null;
        }

        const tokenRow = result.rows[0];
        const tokenInfo: TokenInfo = {
            user: { id: tokenRow.user_id, accountName: tokenRow.account_name },
            expires: null,
            token: tokenRow.token
        };

        logger.debug('TokenStorage.getAccessToken: Found token', tokenInfo);
        return tokenInfo;
    },

    async saveAccessToken(accessToken: string, clientId: string, expires: Date, user: TokenUserInfo): Promise<any> {
        logger.debug('Enter TokenStorage.saveAccessToken', {accessToken, clientId, expires, user});
        return await pgAsync.doWithPgClient(async (pg) => {
            const clientDbId = await getClientDbId(pg, clientId);
            return await pg.queryAsync(
                'INSERT INTO access_tokens (token, client_id, user_id, account_name, issue_date) VALUES ($1, $2, $3, $4, $5)',
                [accessToken, clientDbId, user.id, user.accountName, new Date()]
            );
        });
    },

    async getAuthorizationsForUser(user: TokenUserInfo): Promise<ClientAuthorizationInfo[]> {
        logger.debug('Enter TokenStorage.getAuthorizationsForUser', {user});

        const results = await pgAsync.doWithPgClient(pg => pg.queryAsync(
            'SELECT c.client_key, c.name, c.description, at.issue_date FROM clients c INNER JOIN access_tokens at ON at.client_id = c.id AND c.delete_date IS NULL AND at.user_id = $1 AND at.account_name = $2',
            [user.id, user.accountName]
        ));

        if (!results.rowCount) {
            return [];
        }

        return _.map(results.rows, row => {
            const authorizationInfo: ClientAuthorizationInfo = {
                clientId: row['client_key'],
                clientName: row['name'],
                clientDescription: row['description'],
                issueDate: row['issue_date']
            };
            return authorizationInfo;
        });
    },

    async deleteAuthorizationForUser(clientId: string, user: TokenUserInfo): Promise<number> {
        logger.debug('Enter TokenStorage.deleteAuthorizationForUser', {clientId, user});

        const results = await pgAsync.doWithPgClient(async (pg) => {
            const clientDbId = await getClientDbId(pg, clientId);
            return await pg.queryAsync(
                'DELETE FROM access_tokens WHERE client_id = $1 AND user_id = $2 AND account_name = $3',
                [clientDbId, user.id, user.accountName]
            );
        });

        return results.rowCount;
    }
}
