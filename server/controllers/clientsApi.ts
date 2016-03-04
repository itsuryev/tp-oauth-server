import {Application, Request, Response} from 'express';
import {ClientStorage} from '../oauth/clientStorage';
import {logger} from '../logging';
import {wrap} from './shared';

export default function init(app: Application) {
    app.get('/api/clients', wrap(async (req: Request, res: Response) => {
        const clients = await ClientStorage.getClients({
            skip: req.query.skip,
            take: req.query.take,
            includeSecrets: false
        });

        logger.debug('Got clients info', clients);
        res.json({items: clients});
    }));
}