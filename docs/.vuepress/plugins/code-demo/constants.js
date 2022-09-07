import ICON_CODEPEN from '!raw-loader!./icons/codepen.svg';
// import ICON_CODESANDBOX from '!raw-loader!./icons/codesandbox.svg';
import ICON_JSFIDDLE from '!raw-loader!./icons/jsfiddle.svg';

export const SERVICES = [
  // https://blog.codepen.io/documentation/api/prefill
  'codepen',
  // https://docs.jsfiddle.net/api/display-a-fiddle-from-pos
  'jsfiddle',
  // https://codesandbox.io/docs/importing#define-api
  // 'codesandbox',
];

export const SERVICE_URL = {
  codepen    : 'https://codepen.io/pen/define',
  jsfiddle   : 'https://jsfiddle.net/api/post/library/pure',
  // codesandbox: 'https://codesandbox.io/api/v1/sandboxes/define',
};

export const SERVICE_NAME = {
  codepen    : 'Codepen',
  jsfiddle   : 'JSFiddle',
  // codesandbox: 'CodeSandbox',
};

export const SERVICE_ICON = {
  codepen    : ICON_CODEPEN,
  jsfiddle   : ICON_JSFIDDLE,
  // codesandbox: ICON_CODESANDBOX,
};
