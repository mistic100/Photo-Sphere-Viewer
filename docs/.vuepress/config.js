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
    // algolia: {
    //   apiKey: '<API_KEY>',
    //   indexName: '<INDEX_NAME>'
    // },
    nav         : [
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugins', link: '/plugins/' },
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
            'markers',
            'cubemap',
            'cropped-panorama',
            'migration-v3',
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
            'plugin-gyroscope',
            'plugin-markers',
            'plugin-stereo',
            'plugin-visible-range',
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
    ['vuepress-plugin-element-tabs'],
    [require('./plugins/version')],
  ],
  alias      : {
    'photo-sphere-viewer'           : path.resolve(process.cwd(), 'dist/photo-sphere-viewer.js'),
    'photo-sphere-viewer-stylesheet': path.resolve(process.cwd(), 'dist/photo-sphere-viewer.css'),
  },
  chainWebpack(config) {
    config.module
      .rule('svg')
      .exclude.add(path.resolve(process.cwd(), 'src')).end();

    config.module
      .rule('rawsvg')
      .test(/\.svg(\?.*)?$/)
      .include.add(path.resolve(process.cwd(), 'src')).end()
      .use('raw-loader')
      .loader('raw-loader');
  },
};
