import _ = require('lodash');

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

        return null;
    }
}

export interface ClientInfo {
    id: number;
    clientId: string;
    name: string;
    description: string;
    clientSecret: string;
    redirectUri: RedirectUri;
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

export interface AuthorizationRequest {
    clientInfo: ClientInfo;
    redirectUri: RedirectUri;
    user: TokenUserInfo;
}
