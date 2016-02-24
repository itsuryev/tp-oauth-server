import {URL_PREFIX} from '../configuration';
import {Express, Request} from 'express';
import {ClientQuerySpec, ClientStorage} from '../oauth/clientStorage';

export default function init(app: Express) {
    app.get(URL_PREFIX + '/api/clients', (req, res) => {
        ClientStorage
            .getClients({
                skip: req.query.skip,
                take: req.query.take,
                includeSecrets: false
            })
            .then(clients => {
                res.json({items: clients});
            })
            .catch(err => res.status(500).json(err));
    });
}