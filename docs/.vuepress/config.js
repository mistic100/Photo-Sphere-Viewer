const path = require('path');
const fs = require('fs');

function posixJoin(...args) {
    return path
        .join(...args)
        .split(path.sep)
        .join(path.posix.sep); // Windows compat...
}

function listFiles(dir) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents.map((dirent) => {
        const res = posixJoin(dir, dirent.name);
        return dirent.isDirectory() ? listFiles(res) : res;
    });
    return files.flat();
}

function getFiles(dir) {
    const absoluteDir = posixJoin(__dirname, '..', dir);
    return listFiles(absoluteDir).map((f) => f.substr(absoluteDir.length + 1));
}

module.exports = {
    dest: '../public',
    title: 'Photo Sphere Viewer',
    description: 'A JavaScript library to display Photo Sphere panoramas',
    // prettier-ignore
    head: [
        ['link', { rel: 'icon', href: '/favicon.png' }],
        ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/index.css' }],
        ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/markers-plugin@5/index.css' }],
        ['script', { type: 'importmap' }, `
        {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three/build/three.module.js",
                "@photo-sphere-viewer/core": "https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/index.module.js",
                "@photo-sphere-viewer/markers-plugin": "https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/markers-plugin@5/index.module.js"
            }
        }
        `],
    ],
    themeConfig: {
        logo: '/favicon.png',
        repo: 'mistic100/Photo-Sphere-Viewer',
        docsDir: 'docs',
        docsBranch: 'main',
        editLinks: true,
        smoothScroll: true,
        sidebarDepth: 3,
        algolia: {
            appId: '5AVMW192FM',
            apiKey: 'd443b6c08ed5353575f503b7a57f5bbf',
            indexName: 'photo-sphere-viewer',
        },
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Plugins', link: '/plugins/' },
            { text: 'Playground', link: '/playground' },
            { text: 'Demos', link: '/demos/' },
            { text: 'API', link: '/api/', target: '_blank' },
            {
                text: 'v5',
                ariaLavel: 'version',
                items: [
                    { text: 'v4', link: 'https://photo-sphere-viewer-4.netlify.app' },
                    { text: 'v3', link: 'https://photo-sphere-viewer-3.netlify.app' },
                ],
            },
            { text: '❤️️ Sponsor', link: 'https://github.com/sponsors/mistic100' },
        ],
        sidebar: {
            '/guide/': [
                {
                    title: 'Guide',
                    sidebarDepth: 3,
                    collapsable: false,
                    children: [
                        '',
                        'config',
                        'methods',
                        'events',
                        'navbar',
                        'style',
                        {
                            title: 'Adapters',
                            path: '/guide/adapters/',
                            collapsable: true,
                            children: [
                                'adapters/equirectangular',
                                'adapters/equirectangular-tiles',
                                'adapters/equirectangular-video',
                                'adapters/cubemap',
                                'adapters/cubemap-tiles',
                                'adapters/cubemap-video',
                                'adapters/dual-fisheye',
                            ],
                        },
                        {
                            title: 'Reusable components',
                            path: '/guide/components/',
                            collapsable: true,
                            children: [
                                'components/panel',
                                'components/notification',
                                'components/overlay',
                                'components/tooltip',
                            ],
                        },
                        'frameworks',
                        'changelog',
                        'development',
                        'migration',
                    ],
                },
            ],
            '/plugins/': [
                {
                    title: 'Plugins',
                    collapsable: false,
                    children: ['', 'writing-a-plugin'],
                },
                {
                    title: 'Official plugins',
                    collapsable: false,
                    children: getFiles('plugins').filter((f) => {
                        return f !== 'README.md' && f !== 'writing-a-plugin.md' && f !== 'third-party.md';
                    }),
                },
                'third-party',
            ],
            '/demos/': [
                {
                    title: 'Demos',
                    path: '/demos/',
                    sidebarDepth: 0,
                    collapsable: false,
                    children: (() => {
                        const demoFiles = getFiles('demos')
                            .map((f) => f.split('/'))
                            .filter((f) => f.length === 2)
                            .reduce((groups, [dir, file]) => {
                                (groups[dir] = groups[dir] ?? []).push(file);
                                return groups;
                            }, {});

                        return Object.entries(demoFiles)
                            .map(([group, files]) => ({
                                title: group[0].toUpperCase() + group.substring(1),
                                collapsable: false,
                                children: files.map((f) => `${group}/${f}`),
                            }))
                            .sort((a, b) => {
                                return a.title === 'Basic'
                                    ? -1
                                    : b.title === 'Basic'
                                    ? 1
                                    : a.title.localeCompare(b.title);
                            });
                    })(),
                },
            ],
        },
    },
    plugins: [
        ['@vuepress/back-to-top'],
        require('./plugins/code-demo'),
        require('./plugins/dialog'),
        require('./plugins/gallery'),
        require('./plugins/module'),
        require('./plugins/tabs'),
    ],
};
