import * as _ from 'lodash';
import * as Promise from 'bluebird';
import {ClientInfo} from './models';
import pgAsync from '../storage/pgAsync';

export class ClientQuerySpec {
    take: number;
    skip: number;
    includeSecrets: boolean;
}

export class ClientStorage {
    static async getClients(spec: ClientQuerySpec): Promise<ClientInfo[]> {
        const take = Math.min(spec.take || 25, 100);
        const skip = spec.skip || 0;
        const result = await pgAsync
            .doWithPgClient(pgClient => pgClient.queryAsync(
                'SELECT id, client_key, name, client_secret, redirect_uri, description FROM clients WHERE delete_date IS NULL LIMIT $1 OFFSET $2',
                [take, skip]));

        return _.map(result.rows, row =>
            ClientStorage._buildClientInfoFromRow(row, spec.includeSecrets || false));
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

    static async clientByIdGetter(pgClient: any, clientId: string): Promise<ClientInfo> {
        const result = await pgClient.queryAsync(
            'SELECT id, client_key, name, client_secret, redirect_uri, description FROM clients WHERE delete_date IS NULL AND client_key = $1',
            [clientId]);

        if (!result.rowCount) {
            return null;
        }

        return ClientStorage._buildClientInfoFromRow(result.rows[0], true);
    }

    static getClientByIdAsync(clientId: string): Promise<ClientInfo> {
        return pgAsync.doWithPgClient(pg => ClientStorage.clientByIdGetter(pg, clientId));
    }

    static createClient({clientId, name, clientSecret, redirectUri, description}): Promise<void> {
        return pgAsync.doWithPgClient(pg => pg.queryAsync(
            'INSERT INTO clients (client_key, name, client_secret, redirect_uri, description) VALUES ($1, $2, $3, $4, $5)',
            [clientId, name, clientSecret, redirectUri, description]));
    }

    static deleteAllClientsExtremelyUnsafePrepareToSuffer() {
        return pgAsync.doWithPgClient(pg => pg.queryAsync('DELETE FROM clients'));
    }
}
