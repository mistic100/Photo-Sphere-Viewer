import liveServer from 'alive-server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import selfsigned from 'selfsigned';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const EXAMPLES_DIR = 'examples';
const PACKAGES_DIR = 'packages';
const DIST_DIR = 'dist';

const packages = fs.readdirSync(path.join(rootDir, PACKAGES_DIR)).filter((name) => name !== 'shared');
const fakeCert = getFakeCert();
const e2e = process.argv[2] === '--e2e';

let currentIp = '';
Object.values(os.networkInterfaces()).forEach((iFace) => {
    iFace.forEach((details) => {
        if (details.family === 'IPv4' && !details.internal && details.mac !== '00:00:00:00:00:00') {
            currentIp = details.address;
        }
    });
});

liveServer.start({
    root: path.join(rootDir, EXAMPLES_DIR),
    open: !e2e ? `/index.html#ip=${currentIp}` : null,
    watch: [
        path.join(rootDir, EXAMPLES_DIR),
        ...packages.map((name) => path.join(rootDir, PACKAGES_DIR, name, DIST_DIR)),
    ],
    mount: [
        ['/node_modules', path.join(rootDir, 'node_modules')],
        ['/data', path.join(rootDir, '..', 'photo-sphere-viewer-data/assets')],
        ...packages.map((name) => [`/${DIST_DIR}/${name}`, path.join(rootDir, PACKAGES_DIR, name, DIST_DIR)]),
    ],
    https: {
        cert: fakeCert,
        key: fakeCert,
    },
});

// from https://github.com/greggman/servez-lib/blob/master/lib/servez.js
function getFakeCert() {
    const pemFile = path.join(rootDir, '.tmp/fake-cert.pem');
    const keyFile = path.join(rootDir, '.tmp/fake-cert.key');
    if (fs.existsSync(pemFile) && fs.existsSync(keyFile)) {
        const stat = fs.statSync(pemFile);
        if (new Date() - stat.mtime < 28 * 24 * 60 * 60 * 1000) {
            return fs.readFileSync(keyFile, 'utf8') + fs.readFileSync(pemFile, 'utf8');
        }
    }

    const pems = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
        algorithm: 'sha256',
        days: 1,
        keySize: 2048,
        extensions: [
            // {
            //   name: 'basicConstraints',
            //   cA: true,
            // },
            {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true,
            },
            {
                name: 'extKeyUsage',
                serverAuth: true,
                clientAuth: true,
                codeSigning: true,
                timeStamping: true,
            },
            {
                name: 'subjectAltName',
                altNames: [
                    {
                        // type 2 is DNS
                        type: 2,
                        value: 'localhost',
                    },
                    {
                        type: 2,
                        value: 'localhost.localdomain',
                    },
                    {
                        type: 2,
                        value: '[::1]',
                    },
                    {
                        // type 7 is IP
                        type: 7,
                        ip: '127.0.0.1',
                    },
                    {
                        type: 7,
                        ip: 'fe80::1',
                    },
                ],
            },
        ],
    });

    fs.mkdirSync(path.dirname(pemFile), { recursive: true });
    fs.writeFileSync(pemFile, pems.cert);
    fs.writeFileSync(keyFile, pems.private);

    return pems.private + pems.cert;
}
