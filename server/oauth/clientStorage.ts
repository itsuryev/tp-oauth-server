import _ = require('lodash');
import Promise = require('bluebird');
import RedirectUri from '../redirectUri';
import ClientInfo from './clientInfo';

import pgAsync from '../pgAsync';

export default {
    getClientByIdAsync(clientId: string) : Promise<ClientInfo> {
        return pgAsync.doWithPgClient(client => this.clientByIdGetter(client, clientId));
    },

    clientByIdGetter(pgClient: any, clientId: string): Promise<ClientInfo> {
        return pgClient
            .queryAsync('SELECT id, client_key, name, client_secret, redirect_uri, description from clients WHERE client_key = $1', [clientId])
            .then(result => {
                if (!result.rowCount) {
                    return null;
                }

                const client = result.rows[0];
                const ret: ClientInfo = {
                    id: client.id,
                    clientId: client.client_key,
                    name: client.name,
                    clientSecret: client.client_secret,
                    redirectUri: new RedirectUri(client.redirect_uri),
                    description: client.description
                };
                return ret;
            });
    }
};
