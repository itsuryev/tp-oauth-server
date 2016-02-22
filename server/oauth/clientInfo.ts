import RedirectUri from '../redirectUri';

export default class ClientInfo {
    constructor(
        public clientId: string,
        public name: string,
        public clientSecret: string,
        public redirectUri: RedirectUri) {
    }
}
