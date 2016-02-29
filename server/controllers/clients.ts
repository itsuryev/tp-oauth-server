import {nconf} from '../configuration';
import {Express, Request} from 'express';
import {ClientQuerySpec, ClientStorage} from '../oauth/clientStorage';
import {logger} from '../logging';

export default function init(app: Express) {
    const URL_PREFIX = nconf.get('urlPrefix');

    app.get(URL_PREFIX + '/api/clients', (req, res) => {
        ClientStorage
            .getClients({
                skip: req.query.skip,
                take: req.query.take,
                includeSecrets: false
            })
            .then(clients => {
                logger.debug('Got clients info', clients);
                res.json({items: clients});
            })
            .catch(err => res.status(500).json(err));
    });
}