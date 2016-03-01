import {Express, Request, Response} from 'express';
import {ClientStorage} from '../oauth/clientStorage';
import {logger} from '../logging';
import {jsonError} from './shared';

export default function init(app: Express) {
    app.get('/api/clients', async (req: Request, res: Response) => {
        try {
            const clients = await ClientStorage.getClients({
                skip: req.query.skip,
                take: req.query.take,
                includeSecrets: false
            });

            logger.debug('Got clients info', clients);
            res.json({items: clients});
        } catch (err) {
            jsonError(res, err);
        }
    });
}