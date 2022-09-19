import { Size, PanoramaOptions, AbstractPlugin, Viewer } from 'photo-sphere-viewer';

type GalleryPluginOptions = {
  items?: GalleryPluginItem[];
  visibleOnLoad?: boolean;
  hideOnClick?: boolean;
  thumbnailSize?: Size;
};

type GalleryPluginItem = {
  id: number | string;
  panorama: any;
  thumbnail?: string;
  name?: string;
  options?: PanoramaOptions;
};

declare const EVENTS: {
  SHOW_GALLERY: 'show-gallery',
  HIDE_GALLERY: 'hide-gallery',
};

/**
 * @summary Adds a gallery of multiple panoramas
 */
declare class GalleryPlugin extends AbstractPlugin {

  static EVENTS: typeof EVENTS;

  constructor(psv: Viewer, options: GalleryPluginOptions);

  /**
   * @summary Hides the gallery
   */
  hide();

  /**
   * @summary Shows the gallery
   */
  show();

  /**
   * @summary Hides or shows the gallery
   */
  toggle();

  /**
   * @summary Sets the list of items
   */
  setItems(items?: GalleryPluginItem[]);

  /**
   * @summary Triggered when the gallery is shown
   */
  on(e: 'show-gallery'): this;

  /**
   * @summary Triggered when the gallery is hidden
   */
  on(e: 'hide-gallery'): this;

}

export { EVENTS, GalleryPlugin, GalleryPluginItem, GalleryPluginOptions };
