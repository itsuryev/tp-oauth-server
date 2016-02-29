/// <reference path="../../typings/main.d.ts" />

import _ = require('lodash');
import request = require('supertest');
import testServerFactory from '../testServerFactory';

import TokenStorage from '../../server/oauth/tokenStorage';
import {ClientStorage} from '../../server/oauth/clientStorage';
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

    describe('/GET status', () => {
        it('return status', done => {
            request(server)
                .get('/tp_oauth/testAccountName/status')
                .expect('Content-Type', /json/)
                .expect(res => {
                    const resJson = JSON.parse(res.text);
                    expect(resJson.redis).to.equal('OK');
                    expect(resJson.pg).to.equal('OK');
                    expect(resJson.accountName).to.equal('testAccountName');
                    expect(resJson.userInfo).to.equal(null);
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

    describe('/GET authorizations', () => {
        it('returns list of user\'s client authorizations', done => {
            const clientKey = 'get-authorizations-test-client';
            const clientName = 'Test client name for authorizations get';
            const clientDescription = 'Test client description for authorizations get';
            const userId = 9045;
            const accountName = 'testAccountName';
            pgAsync
                .doWithPgClient(client => {
                    return client.queryAsync(
                        'INSERT INTO clients (client_key, name, client_secret, redirect_uri, description) VALUES ($1, $2, $3, $4, $5)',
                        [clientKey, clientName, clientDescription, 'http://example.com', clientKey]);
                })
                .then(() => {
                    return TokenStorage.saveAccessToken(clientKey + '-token1', clientKey, null, {
                        id: userId,
                        accountName
                    });
                })
                .then(() => {
                    request(server)
                        .get('/tp_oauth/testAccountName/authorizations')
                        .expect('Content-Type', /json/)
                        .expect(res => {
                            const resJson = JSON.parse(res.text);
                            const items = resJson.items;
                            expect(items).to.have.length(1);

                            const item0 = items[0];
                            expect(item0.clientName).to.equal(clientName);
                            expect(item0.clientDescription).to.equal(clientDescription);
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
    });
});