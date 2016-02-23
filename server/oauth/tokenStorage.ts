import Promise = require('bluebird');
import pgAsync from '../storage/pgAsync';
import {TokenInfo, TokenUserInfo} from './models';
import {ClientStorage} from './clientStorage';

export default {
    getAccessTokenForClientAndUser(clientId: string, user: TokenUserInfo): Promise<TokenInfo> {
        return pgAsync
            .doWithPgClient(client => {
                return client.queryAsync(
                    'SELECT at.token, at.account_name, at.user_id FROM access_tokens at JOIN clients c ON at.client_id = c.id AND c.client_key = $1 AND at.user_id = $2 AND at.account_name = $3 LIMIT 1',
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
        return pgAsync
            .doWithPgClient(client => {
                return client.queryAsync('SELECT token, account_name, user_id FROM access_tokens WHERE token = $1 LIMIT 1', [bearerToken]);
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
        return pgAsync
            .doWithPgClient(pgClient => {
                return ClientStorage
                    .clientByIdGetter(pgClient, clientId)
                    .then(clientInfo => {
                        if (!clientInfo) {
                            return Promise.reject('Client with specified clientId does not exist');
                        }

                        return clientInfo.id;
                    })
                    .then(clientDbId => pgClient.queryAsync(
                        'INSERT INTO access_tokens (token, client_id, user_id, account_name) VALUES ($1, $2, $3, $4)',
                        [accessToken, clientDbId, user.id, user.accountName]
                    ));
            });
    }
}
