import markersList from '../../templates/markers-list';

/**
 * @summary Default templates
 * @type {Object<string, Function>}
 * @constant
 * @memberOf module:data/config
 */
const TEMPLATES = {
  markersList,
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
