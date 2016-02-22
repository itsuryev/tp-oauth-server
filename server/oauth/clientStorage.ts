import _ = require('lodash');
import Promise = require('bluebird');
import RedirectUri from '../redirectUri';
import ClientInfo from './clientInfo';

const knownClients = [
    new ClientInfo('testApp1', 'Test Application #1', 'testApp1Secret', new RedirectUri('http://localhost:3001/callback'))
];

export default {
    getClientById(clientId: string): ClientInfo {
        const existingClient = _.find(knownClients, c => c.clientId === clientId);
        if (!existingClient) {
            return null;
        }

        return _.cloneDeep(existingClient);
    },

    getClientByIdAsync(clientId: string) : Promise<ClientInfo> {
        return Promise.resolve(this.getClientById(clientId));
    }
}
