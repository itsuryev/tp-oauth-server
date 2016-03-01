/// <reference path="../../typings/main.d.ts" />
import * as _ from 'lodash';
import * as chai from 'chai';
const expect = chai.expect;
import testServerFactory from '../testServerFactory';
import TokenStorage from '../../server/oauth/tokenStorage';
import {TokenInfo} from '../../server/oauth/models';
import {ClientStorage} from '../../server/oauth/clientStorage';

describe('oauth/tokens', () => {
    describe('save then get token', () => {
        var server;

        beforeEach(() => {
            server = testServerFactory();
        });

        afterEach(done => {
            server.close(done);
        });

        it('should work', done => {
            const user = {
                id: parseInt(_.uniqueId(), 10),
                accountName: 'test-oauth-tokens-accountName'
            };
            const testClient = {
                clientId: 'test-oauth-tokens-save-and-get-token',
                clientSecret: 'secret',
                name: 'test-oauth-tokens-save-and-get-token name',
                description: null,
                redirectUri: 'http://example.com'
            };
            const accessTokenValue = _.uniqueId('testAccessToken');
            ClientStorage
                .deleteAllClientsExtremelyUnsafePrepareToSuffer()
                .then(() => ClientStorage.createClient(testClient))
                .then(() => TokenStorage.saveAccessToken(accessTokenValue, testClient.clientId, null, user))
                .then(() => TokenStorage.getAccessToken(accessTokenValue))
                .then((retrievedAccessToken: TokenInfo) => {
                    expect(retrievedAccessToken).to.be.not.null;
                    expect(retrievedAccessToken.token).to.be.equal(accessTokenValue);
                    expect(retrievedAccessToken.user).to.be.eql(user);
                    expect(retrievedAccessToken.expires).to.be.null;
                })
                .then(done);
        });
    });
});