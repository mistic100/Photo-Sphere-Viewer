import { AbstractComponent, SYSTEM, utils } from '../..';
import blankIcon from './blank.svg';
import { GALLERY_ITEM_DATA, GALLERY_ITEM_DATA_KEY, ITEMS_TEMPLATE } from './constants';

const ACTIVE_CLASS = 'psv-gallery-item--active';

/**
 * @private
 */
export class GalleryComponent extends AbstractComponent {

  constructor(plugin) {
    super(plugin.psv, 'psv-gallery psv--capture-event');

    /**
     * @type {SVGElement}
     * @private
     * @readonly
     */
    this.blankIcon = (() => {
      const temp = document.createElement('div');
      temp.innerHTML = blankIcon;
      return temp.firstChild;
    })();
    this.blankIcon.style.display = 'none';
    this.psv.container.appendChild(this.blankIcon);

    if ('IntersectionObserver' in window) {
      /**
       * @type {IntersectionObserver}
       * @private
       * @readonly
       */
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0) {
            entry.target.style.backgroundImage = `url(${entry.target.dataset.src})`;
            delete entry.target.dataset.src;
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        root: this.psv.container,
      });
    }

    /**
     * @type {PSV.plugins.GalleryPlugin}
     * @private
     * @readonly
     */
    this.plugin = plugin;

    /**
     * @type {Object}
     * @private
     */
    this.prop = {
      ...this.prop,
      mousedown : false,
      initMouseX: null,
      mouseX    : null,
    };

    this.container.addEventListener(SYSTEM.mouseWheelEvent, this);
    this.container.addEventListener('mousedown', this);
    this.container.addEventListener('mousemove', this);
    this.container.addEventListener('click', this);
    window.addEventListener('mouseup', this);

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    this.psv.container.removeChild(this.blankIcon);

    window.removeEventListener('mouseup', this);

    this.observer?.disconnect();

    delete this.plugin;
    delete this.blankIcon;
    delete this.observer;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case SYSTEM.mouseWheelEvent:
        const spinY = utils.normalizeWheel(e).spinY;
        this.container.scrollLeft += spinY * 50;
        e.preventDefault();
        break;

      case 'mousedown':
        this.prop.mousedown = true;
        this.prop.initMouseX = e.clientX;
        this.prop.mouseX = e.clientX;
        break;

      case 'mousemove':
        if (this.prop.mousedown) {
          const delta = this.prop.mouseX - e.clientX;
          this.container.scrollLeft += delta;
          this.prop.mouseX = e.clientX;
        }
        break;

      case 'mouseup':
        this.prop.mousedown = false;
        this.prop.mouseX = null;
        e.preventDefault();
        break;

      case 'click':
        // prevent click on drag
        if (Math.abs(this.prop.initMouseX - e.clientX) < 10) {
          const item = utils.getClosest(e.target, `[data-${GALLERY_ITEM_DATA_KEY}]`);
          if (item) {
            this.plugin.__click(item.dataset[GALLERY_ITEM_DATA]);
          }
        }
        break;
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  show() {
    this.container.classList.add('psv-gallery--open');
    this.prop.visible = true;
  }

  /**
   * @override
   */
  hide() {
    this.container.classList.remove('psv-gallery--open');
    this.prop.visible = false;
  }

  /**
   * @summary Sets the list of items
   * @param {PSV.plugins.GalleryPlugin.Item[]} items
   */
  setItems(items) {
    this.container.innerHTML = ITEMS_TEMPLATE(items, this.plugin.config.thumbnailSize);

    if (this.observer) {
      this.observer.disconnect();

      for (const child of this.container.querySelectorAll('[data-src]')) {
        this.observer.observe(child);
      }
    }
  }

  /**
   * @param {number | string} id
   */
  setActive(id) {
    const currentActive = this.container.querySelector('.' + ACTIVE_CLASS);
    currentActive?.classList.remove(ACTIVE_CLASS);

    if (id) {
      const nextActive = this.container.querySelector(`[data-${GALLERY_ITEM_DATA_KEY}="${id}"]`);
      nextActive?.classList.add(ACTIVE_CLASS);
    }
  }

}
