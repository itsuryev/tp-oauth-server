import RedirectUri from '../redirectUri';

interface ClientInfo {
    id: number
    clientId: string
    name: string
    description: string
    clientSecret: string
    redirectUri: RedirectUri
};


export default ClientInfo;
