const container = require('markdown-it-container');

module.exports = (options, ctx) => ({
  name          : 'tabs',
  extendMarkdown: (md) => {
    md.use(container, 'tabs', {
      render: (tokens, idx) => {
        const { nesting } = tokens[idx];

        if (nesting === 1) {
          return `<md-tabs md-elevation="1" class="md-primary">\n`;
        }
        else {
          return `</md-tabs>\n`;
        }
      },
    });

    md.use(container, 'tab', {
      render: (tokens, idx) => {
        const { nesting, info } = tokens[idx];
        const title = info.trim().slice('tab '.length);

        if (nesting === 1) {
          return `<md-tab md-label="${title}">\n`;
        }
        else {
          return `</md-tab>\n`;
        }
      },
    });
  }
});
