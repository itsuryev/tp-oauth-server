import _ = require('lodash');
import Promise = require('bluebird');
import {logger} from '../logging';
import pgAsync from '../storage/pgAsync';
import {TokenInfo, TokenUserInfo, ClientAuthorizationInfo} from './models';
import {ClientStorage} from './clientStorage';

function getClientDbId(pgClient, clientId: string): Promise<number> {
    return ClientStorage
        .clientByIdGetter(pgClient, clientId)
        .then(clientInfo => {
            if (!clientInfo) {
                return Promise.reject('Client with specified clientId does not exist');
            }

            return clientInfo.id;
        });
}

export default {
    getAccessTokenForClientAndUser(clientId: string, user: TokenUserInfo): Promise<TokenInfo> {
        logger.debug('Enter TokenStorage.getAccessTokenForClientAndUser', {clientId, user});
        return pgAsync
            .doWithPgClient(client => {
                return client.queryAsync(
                    'SELECT at.token, at.account_name, at.user_id FROM access_tokens at INNER JOIN clients c ON at.client_id = c.id AND c.delete_date IS NULL AND c.client_key = $1 AND at.user_id = $2 AND at.account_name = $3 LIMIT 1',
                    [clientId, user.id, user.accountName]);
            })
            .then(result => {
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
            });
    },

    getAccessToken(bearerToken: string): Promise<TokenInfo> {
        logger.debug('Enter TokenStorage.getAccessToken', {bearerToken});
        return pgAsync
            .doWithPgClient(client => {
                return client.queryAsync('SELECT at.token, at.account_name, at.user_id FROM access_tokens INNER JOIN clients c ON at.client_id = c.id AND c.delete_date IS NULL AND at.token = $1 LIMIT 1', [bearerToken]);
            })
            .then(result => {
                if (!result.rowCount) {
                    return null;
                }

                const tokenRow = result.rows[0];
                const tokenInfo: TokenInfo = {
                    user: { id: tokenRow.user_id, accountName: tokenRow.account_name },
                    expires: null,
                    token: tokenRow.token
                };
                return tokenInfo;
            });
    },

    saveAccessToken(accessToken: string, clientId: string, expires: Date, user: TokenUserInfo): Promise<any> {
        logger.debug('Enter TokenStorage.saveAccessToken', {accessToken, clientId, expires, user});
        return pgAsync
            .doWithPgClient(pgClient =>
                getClientDbId(pgClient, clientId)
                    .then(clientDbId => pgClient.queryAsync(
                        'INSERT INTO access_tokens (token, client_id, user_id, account_name, issue_date) VALUES ($1, $2, $3, $4, $5)',
                        [accessToken, clientDbId, user.id, user.accountName, new Date()]
                    ))
            );
    },

    getAuthorizationsForUser(user: TokenUserInfo): Promise<ClientAuthorizationInfo[]> {
        logger.debug('Enter TokenStorage.getAuthorizationsForUser', {user});

        return pgAsync
            .doWithPgClient(pgClient => pgClient.queryAsync(
                'SELECT c.client_key, c.name, c.description, at.issue_date FROM clients c INNER JOIN access_tokens at ON at.client_id = c.id AND c.delete_date IS NULL AND at.user_id = $1 AND at.account_name = $2',
                [user.id, user.accountName]
            ))
            .then(results => {
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
            });
    },

    deleteAuthorizationForUser(clientId: string, user: TokenUserInfo): Promise<number> {
        logger.debug('Enter TokenStorage.deleteAuthorizationForUser', {clientId, user});

        return pgAsync
            .doWithPgClient(pgClient =>
                getClientDbId(pgClient, clientId)
                    .then(clientDbId => pgClient.queryAsync(
                        'DELETE FROM access_tokens WHERE client_id = $1 AND user_id = $2 AND account_name = $3',
                        [clientDbId, user.id, user.accountName]
                    ))
            )
            .then(results => results.rowCount);
    }
}
