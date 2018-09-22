/**
 * @summary Markers list template
 * @param {PSVMarker[]} markers
 * @param {PhotoSphereViewer} psv
 * @returns {string}
 */
export default (markers, psv) => `
<div class="psv-markers-list-container">
  <h1 class="psv-markers-list-title">${psv.config.lang.markers}</h1>
  <ul class="psv-markers-list">
    ${markers.map(marker => `
    <li data-psv-marker="${marker.config.id}" class="psv-markers-list-item ${marker.config.className || ''}">
      ${marker.type === 'image' ? `<img class="psv-markers-list-image" src="${marker.config.image}"/>` : ''}
      <p class="psv-markers-list-name">${marker.getListContent()}</p>
    </li>
    `).join('')}
  </ul>
</div>
`;
