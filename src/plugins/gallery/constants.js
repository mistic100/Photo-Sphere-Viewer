import { utils } from '../..';

/**
 * @summary Available events
 * @enum {string}
 * @memberof PSV.plugins.GalleryPlugin
 * @constant
 */
export const EVENTS = {
  /**
   * @event show-gallery
   * @memberof PSV.plugins.GalleryPlugin
   * @summary Triggered when the gallery is shown
   */
  SHOW_GALLERY: 'show-gallery',
  /**
   * @event hide-gallery
   * @memberof PSV.plugins.GalleryPlugin
   * @summary Triggered when the gallery is hidden
   */
  HIDE_GALLERY: 'hide-gallery',
};

/**
 * @summary Property name added to gallery items
 * @type {string}
 * @constant
 * @private
 */
export const GALLERY_ITEM_DATA = 'psvGalleryItem';

/**
 * @summary Property name added to gallery items (dash-case)
 * @type {string}
 * @constant
 * @private
 */
export const GALLERY_ITEM_DATA_KEY = utils.dasherize(GALLERY_ITEM_DATA);

/**
 * @summary Gallery template
 * @param {PSV.plugins.GalleryPlugin.Item[]} items
 * @param {PSV.Size} size
 * @returns {string}
 * @constant
 * @private
 */
export const ITEMS_TEMPLATE = (items, size) => `
<div class="psv-gallery-container">
  ${items.map(item => `
  <div class="psv-gallery-item" data-${GALLERY_ITEM_DATA_KEY}="${item.id}" style="width:${size.width}px">
    <div class="psv-gallery-item-wrapper" style="padding-bottom:calc(100% * ${size.height} / ${size.width})">
      ${item.name ? `<div class="psv-gallery-item-title"><span>${item.name}</span></div>` : ''}
      <svg class="psv-gallery-item-thumb" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><use href="#psvGalleryBlankIcon"></use></svg>
      ${item.thumbnail ? `<div class="psv-gallery-item-thumb" data-src="${item.thumbnail}"></div>` : ''}
    </div>
  </div>
  `).join('')}
</div>
`;
