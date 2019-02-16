import markersList from '../../templates/markers-list';
import menu from '../../templates/menu';

/**
 * @summary Default templates
 * @type {Object<string, Function>}
 * @constant
 * @memberOf module:data/config
 */
const TEMPLATES = {
  markersList,
  menu,
};

/**
 * @summary Crrate template functions from config
 * @param {Object<string, Function>} options
 * @returns {Object<string, Function>}
 * @memberOf module:data/config
 */
function getTemplates(options) {
  const templates = {};

  Object.keys(TEMPLATES).forEach((name) => {
    if (!options || !options[name]) {
      templates[name] = TEMPLATES[name];
    }
    else {
      templates[name] = options[name];
    }
  });

  return templates;
}

export { TEMPLATES, getTemplates };
