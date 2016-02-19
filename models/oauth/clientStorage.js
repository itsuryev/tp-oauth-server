var _ = require('lodash');

const knownClients = [
    {clientId: 'testApp1', name: 'Test App #1', clientSecret: 'testApp1Secret', redirectUri: 'http://localhost:3001/callback'}
];

module.exports = {
    /**
     * @param {string} clientId
     * @returns {{clientId: string, name: string, clientSecret: string, redirectUri: string}|null}
     */
    getClientById(clientId) {
        var existingClient = _.find(knownClients, c => c.clientId === clientId);
        if (!existingClient) {
            return null;
        }

        return _.cloneDeep(existingClient);
    }
};