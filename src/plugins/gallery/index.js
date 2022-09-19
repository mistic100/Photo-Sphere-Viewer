import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from '../..';
import { EVENTS } from './constants';
import { GalleryButton } from './GalleryButton';
import { GalleryComponent } from './GalleryComponent';
import './style.scss';

/**
 * @typedef {Object} PSV.plugins.GalleryPlugin.Item
 * @property {number|string} id - Unique identifier of the item
 * @property {*} panorama
 * @property {string} [thumbnail] - URL of the thumbnail
 * @property {string} [name] - Text visible over the thumbnail
 * @property {PSV.PanoramaOptions} [options] - Any option supported by the `setPanorama()` method
 */

/**
 * @typedef {Object} PSV.plugins.GalleryPlugin.Options
 * @property {PSV.plugins.GalleryPlugin.Item[]} [items]
 * @property {boolean} [visibleOnLoad=false] - Displays the gallery when loading the first panorama
 * @property {boolean} [hideOnClick=true] - Hides the gallery when the user clicks on an item
 * @property {PSV.Size} [thumbnailSize] - Size of thumbnails, default (200x100) is set with CSS
 */


// add gallery button
DEFAULTS.lang[GalleryButton.id] = 'Gallery';
registerButton(GalleryButton, 'caption:left');


export { EVENTS } from './constants';


/**
 * @summary Adds a gallery of multiple panoramas
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class GalleryPlugin extends AbstractPlugin {

  static id = 'gallery';

  static EVENTS = EVENTS;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.GalleryPlugin.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {PSV.plugins.GalleryPlugin.Options}
     * @private
     */
    this.config = {
      items        : null,
      visibleOnLoad: false,
      hideOnClick  : true,
      thumbnailSize: {
        width : 200,
        height: 100,
      },
      ...options,
    };

    /**
     * @type {Object}
     * @private
     */
    this.prop = {
      handler  : null,
      currentId: null,
    };

    /**
     * @type {GalleryComponent}
     * @private
     * @readonly
     */
    this.gallery = new GalleryComponent(this);

    /**
     * @type {PSV.plugins.GalleryPlugin.Item[]}
     * @private
     */
    this.items = [];
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.psv.on(CONSTANTS.EVENTS.PANORAMA_LOADED, this);

    if (this.config.visibleOnLoad) {
      this.psv.once(CONSTANTS.EVENTS.READY, () => {
        this.show();
      });
    }

    this.setItems(this.config.items);
    delete this.config.items;
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.PANORAMA_LOADED, this);

    this.gallery.destroy();

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case CONSTANTS.EVENTS.PANORAMA_LOADED:
        const item = this.items.find(i => utils.deepEqual(i.panorama, e.args[0].panorama));
        this.prop.currentId = item?.id;
        this.gallery.setActive(item?.id);
        break;
    }
    /* eslint-enable */
  }

  /**
   * @summary Shows the gallery
   * @fires PSV.plugins.GalleryPlugin.show-gallery
   */
  show() {
    this.trigger(EVENTS.SHOW_GALLERY);
    return this.gallery.show();
  }

  /**
   * @summary Hides the carousem
   * @fires PSV.plugins.GalleryPlugin.hide-gallery
   */
  hide() {
    this.trigger(EVENTS.HIDE_GALLERY);
    return this.gallery.hide();
  }

  /**
   * @summary Hides or shows the gallery
   */
  toggle() {
    return this.gallery.toggle();
  }

  /**
   * @summary Sets the list of items
   * @param {PSV.plugins.GalleryPlugin.Item[]} items
   * @param {function} [handler] function that will be called when an item is clicked instead of the default behavior
   */
  setItems(items, handler) {
    if (!items?.length) {
      items = [];
    }
    else {
      items.forEach((item, i) => {
        if (!item.id) {
          throw new PSVError(`Item ${i} has no "id".`);
        }
        if (!item.panorama) {
          throw new PSVError(`Item ${item.id} has no "panorama".`);
        }
      });
    }

    this.prop.handler = handler;
    this.items = items.map(item => ({
      ...item,
      id: `${item.id}`,
    }));

    this.gallery.setItems(items);
  }

  /**
   * @param {string} id
   * @package
   */
  __click(id) {
    if (id === this.prop.currentId) {
      return;
    }

    if (this.prop.handler) {
      this.prop.handler(id);
    }
    else {
      const item = this.items.find(i => i.id === id);
      this.psv.setPanorama(item.panorama, {
        caption: item.name,
        ...item.options,
      });
    }

    this.prop.currentId = id;
    this.gallery.setActive(id);

    if (this.config.hideOnClick) {
      this.hide();
    }
  }

}
