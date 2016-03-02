import * as url from 'url';
import * as querystring from 'querystring';
import {Request} from 'express';

export function getRequestUrl(req: Request) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.path,
        search: querystring.stringify(req.query)
    });
}
