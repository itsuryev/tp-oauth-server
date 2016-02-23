export class RedirectUri {
    private _path: string;

    constructor(path: string) {
        // TODO: add uri validation
        this._path = path;
    }

    getPath() {
        return this._path;
    }

    toString(): string {
        return this._path;
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
