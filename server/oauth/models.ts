import * as _ from 'lodash';
import * as url from 'url';

export class RedirectUri {
    private _path: string;

    constructor(path: string) {
        const validationError = RedirectUri.validateUriPath(path);
        if (validationError) {
            throw validationError;
        }

        this._path = RedirectUri.safeTrim(path);
    }

    getPath() {
        return this._path;
    }

    toString(): string {
        return this._path;
    }

    static safeTrim(s: string): string {
        if (!s) {
            return null;
        }

        return _.trim(s);
    }

    static validateUriPath(s: string): Error {
        s = RedirectUri.safeTrim(s);

        if (!s || !s.length) {
            return new Error('Value should be a non-empty string');
        }

        const parsed = url.parse(s);
        if (parsed.query) {
            return new Error('Query string should be empty');
        }

        if (parsed.auth) {
            return new Error('Authorization part should not be specified');
        }

        const protocol = parsed.protocol;
        if (protocol !== 'http:' && protocol !== 'https:') {
            return new Error(`Only HTTP and HTTPS protocols are supported. Actual: ${protocol}.`);
        }

        return null;
    }
}

export interface ClientInfo {
    id: number;
    clientId: string;
    name: string;
    description: string;
    clientSecret: string;
    redirectUri: string;
}

export interface TokenUserInfo {
    id: number;
    accountName: string;
}

export interface TokenInfo {
    expires: Date;
    user: TokenUserInfo;
    token: string;
}

export interface TpUserInfo {
    id: number;
    firstName: string;
    lastName: string;
    accountName: string;
    accountUrl: string;
    cookie: string;
}

export interface AuthorizationRequest {
    clientInfo: ClientInfo;
    redirectUri: RedirectUri;
    user: TokenUserInfo;
}

export interface ClientAuthorizationInfo {
    clientId: string;
    clientName: string;
    clientDescription: string;
    issueDate: Date;
}