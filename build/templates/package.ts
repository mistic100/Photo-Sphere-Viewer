import _ from 'lodash';

export const packageJson = (pkg: any) => {
    const content = {
        ...pkg,
        main: 'index.cjs',
        module: 'index.module.js',
        types: 'index.d.ts',
        exports: {
            '.': {
                import: {
                    types: './index.d.mts',
                    default: './index.module.js',
                },
                require: {
                    types: './index.d.ts',
                    default: './index.cjs',
                },
            },
        },
        license: 'MIT',
        repository: {
            type: 'git',
            url: 'git://github.com/mistic100/Photo-Sphere-Viewer.git',
        },
        bugs: {
            url: 'https://github.com/mistic100/Photo-Sphere-Viewer/issues',
        },
        author: {
            name: `Damien 'Mistic' Sorel`,
            email: 'contact@git.strangeplanet.fr',
            homepage: 'https://strangeplanet.fr',
        },
        funding: 'https://github.com/sponsors/mistic100',
        publishConfig: {
            registry: 'https://registry.npmjs.org',
            access: 'public',
            provenance: true,
        },
        keywords: ['photosphere', 'panorama', 'threejs', ...(pkg.keywords || [])],
        dependencies: _.pickBy(pkg.dependencies, (val, key) => !key.startsWith('@photo-sphere-viewer')),
        // "npm version" does not update inter-dependencies https://github.com/npm/cli/pull/7903
        peerDependencies: _.mapValues(_.pickBy(pkg.dependencies, (val, key) => key.startsWith('@photo-sphere-viewer')), () => pkg.version),
    };

    if (pkg.psv.style) {
        content.style = 'index.css';
        content.sass = 'styles/index.scss';
        content.exports['./index.css'] = './index.css';
        content.exports['./index.scss'] = './styles/index.scss';
    }

    if (pkg.name === '@photo-sphere-viewer/core') {
        content.contributors = [
            {
                name: 'Jérémy Heleine',
                homepage: 'http://jeremyheleine.me',
            },
        ];
    }

    if (!Object.entries(content.peerDependencies).length) {
        delete content.peerDependencies;
    }

    delete content.devDependencies;
    delete content.psv;
    delete content.scripts;

    return JSON.stringify(content, null, 2);
};
