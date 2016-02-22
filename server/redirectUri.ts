export default class RedirectUri {
    private _path: string;

    constructor(path: string) {
        this._path = path;
    }

    getPath() {
        return this._path;
    }

    toString(): string {
        return this._path;
    }
}
