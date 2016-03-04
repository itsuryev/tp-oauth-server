import * as path from 'path';
import * as fs from 'fs';

const clientBundlesHash = fs.readFileSync(path.resolve(__dirname, '../../build/client-bundles-hash.txt'), 'utf8');

export function getAssetPath(assetPath: string): string {
    return path.join('static', assetPath) + '?h=' + clientBundlesHash;
}
