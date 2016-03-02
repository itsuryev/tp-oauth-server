/// <reference path="../../typings/main.d.ts" />

import * as _ from 'lodash';
import * as chai from 'chai';
import * as AccountInfo from '../../server/integration/accountInfo';

const {expect} = chai;

describe('integration/accountInfo', () => {
    describe('Targetprocess ReturnUrl building', () => {
        it('should build for proxied configuration', () => {
            const configuration = {
                resolver: AccountInfo.AccountResolver.TpOndemandCom,
                targetprocessAuthorizationProxyPath: '/oauth/authorize',
                useRequestHostNameForTpLoginReturnUrl: false
            };
            const testAccountName = _.uniqueId('testAccountName-');
            const currentRequestUrl = 'http://unused:1234/unusedAsWell?foo=1&bar=2';
            const returnUrl = AccountInfo.buildTargetprocessAuthReturnUrl(configuration, testAccountName, currentRequestUrl);
            expect(returnUrl).to.be.equal(`http://${testAccountName}.tpondemand.com/oauth/authorize?foo=1&bar=2`);
        });

        it('should build for non-proxied configuration', () => {
            const configuration = {
                resolver: AccountInfo.AccountResolver.TpOndemandCom,
                targetprocessAuthorizationProxyPath: '/oauth/authorize',
                useRequestHostNameForTpLoginReturnUrl: true
            };

            const testAccountName = _.uniqueId('testAccountName-');
            const currentRequestUrl = 'http://host:1234/path?foo=1&bar=2';
            const returnUrl = AccountInfo.buildTargetprocessAuthReturnUrl(configuration, testAccountName, currentRequestUrl);
            expect(returnUrl).to.be.equal(currentRequestUrl);
        });
    });
});