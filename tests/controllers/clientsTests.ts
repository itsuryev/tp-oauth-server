/// <reference path="../../typings/main.d.ts" />

import * as Promise from 'bluebird';
import * as request from 'supertest';
import testServerFactory from '../testServerFactory';

import TokenStorage from '../../server/oauth/tokenStorage';
import {ClientStorage} from '../../server/oauth/clientStorage';
import pgAsync from '../../server/storage/pgAsync';
import {nconf} from '../../server/configuration';

import * as chai from 'chai';

const expect = chai.expect;

interface TestClientInfo {
    clientId: string;
    name: string;
    description: string;
    redirectUri: string;
}

describe('controllers/clients', () => {
    var server;

    beforeEach(() => {
        server = testServerFactory();
    });

    afterEach(done => {
        server.close(done);
    });

    function getJsonFromServer(url) {
        return new Promise((resolve, reject) => {
            request(server)
                .get(url)
                .expect('Content-Type', /json/)
                .expect(res => resolve(JSON.parse(res.text)))
                .end(err => {
                    if (err) {
                        reject(err);
                    }
                });
        });
    }

    function insertClient({clientId, name, redirectUri, description}) {
        return ClientStorage.createClient({
            clientId,
            clientSecret: clientId + 'secret',
            name,
            redirectUri,
            description
        });
    }

    function assertClientInfoEquality(expected: TestClientInfo, actual) {
        expect(actual.clientId).to.be.equal(expected.clientId);
        expect(actual.name).to.be.equal(expected.name);
        expect(actual.redirectUri).to.be.equal(expected.redirectUri);
        expect(actual.description).to.be.equal(expected.description);
    }

    describe('GET /', () => {
        it('returns list of clients', done => {
            const clients: TestClientInfo[] = [
                {
                    clientId: 'testClient1',
                    name: 'Test Client #1',
                    redirectUri: 'http://example.com/c1',
                    description: 'First client'
                },
                {
                    clientId: 'testClient2',
                    name: 'Test Client #2',
                    redirectUri: 'http://example.com/c2',
                    description: 'Second client'
                }
            ];

            ClientStorage
                .deleteAllClientsExtremelyUnsafePrepareToSuffer()
                .then(() => insertClient(clients[0]))
                .then(() => insertClient(clients[1]))
                .then(() => getJsonFromServer('/api/clients'))
                .then((response: any) => {
                    const items = response.items;
                    assertClientInfoEquality(clients[0], items[0]);
                    assertClientInfoEquality(clients[1], items[1]);
                })
                .then(done);
        });
    });

    function createTestClientAndToken({clientKey, clientName, clientDescription}) {
        const userId = nconf.get('devModeFakeUserIdToSkipAuthentication');
        const accountName = 'testAccountName';

        return pgAsync
            .doWithPgClient(client => {
                return client.queryAsync(
                    'INSERT INTO clients (client_key, name, client_secret, redirect_uri, description) VALUES ($1, $2, $3, $4, $5)',
                    [clientKey, clientName, clientKey, 'http://example.com', clientDescription]);
            })
            .then(() => {
                return TokenStorage.saveAccessToken(clientKey + '-token1', clientKey, null, {
                    id: userId,
                    accountName
                });
            });
    }

    function getAuthorizationsFromServer(): Promise<any> {
        return new Promise((resolve, reject) => {
            request(server)
                .get('/tp_oauth/testAccountName/authorizations')
                .expect('Content-Type', /json/)
                .expect(res => {
                    resolve(JSON.parse(res.text));
                })
                .end(err => {
                    if (err) {
                        reject(err);
                    }
                });
        });
    }

    function deleteAuthorizationFromServer(clientId): Promise<any> {
        return new Promise((resolve, reject) => {
            request(server)
                .delete(`/tp_oauth/testAccountName/authorizations/${clientId}`)
                .expect('Content-Type', /json/)
                .end(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });
    }

    describe('/GET authorizations', () => {
        it('returns list of user\'s client authorizations', done => {
            const clientKey = 'get-authorizations-test-client';
            const clientName = 'Test client name for authorizations get';
            const clientDescription = 'Test client description for authorizations get';
            createTestClientAndToken({clientKey, clientName, clientDescription})
                .then(getAuthorizationsFromServer)
                .then(result => {
                    const items = result.items;
                    expect(items).to.have.length(1);

                    const item0 = items[0];
                    expect(item0.clientName).to.equal(clientName);
                    expect(item0.clientDescription).to.equal(clientDescription);
                })
                .then(done);
        });
    });

    describe('/DELETE authorizations', () => {
        it('deletes specified authorization', done => {
            const clientKey = 'delete-authorization-test-client';
            const clientName = 'Test client name for authorizations delete';
            const clientDescription = 'Test client description for authorizations delete';
            createTestClientAndToken({clientKey, clientName, clientDescription})
                .then(() => deleteAuthorizationFromServer(clientKey))
                .then(getAuthorizationsFromServer)
                .then(result => {
                    expect(result.items).to.have.length(0);
                })
                .then(done);
        });
    });
});