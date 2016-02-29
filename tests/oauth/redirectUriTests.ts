/// <reference path="../../typings/main.d.ts" />
import _ = require('lodash');

import chai = require('chai');
const expect = chai.expect;

import {RedirectUri} from '../../server/oauth/models';
import ClientUtils from '../../server/oauth/clientUtils';

function expectNull(value) {
    // noinspection BadExpressionStatementJS
    expect(value).to.be.null;
}

function expectNotNull(value) {
    // noinspection BadExpressionStatementJS
    expect(value).to.be.not.null;
}

describe('Redirect URI', () => {
    describe('Construction', () => {
        const allowed = {
            'regular URL': 'http://example.com',
            'with path': 'http://example.com/callback',
            'with port': 'http://example.com:1234',
            'with port and path': 'http://example.com:1234/callback'
        };

        const notAllowed = {
            'null': null,
            'empty': '',
            'with query string': 'http://example.com?param=value',
            'with authorization': 'http://user:password@example.com',
            'with custom protocol': 'custom://example.com'
        };

        _.each(allowed, (value, testName) => {
            it('should allow to construct ' + testName, () => {
                expectNull(RedirectUri.validateUriPath(value));
            });
        });

        _.each(notAllowed, (value, testName) => {
            it('should not allow to construct ' + testName, () => {
                expectNotNull(RedirectUri.validateUriPath(value));
            });
        });
    });

    describe('Determine final redirect URI', () => {

        function shouldAllow(stored, requested) {
            const storedUri = new RedirectUri(stored);
            const requestedUri = new RedirectUri(requested);
            const result = ClientUtils.tryGetFinalRedirectUri(storedUri, requestedUri);
            console.log(result.error);
            expectNull(result.error);
            expect(result.value.getPath()).to.be.equal(requested);
        }

        function shouldNotAllow(stored, requested) {
            const storedUri = new RedirectUri(stored);
            const requestedUri = new RedirectUri(requested);
            const result = ClientUtils.tryGetFinalRedirectUri(storedUri, requestedUri);
            console.log(result.error);
            expectNotNull(result.error);
        }

        function pair(stored: string, requested: string, output = null) {
            return {
                stored,
                requested,
                output: output || requested
            };
        }

        const allowed = {
            'matching redirect uri':
                pair('http://example.com', 'http://example.com'),
            'matching redirect URI when redirect has trailing slash':
                pair('http://example.com', 'http://example.com/'),
            'matching redirect URI when stored has trailing slash':
                pair('http://example.com/', 'http://example.com'),
            'stored and requested with same port':
                pair('http://example.com:1234', 'http://example.com:1234'),
            'more specific redirect URIs when base has only host':
                pair('http://example.com', 'http://example.com/subpath'),
            'more specific redirect URIs when base has host and path':
                pair('http://example.com/path1', 'http://example.com/path1/path2')
        };

        const notAllowed = {
            'matching URIs with different protocols':
                pair('https://example.com', 'http://example.com'),
            'URI from another host':
                pair('http://example.com', 'http://another.com'),
            'more specific URI from same host but another subdomain':
                pair('http://example.com', 'http://specific.example.com/subpath')
        };


        _.each(allowed, (pair, testName) => {
            it('should support ' + testName, () => {
                const baseUri = new RedirectUri(pair.stored);
                const specificUri = new RedirectUri(pair.requested);
                const result = ClientUtils.tryGetFinalRedirectUri(baseUri, specificUri);
                expectNull(result.error);
                expect(result.value.getPath()).to.be.equal(pair.output);
            });
        });

        _.each(notAllowed, (pair, testName) => {
            it('should not support ' + testName, () => {
                const baseUri = new RedirectUri(pair.stored);
                const specificUri = new RedirectUri(pair.requested);
                const result = ClientUtils.tryGetFinalRedirectUri(baseUri, specificUri);
                expectNotNull(result.error);
            });
        });
    });
});