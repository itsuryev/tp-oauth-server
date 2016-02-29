import _ = require('lodash');
import Promise = require('bluebird');
import {ClientInfo, RedirectUri} from './models';
import pgAsync from '../storage/pgAsync';

export class ClientQuerySpec {
    take: number;
    skip: number;
    includeSecrets: boolean;
}

export class ClientStorage {
    static getClients(spec: ClientQuerySpec): Promise<ClientInfo[]> {
        const take = Math.min(spec.take || 25, 100);
        const skip = spec.skip || 0;
        return pgAsync
            .doWithPgClient(pgClient => pgClient.queryAsync(
                'SELECT id, client_key, name, client_secret, redirect_uri, description FROM clients WHERE delete_date IS NULL LIMIT $1 OFFSET $2',
                [take, skip]))
            .then(result => _.map(
                result.rows,
                row => ClientStorage._buildClientInfoFromRow(row, spec.includeSecrets || false))
            );
    }

    private static _buildClientInfoFromRow(row, includeSecrets: boolean): ClientInfo {
        return {
            id: row.id,
            clientId: row.client_key,
            name: row.name,
            clientSecret: includeSecrets ? row.client_secret : undefined,
            redirectUri: row.redirect_uri,
            description: row.description
        };
    }

    static clientByIdGetter(pgClient: any, clientId: string): Promise<ClientInfo> {
        return pgClient
            .queryAsync('SELECT id, client_key, name, client_secret, redirect_uri, description FROM clients WHERE delete_date IS NULL AND client_key = $1', [clientId])
            .then(result => {
                if (!result.rowCount) {
                    return null;
                }

                return ClientStorage._buildClientInfoFromRow(result.rows[0], true);
            });
    }

    static getClientByIdAsync(clientId: string): Promise<ClientInfo> {
        return pgAsync.doWithPgClient(client => ClientStorage.clientByIdGetter(client, clientId));
    }
}
