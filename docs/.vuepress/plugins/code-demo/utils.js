import { getParameters } from 'codesandbox-import-utils/lib/api/define';

const ORG = '@photo-sphere-viewer/';
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/';
const VERSION = '5';

function fullname(name) {
    return ORG + name;
}

function buildPath({ name, version, type }) {
    return CDN_BASE + name + '@' + version + '/' + (type === 'js' ? 'index.module.js' : 'index.css');
}

export function getFullPackages(version, packages) {
    const core = packages.find(({ name }) => name === 'core');

    return [
        {
            name: fullname('core'),
            version: version || VERSION,
            imports: 'Viewer' + (core ? `, ${core.imports}` : ''),
            style: true,
        },
        ...packages
            .filter(({ name }) => name !== 'core')
            .map((pkg) => ({
                ...pkg,
                name: fullname(pkg.name),
                version: version || VERSION,
            })),
    ];
}

function getFullJs({ js, packages }) {
    return `
${packages
    .filter(({ imports }) => imports)
    .map(({ name, imports }) => `import { ${imports} } from '${name}';`)
    .join('\n')}

${js}
`.trim();
}

function getFullCss({ css, packages, cdnImport }) {
    return `
${packages
    .filter(({ style }) => style)
    .map(({ name, version }) => {
        return `@import '${cdnImport ? buildPath({ name, version, type: 'css' }) : `../node_modules/${name}/index.css`}';`;
    })
    .join('\n')}

html, body, #viewer {
  margin: 0;
  width: 100vw;
  height: 100vh;
  font-family: sans-serif;
}

${css}
`.trim();
}

function getFullHtml({ html, packages, importMap }) {
    let fullHtml = `
<div id="viewer"></div>

${html}
`.trim();

    if (importMap) {
        fullHtml += `\n
<script type="importmap">
    {
        "imports": {
            "three": "${CDN_BASE}three/build/three.module.js",
            ${packages
                .filter(({ imports }) => imports)
                .map(({ name, version }) => `"${name}": "${buildPath({ name, version, type: 'js' })}"`)
                .join(',\n            ')}
        }
    }
</script>
`;
    }

    return fullHtml;
}

export function getIframeContent({ title, html, js, css, packages }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>

  <style>
    #loader {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: radial-gradient(#fff 0%, #fdfdfd 16%, #fbfbfb 33%, #f8f8f8 49%, #efefef 66%, #dfdfdf 82%, #bfbfbf 100%);
        color: #555;
        font-size: 2rem;
        font-weight: 600;
        text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        z-index: 9999;
    }
  </style>

  <style>
    ${getFullCss({ css, packages, cdnImport: true })}
  </style>
</head>

<body>
  <div id="loader">Loading...</div>
  ${getFullHtml({ html, packages, importMap: true })}

  <script type="module">
  document.querySelector('#loader').remove();
  ${getFullJs({ js, packages })}
  </script>
</body>
</html>`;
}

export function getJsFiddleValue({ title, js, css, html, packages }) {
    return {
        title: title,
        html: getFullHtml({ html, packages, importMap: true }),
        js: getFullJs({ js, packages }),
        css: getFullCss({ css, packages, cdnImport: true }),
    };
}

export function getCodePenValue({ title, js, css, html, packages }) {
    return JSON.stringify({
        title: title,
        html: getFullHtml({ html, packages, importMap: true }),
        js: getFullJs({ js, packages }),
        css: getFullCss({ css, packages, cdnImport: true }),
    });
}

export function getCodeSandboxValue({ title, js, css, html, packages }) {
    return getParameters({
        files: {
            'package.json': {
                content: {
                    description: title,
                    main: 'index.html',
                    scripts: {
                        start: 'parcel index.html --open',
                        build: 'parcel build index.html',
                    },
                    dependencies: packages.reduce((deps, { name, version }) => {
                        deps[name] = version;
                        return deps;
                    }, {}),
                    devDependencies: {
                        parcel: '^2.9.0',
                        typescript: '^5.2.0',
                    },
                },
            },
            'index.html': {
                isBinary: false,
                content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>
</head>

<body>
    ${getFullHtml({ html, packages, importMap: false })}

    <script src="src/index.ts"></script>
</body>
</html>`,
            },
            'src/index.ts': {
                isBinary: false,
                content: `import './styles.css';
${getFullJs({ js, packages })}`,
            },
            'src/styles.css': {
                isBinary: false,
                content: getFullCss({ css, packages, cdnImport: false }),
            },
        },
    });
}
