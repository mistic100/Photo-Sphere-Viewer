const container = require('markdown-it-container');
const path = require('path');
const { parse: parseYaml } = require('yaml');

const BLOCK_NAME = 'code-demo';

module.exports = (options, ctx) => ({
  name           : 'code-demo',
  enhanceAppFiles: path.resolve(__dirname, './enhanceApp.js'),
  extendMarkdown : (md) => {
    md.use(container, BLOCK_NAME, {
      render: (tokens, idx) => {
        const { nesting } = tokens[idx];

        if (nesting === 1) {
          const config = {
            title: '',
            html: '',
            js  : '',
            css : '',
            resources: [],
          };
          for (let index = idx; index < tokens.length; index++) {
            const { type, content, info: info } = tokens[index];
            if (type === `container_${BLOCK_NAME}_close`) {
              break;
            }
            if (type === 'fence') {
              if (info === 'yaml' || info === 'yml') {
                const { title, resources } = parseYaml(content);
                config.title = title;
                config.resources = resources || [];
              } else {
                config[info] = content;
              }
            }
          }

          return `<CodeDemo title="${config.title}"
                            rawHtml="${encodeURIComponent(config.html)}"
                            rawJs="${encodeURIComponent(config.js)}"
                            rawCss="${encodeURIComponent(config.css)}"
                            rawRes="${encodeURIComponent(JSON.stringify(config.resources))}"
                            ><template #demo>\n`;
        }
        else {
          return `</template></CodeDemo>\n`;
        }
      },
    });
  }
});
