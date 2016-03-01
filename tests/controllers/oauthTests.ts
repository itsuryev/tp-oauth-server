/// <reference path="../../typings/main.d.ts" />

import request = require('supertest');
import testServerFactory from '../testServerFactory';

import TokenStorage from '../../server/oauth/tokenStorage';
import pgAsync from '../../server/storage/pgAsync';
import {nconf} from '../../server/configuration';

import chai = require('chai');
const expect = chai.expect;

describe('controllers/oauth', () => {
    var server;

    beforeEach(() => {
        server = testServerFactory();
    });

    afterEach(done => {
        server.close(done);
    });

    describe('GET /status', () => {
        it('return status', done => {
            request(server)
                .get('/tp_oauth/testAccountName/status')
                .expect('Content-Type', /json/)
                .expect(res => {
                    const resJson = JSON.parse(res.text);
                    expect(resJson.redis).to.equal('OK');
                    expect(resJson.pg).to.equal('OK');
                    expect(resJson.accountName).to.equal('testAccountName');

                    const userInfo = resJson.userInfo;
                    expect(userInfo.id).to.equal(nconf.get('devModeFakeUserIdToSkipAuthentication'));
                    expect(userInfo.accountName).to.equal('testAccountName');
                })
                .end(err => {
                    if (err) {
                        throw err;
                    }
                    else {
                        done();
                    }
                });
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

    describe('GET /authorizations', () => {
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

    describe('DELETE /authorizations', () => {
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