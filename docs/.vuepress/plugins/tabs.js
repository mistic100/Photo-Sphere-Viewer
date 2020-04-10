const container = require('markdown-it-container');

module.exports = () => {
  return {
    enhanceAppFiles: [
      {
        name   : 'register-vue-tabs-component',
        content: 'import { MdTabs } from "vue-material/dist/components";export default ({ Vue }) => Vue.use(MdTabs);',
      },
    ],
    extendMarkdown : md => {
      tabs(md);
      tab(md);
    },
  };
};

function tabs(md) {
  md.use(container, 'tabs', {
    render: (tokens, idx) => {
      const token = tokens[idx];
      if (token.nesting === 1) {
        return `<md-tabs>\n`;
      }
      else {
        return `</md-tabs>\n`;
      }
    },
  });
}

function tab(md) {
  md.use(container, 'tab', {
    render: (tokens, idx) => {
      const token = tokens[idx];

      if (token.nesting === 1) {
        const attributes = tabAttributes(token.info);
        return `<md-tab ${attributes}>\n`;
      }
      else {
        return `</md-tab>\n`;
      }
    },
  });
}

function tabAttributes(val) {
  return val
  // sanitize input
    .trim()
    .slice('tab'.length)
    .trim()
    // parse into array
    .split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g)
    // normalize name attribute
    .map(attr => {
      if (!attr.includes('=')) {
        if (!attr.startsWith('"')) {
          attr = `"${attr}`;
        }

        if (!attr.endsWith('"')) {
          attr = `${attr}"`;
        }

        return `md-label=${attr}`;
      }

      return attr;
    })
    .join(' ');
}
