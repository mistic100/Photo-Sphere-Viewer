import { BUTTON_DATA } from '../js/data/constants';
import { dasherize } from '../js/utils';

const HTML_BUTTON_DATA = 'data-' + dasherize(BUTTON_DATA);

/**
 * @summary Menu template
 * @param {AbstractButton[]} buttons
 * @param {PhotoSphereViewer} psv
 * @returns {string}
 */
export default (buttons, psv) => `
<div class="psv-markers-list-container">
  <h1 class="psv-markers-list-title">${psv.config.lang.menu}</h1>
  <ul class="psv-markers-list">
    ${buttons.map(button => `
    <li ${HTML_BUTTON_DATA}="${button.prop.id}" class="psv-markers-list-item">
      <span class="psv-markers-list-image">${button.container.innerHTML}</span>
      <p class="psv-markers-list-name">${button.container.title}</p>
    </li>
    `).join('')}
  </ul>
</div>
`;
