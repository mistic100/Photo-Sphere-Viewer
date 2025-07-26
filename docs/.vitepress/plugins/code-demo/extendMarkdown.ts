import type MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
import { parse as parseYaml } from 'yaml';
import fs from 'node:fs';

const BLOCK_NAME = 'code-demo';

export default function extendMarkdown(md: MarkdownIt) {
    md.use(container, BLOCK_NAME, {
        render: (tokens, idx) => {
            const { nesting } = tokens[idx];

            if (nesting === 1) {
                const config = {
                    autoload: false,
                    hideHeader: false,
                    title: '',
                    version: '',
                    html: '',
                    js: '',
                    css: '',
                    packages: [],
                };

                for (let index = idx; index < tokens.length; index++) {
                    const { type, content, info, src } = tokens[index];
                    if (type === `container_${BLOCK_NAME}_close`) {
                        break;
                    }
                    if (type === 'fence') {
                        const lang = info.split(/[{[:]/)[0].trim();
                        if (lang === 'yaml' || lang === 'yml') {
                            Object.assign(config, parseYaml(content));
                        } else if (src) {
                            config[lang] += fs.readFileSync(src[0], 'utf-8');
                        } else {
                            config[lang] += content;
                        }
                    }
                }

                return `<ClientOnly>
                    <CodeDemo
                        autoload="${config.autoload}"
                        title="${config.title}"
                        version="${config.version}"
                        hideHeader="${config.hideHeader}"
                        rawHtml="${encodeURIComponent(config.html)}"
                        rawJs="${encodeURIComponent(config.js)}"
                        rawCss="${encodeURIComponent(config.css)}"
                        rawPackages="${encodeURIComponent(JSON.stringify(config.packages))}"
                        >
                        <template #demo>\n`;
            } else {
                return `</template></CodeDemo></ClientOnly>\n`;
            }
        },
    });
}
