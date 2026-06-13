import { startCase, capitalize } from 'lodash-es';
import fs from 'node:fs';
import { resolve } from 'node:path';
import path from 'node:path';
import { defineConfig } from 'vitepress';

import codeDemo from './plugins/code-demo/extendMarkdown';
import dialog from './plugins/dialog/extendMarkdown';
import gallery from './plugins/gallery/extendMarkdown';
import module from './plugins/module/extendMarkdown';
import tabs from './plugins/tabs/extendMarkdown';

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
    return listFiles(absoluteDir).map(f => f.substr(absoluteDir.length + 1));
}

const externals = {
    'three': 'https://cdn.jsdelivr.net/npm/three/build/three.module.min.js',
    'marked': 'https://cdn.jsdelivr.net/npm/marked@14/lib/marked.esm.min.js',
    '@photo-sphere-viewer/core': 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/index.module.min.js',
    '@photo-sphere-viewer/equirectangular-tiles-adapter': 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/equirectangular-tiles-adapter@5/index.module.min.js',
};

const importmap = `<script type="importmap">${JSON.stringify({ imports: externals })}</script>`;

const adapters = [
    { text: 'Equirectangular', link: '/equirectangular' },
    { text: 'Equirectangular tiles', link: '/equirectangular-tiles' },
    { text: 'Equirectangular video', link: '/equirectangular-video' },
    { text: 'Cubemap', link: '/cubemap' },
    { text: 'Cubemap tiles', link: '/cubemap-tiles' },
    { text: 'Cubemap video', link: '/cubemap-video' },
    { text: 'Dual fisheye', link: '/dual-fisheye' },
];

export default defineConfig({
    outDir: '../public',
    title: 'Photo Sphere Viewer',
    description: 'A JavaScript library to display 360° panoramas',

    head: [
        ['link', { rel: 'icon', href: '/favicon.png' }],
        ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/index.min.css' }],
        ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@mdi/font@7/css/materialdesignicons.min.css' }],
    ],

    themeConfig: {
        logo: '/favicon.png',
        aside: true,
        outline: 'deep',
        externalLinkIcon: true,
        editLink: {
            pattern: 'https://github.com/mistic100/Photo-Sphere-Viewer/edit/main/docs/:path',
        },
        footer: {
            copyright: 'Licensed under MIT License, documentation under CC BY 3.0',
        },
        search: {
            provider: 'algolia',
            options: {
                appId: '5AVMW192FM',
                apiKey: 'd443b6c08ed5353575f503b7a57f5bbf',
                indexName: 'photo-sphere-viewer',
            },
        },

        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Plugins', link: '/plugins/' },
            { text: 'Playground', link: '/playground' },
            { text: 'Demos', link: '/demos/' },
            { text: 'Reference', link: '/api/', target: '_blank' },
            {
                text: 'v5',
                items: [
                    { text: 'v4', link: 'https://photo-sphere-viewer-4.netlify.app' },
                    { text: 'v3', link: 'https://photo-sphere-viewer-3.netlify.app' },
                ],
            },
            { text: '❤️️ Sponsor', link: 'https://github.com/sponsors/mistic100' },
        ],
        socialLinks: [
            { icon: 'cypress', link: 'https://psv-cypress-reports.netlify.app' },
            { icon: 'github', link: 'https://github.com/mistic100/Photo-Sphere-Viewer' },
        ],

        sidebar: {
            '/guide/': [
                {
                    text: 'Guide',
                    base: '/guide',
                    items: [
                        { text: 'Getting started', link: '/' },
                        { text: 'Configuration', link: '/config' },
                        { text: 'Methods', link: '/methods' },
                        { text: 'Events', link: '/events' },
                        { text: 'Navbar customization', link: '/navbar' },
                        { text: 'Style', link: '/style' },
                        {
                            text: 'Adapters',
                            link: '/',
                            base: '/guide/adapters',
                            collapsed: true,
                            items: adapters,
                        },
                        {
                            text: 'Reusable components',
                            link: '/',
                            base: '/guide/components',
                            collapsed: true,
                            items: [
                                { text: 'Panel', link: '/panel' },
                                { text: 'Notification', link: '/notification' },
                                { text: 'Overlay', link: '/overlay' },
                                { text: 'Tooltip', link: '/tooltip' },
                            ],
                        },
                        { text: 'Frameworks', link: '/frameworks' },
                    ],
                },
                { text: 'Changelog', link: '/guide/changelog' },
                { text: 'Development & Credits', link: '/guide/development' },
                { text: 'Migration from v4', link: '/guide/migration' },
            ],
            '/plugins/': [
                {
                    text: 'Plugins',
                    base: '/plugins',
                    items: [
                        { text: 'Introduction to plugins', link: '/' },
                        { text: 'Writing a plugin', link: '/writing-a-plugin' },
                        { text: 'Third party plugins', link: '/third-party' },
                    ],
                },
                {
                    text: 'Official plugins',
                    base: '/plugins',
                    items: getFiles('plugins')
                        .filter((f) => {
                            return f.endsWith('.md') && f !== 'index.md' && f !== 'writing-a-plugin.md' && f !== 'third-party.md';
                        })
                        .map(f => ({
                            text: startCase(f.replace('.md', '')),
                            link: '/' + f,
                        })),
                },
                {
                    text: 'Adapters',
                    base: '/guide/adapters',
                    items: adapters,
                },
            ],
            '/demos/': [
                {
                    text: 'Demos',
                    base: '/demos',
                    link: '/',
                    items: (() => {
                        const demoFiles: Record<string, string[]> = getFiles('demos')
                            .map(f => f.split('/'))
                            .filter(f => f.length === 2)
                            .reduce((groups, [dir, file]) => {
                                (groups[dir] = groups[dir] ?? []).push(file);
                                return groups;
                            }, {});

                        return Object.entries(demoFiles)
                            .map(([group, files]) => ({
                                text: capitalize(group),
                                items: files.map(f => ({
                                    text: startCase(f.replace('.md', '')).replace('0 Config', 'Zero config'),
                                    link: `/${group}/${f}`,
                                })),
                            }))
                            .sort((a, b) => {
                                return a.text === 'Basic'
                                    ? -1
                                    : b.text === 'Basic'
                                        ? 1
                                        : a.text.localeCompare(b.text);
                            });
                    })(),
                },
            ],
        },
    },

    markdown: {
        config(md) {
            codeDemo(md);
            dialog(md);
            gallery(md);
            module(md);
            tabs(md);
        },
    },

    vite: {
        ssr: {
            noExternal: [/^vuetify/],
        },

        build: {
            rollupOptions: {
                external: Object.keys(externals),
            },
        },

        resolve: {
            alias: {
                ...externals,
                '@components': resolve(import.meta.dirname, './components'),
            },
        },

        // for dev
        plugins: [
            {
                name: 'import-map',
                enforce: 'pre',
                transformIndexHtml(html) {
                    return html.replace('<head>', `<head>${importmap}`);
                },
            },
        ],
    },

    // for build
    transformHtml(html) {
        return html.replace('<head>', `<head>${importmap}`);
    },
});
