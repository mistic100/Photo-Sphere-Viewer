import markersList from '../../templates/markers-list';
import menu from '../../templates/menu';

/**
 * @summary Default templates
 * @type {Object<string, Function>}
 * @memberOf PSV
 * @constant
 */
export const TEMPLATES = {
  markersList,
  menu,
};

/**
 * @summary Crrate template functions from config
 * @param {Object<string, Function>} options
 * @returns {Object<string, Function>}
 * @memberOf PSV
 * @private
 */
export function getTemplates(options) {
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
