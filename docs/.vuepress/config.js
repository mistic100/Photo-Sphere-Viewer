const path = require('path');

module.exports = {
  dest       : './public',
  title      : 'Photo Sphere Viewer',
  description: 'A JavaScript library to display Photo Sphere panoramas',
  head       : [
    ['link', { rel: 'icon', href: '/favicon.png' }],
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
              collapsable: false,
              children   : [
                'adapters/equirectangular',
                'adapters/equirectangular-tiles',
                ['adapters/equirectangular-video', 'Equirectangular videos (NEW)'],
                'adapters/cubemap',
                'adapters/cubemap-tiles',
                ['adapters/cubemap-video', 'Cubemap videos (NEW)'],
              ],
            },
            {
              title      : 'Reusable components',
              path       : '/guide/components/',
              collapsable: false,
              children   : [
                'components/panel',
                'components/notification',
                'components/overlay',
                'components/tooltip',
              ],
            },
          ],
        },
      ],
      '/plugins/': [
        {
          title       : 'Plugins',
          sidebarDepth: 3,
          collapsable : false,
          children    : [
            '',
            'writing-a-plugin',
          ],
        },
        {
          title       : 'Official plugins',
          sidebarDepth: 3,
          collapsable : false,
          children    : [
            'plugin-autorotate-keypoints',
            'plugin-compass',
            ['plugin-gallery', 'GalleryPlugin (NEW)'],
            'plugin-gyroscope',
            'plugin-markers',
            'plugin-resolution',
            'plugin-settings',
            'plugin-stereo',
            ['plugin-video', 'VideoPlugin (NEW)'],
            'plugin-virtual-tour',
            'plugin-visible-range',
          ],
        },
      ],
      '/demos/'  : [
        {
          title       : 'Demos',
          sidebarDepth: 3,
          collapsable : false,
          children    : [
            '',
            'intro',
          ],
        },
      ],
    },
  },
  plugins    : [
    ['@vuepress/google-analytics', {
      'ga': 'UA-28192323-3',
    }],
    ['@vuepress/back-to-top'],
  ],
  alias      : {
    'photo-sphere-viewer'                   : path.resolve(process.cwd(), 'dist/photo-sphere-viewer.js'),
    'photo-sphere-viewer-markers'           : path.resolve(process.cwd(), 'dist/plugins/markers.js'),
    'photo-sphere-viewer-stylesheet'        : path.resolve(process.cwd(), 'dist/photo-sphere-viewer.css'),
    'photo-sphere-viewer-markers-stylesheet': path.resolve(process.cwd(), 'dist/plugins/markers.css'),
  },
};
