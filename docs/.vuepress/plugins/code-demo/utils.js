// import { getParameters } from 'codesandbox/lib/api/define';

const BASE_URL = 'https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/';

export function getFullJs(js) {
  return js;
}

export function getFullCss(css) {
  return `
html, body, #viewer {
  margin: 0;
  width: 100vw;
  height: 100vh;
  font-family: sans-serif;
}

${css}
`;
}

export function getFullHtml(html) {
  return `
<div id="viewer"></div>

${html}
`;
}

export function getFullResources(resources) {
  return [
    { path: 'https://cdn.jsdelivr.net/npm/uevent@2/browser.js', type: 'js' },
    { path: 'https://cdn.jsdelivr.net/npm/three/build/three.min.js', type: 'js' },
    { path: BASE_URL + 'photo-sphere-viewer.js', type: 'js', imports: ['Viewer'] },
    { path: BASE_URL + 'photo-sphere-viewer.css', type: 'css' },
    ...resources.map(({ path, imports }) => ({
      path   : BASE_URL + path,
      imports: imports?.split(' '),
      type   : path.match(/\.js$/) ? 'js' : 'css',
    })),
  ];
}

export function getIframeContent({ title, html, js, css, resources }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>

${resources
  .map(({ path, type }) => {
    if (type === 'js') {
      return `<script src="${path}"><\/script>`;
    } else {
      return `<link rel="stylesheet" href="${path}">`;
    }
  })
  .join('\n')
}

  <style>
  ${css}
  </style>
</head>

<body>
${html}

<script>
${js}
</script>
</body>

</html>
`;
}

export function getJsFiddleResources(resources) {
  return resources.map(({ path }) => path);
}

export function getCodePenValue({ title, js, css, html, resources }) {
  return JSON.stringify({
    title       : title,
    js          : js,
    css         : css,
    html        : html,
    js_external : resources.filter(({ type }) => type === 'js').map(({ path }) => path),
    css_external: resources.filter(({ type }) => type === 'css').map(({ path }) => path),
  });
}

// FIXME : proper config
// export function getCodeSandboxValue({ title, js, css, html, resources }) {
//   return getParameters({
//     files: {
//       'index.html'  : {
//         isBinary: false,
//         content : getIframeContent({ title, js, css, html, resources }),
//       },
//       'package.json': {
//         content : {
//           "description": title,
//           "main": "index.html",
//           "scripts": {
//             "start": "parcel index.html --open",
//             "build": "parcel build index.html"
//           },
//           "devDependencies": {
//             "parcel-bundler": "^2.7"
//           }
//         },
//       },
//     },
//   });
// }
