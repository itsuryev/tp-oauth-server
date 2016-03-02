import * as url from 'url';
import * as querystring from 'querystring';
import {nconf} from '../configuration';
import {logger} from '../logging';

export enum AccountResolver {
    Unknown,
    LocalHost,
    TpMinskBy,
    TpOndemandCom,
    TpOndemandNet
}

export interface AccountConfiguration {
    resolver: AccountResolver;
    targetprocessAuthorizationProxyPath: string;
    useRequestHostNameForTpLoginReturnUrl: boolean;
}

export function getAccountResolver(accountResolverType: string): AccountResolver {
    switch (accountResolverType) {
        case 'localhost': return AccountResolver.LocalHost;
        case 'tpminsk.by': return AccountResolver.TpMinskBy;
        case 'tpondemand.com': return AccountResolver.TpOndemandCom;
        case 'tpondemand.net': return AccountResolver.TpOndemandNet;
        default: return AccountResolver.Unknown;
    }
}

export function getAccountResolverFromConfig(): AccountResolver {
    return getAccountResolver(nconf.get('accountResolver'));
}

export function getAccountConfigurationFromConfig(): AccountConfiguration {
    return {
        resolver: getAccountResolverFromConfig(),
        targetprocessAuthorizationProxyPath: nconf.get('targetprocessAuthorizationProxyPath'),
        useRequestHostNameForTpLoginReturnUrl: nconf.get('useRequestHostNameForTpLoginReturnUrl')
    };
}

export function buildAccountUrl(resolver: AccountResolver, accountName: string): string {
    function buildOnDemandUrl(postfix) {
        // TODO: HTTPS support
        return `http://${accountName}.${postfix}`;
    }

    switch (resolver) {
        case AccountResolver.LocalHost:
            return 'http://localhost/targetprocess';
        case AccountResolver.TpMinskBy:
            return buildOnDemandUrl('tpminsk.by');
        case AccountResolver.TpOndemandCom:
            return buildOnDemandUrl('tpondemand.com');
        case AccountResolver.TpOndemandNet:
            return buildOnDemandUrl('tpondemand.net');
        default:
            logger.error('Unknown accountResolver', {resolver});
            throw new Error('Unknown accountResolver');
    }
}

export function buildTargetprocessAuthReturnUrl(config: AccountConfiguration, accountName: string, currentRequestUrl: string): string {
    if (config.useRequestHostNameForTpLoginReturnUrl) {
        return currentRequestUrl;
    }

    const urlObj = url.parse(currentRequestUrl, true);

    const accountUrl = buildAccountUrl(config.resolver, accountName);
    return accountUrl + config.targetprocessAuthorizationProxyPath + urlObj.search;
}
