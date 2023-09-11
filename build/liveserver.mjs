import liveServer from 'alive-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const EXAMPLES_DIR = 'examples';
const PACKAGES_DIR = 'packages';
const DIST_DIR = 'dist';

const packages = fs.readdirSync(path.join(rootDir, PACKAGES_DIR)).filter((name) => name !== 'shared');

liveServer.start({
    open: true,
    root: path.join(rootDir, EXAMPLES_DIR),
    watch: [
        path.join(rootDir, EXAMPLES_DIR),
        ...packages.map((name) => path.join(rootDir, PACKAGES_DIR, name, DIST_DIR)),
    ],
    mount: [
        ['/node_modules', path.join(rootDir, 'node_modules')],
        ['/data', path.join(rootDir, '..', 'photo-sphere-viewer-data/assets')],
        ...packages.map((name) => [`/${DIST_DIR}/${name}`, path.join(rootDir, PACKAGES_DIR, name, DIST_DIR)]),
    ],
});
