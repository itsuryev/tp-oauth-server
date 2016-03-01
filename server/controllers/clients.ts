import {Express} from 'express';
import {ClientStorage} from '../oauth/clientStorage';
import {logger} from '../logging';

export default function init(app: Express) {
    app.get('/api/clients', (req, res) => {
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