const path = require('path');
const fs = require('fs');

function posixJoin(...args) {
  return path.join(...args).split(path.sep).join(path.posix.sep); // Windows compat...
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
  const abolsuteDir = posixJoin(process.cwd(), dir);
  return listFiles(abolsuteDir).map(f => f.substr(abolsuteDir.length + 1))
}


module.exports = {
  dest       : './public',
  title      : 'Photo Sphere Viewer',
  description: 'A JavaScript library to display Photo Sphere panoramas',
  head       : [
    ['link', { rel: 'icon', href: '/favicon.png' }],
    ['script', { src: 'https://cdn.jsdelivr.net/npm/uevent@2/browser.js', defer: 'defer' }],
    ['script', { src: 'https://cdn.jsdelivr.net/npm/three/build/three.min.js', defer: 'defer' }],
    ['script', { src  : 'https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/photo-sphere-viewer.js', defer: 'defer' }],
    ['link', { rel : 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/photo-sphere-viewer.css' }],
  ],
  themeConfig: {
    logo        : '/favicon.png',
    repo        : 'mistic100/Photo-Sphere-Viewer',
    docsDir     : 'docs',
    docsBranch  : 'dev',
    editLinks   : true,
    smoothScroll: true,
    sidebarDepth: 3,
    algolia     : {
      appId    : '5AVMW192FM',
      apiKey   : 'd443b6c08ed5353575f503b7a57f5bbf',
      indexName: 'photo-sphere-viewer',
    },
    nav         : [
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Playground', link: '/playground' },
      { text: 'Demos', link: '/demos/' },
      { text: 'API', link: 'https://photo-sphere-viewer.js.org/api/' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar     : {
      '/guide/'  : [
        {
          title       : 'Guide',
          sidebarDepth: 3,
          collapsable : false,
          children    : [
            '',
            'config',
            'methods',
            'events',
            'navbar',
            'style',
            {
              title      : 'Adapters',
              path       : '/guide/adapters/',
              collapsable: true,
              children   : [
                'adapters/equirectangular',
                'adapters/equirectangular-tiles',
                'adapters/equirectangular-video',
                'adapters/cubemap',
                'adapters/cubemap-tiles',
                'adapters/cubemap-video',
                'adapters/little-planet',
              ],
            },
            {
              title      : 'Reusable components',
              path       : '/guide/components/',
              collapsable: true,
              children   : [
                'components/panel',
                'components/notification',
                'components/overlay',
                'components/tooltip',
              ],
            },
            'frameworks',
          ],
        },
      ],
      '/plugins/': [
        {
          title       : 'Plugins',
          collapsable : false,
          children    : [
            '',
            'writing-a-plugin',
          ],
        },
        {
          title       : 'Official plugins',
          collapsable : false,
          children    : getFiles('docs/plugins')
            .filter(f => f.indexOf('plugin-') === 0),
        },
      ],
      '/demos/': [
        {
          title       : 'Demos',
          path        : '/demos/',
          sidebarDepth: 0,
          collapsable : false,
          children    : (() => {
            const demoFiles = getFiles('docs/demos')
              .map(f => f.split('/'))
              .filter(f => f.length === 2)
              .reduce((groups, [dir, file]) => {
                (groups[dir] = groups[dir] ?? []).push(file);
                return groups;
              }, {});

            return Object.entries(demoFiles)
              .map(([group, files]) => ({
                title      : group[0].toUpperCase() + group.substr(1),
                collapsable: false,
                children   : files.map(f => `${group}/${f}`),
              }));
          })(),
        },
      ],
    },
  },
  plugins    : [
    ['@vuepress/google-analytics', {
      'ga': 'UA-28192323-3',
    }],
    ['@vuepress/back-to-top'],
    require('./plugins/gallery'),
    require('./plugins/code-demo'),
    require('./plugins/tabs'),
  ],
};
