import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, events, PSVError, utils } from '@photo-sphere-viewer/core';
import { GalleryPluginEvents, HideGalleryEvent, ShowGalleryEvent } from './events';
import { GalleryButton } from './GalleryButton';
import { GalleryComponent } from './GalleryComponent';
import { GalleryItem, GalleryPluginConfig, UpdatableGalleryPluginConfig } from './model';

const getConfig = utils.getConfigParser<GalleryPluginConfig>({
    items: [],
    visibleOnLoad: false,
    hideOnClick: true,
    thumbnailSize: {
        width: 200,
        height: 100,
    },
});

/**
 * Adds a gallery of multiple panoramas
 */
export class GalleryPlugin extends AbstractConfigurablePlugin<
    GalleryPluginConfig,
    GalleryPluginConfig,
    UpdatableGalleryPluginConfig,
    GalleryPluginEvents
> {
    static override readonly id = 'gallery';
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof GalleryPluginConfig> = ['visibleOnLoad', 'items'];

    private readonly gallery: GalleryComponent;

    private items: GalleryItem[] = [];
    private handler?: (id: GalleryItem['id']) => void;
    private currentId?: GalleryItem['id'];

    constructor(viewer: Viewer, config: GalleryPluginConfig) {
        super(viewer, config);

        this.gallery = new GalleryComponent(this, this.viewer);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'gallery-plugin');

        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.addEventListener(events.ShowPanelEvent.type, this);

        if (this.config.visibleOnLoad) {
            this.viewer.addEventListener(events.ReadyEvent.type, () => {
                this.show();
            }, { once: true });
        }

        this.setItems(this.config.items);
        delete this.config.items;

        // buttons are initialized just after plugins
        setTimeout(() => this.__updateButton());
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.removeEventListener(events.ShowPanelEvent.type, this);

        this.gallery.destroy();

        super.destroy();
    }

    override setOptions(options: Partial<UpdatableGalleryPluginConfig>) {
        super.setOptions(options);

        if (options.thumbnailSize) {
            this.gallery.setItems(this.items);
        }
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.PanoramaLoadedEvent) {
            const item = this.items.find((i) => utils.deepEqual(i.panorama, e.data.panorama));
            this.currentId = item?.id;
            this.gallery.setActive(item?.id);
        } else if (e instanceof events.ShowPanelEvent) {
            this.gallery.isVisible() && this.hide();
        }
    }

    /**
     * Shows the gallery
     */
    show() {
        this.dispatchEvent(new ShowGalleryEvent());
        return this.gallery.show();
    }

    /**
     * Hides the carousem
     */
    hide() {
        this.dispatchEvent(new HideGalleryEvent());
        return this.gallery.hide();
    }

    /**
     * Hides or shows the gallery
     */
    toggle() {
        if (this.gallery.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Sets the list of items
     * @param items
     * @param [handler] function that will be called when an item is clicked instead of the default behavior
     * @throws {@link PSVError} if the configuration is invalid
     */
    setItems(items: GalleryItem[], handler?: (id: GalleryItem['id']) => void) {
        if (!items) {
            items = [];
        } else {
            items.forEach((item, i) => {
                if (!item.id) {
                    throw new PSVError(`Item ${i} has no "id".`);
                }
                if (!item.panorama) {
                    throw new PSVError(`Item ${item.id} has no "panorama".`);
                }
            });
        }

        this.handler = handler;
        this.items = items.map((item) => ({
            ...item,
            id: `${item.id}`,
        }));

        this.gallery.setItems(this.items);

        this.__updateButton();
    }

    /**
     * @internal
     */
    __click(id: GalleryItem['id']) {
        if (id === this.currentId) {
            return;
        }

        if (this.handler) {
            this.handler(id);
        } else {
            const item = this.items.find((i) => i.id === id);
            this.viewer.setPanorama(item.panorama, {
                caption: item.name,
                ...item.options,
            });
        }

        this.currentId = id;
        this.gallery.setActive(id);

        if (this.config.hideOnClick) {
            this.hide();
        }
    }

    private __updateButton() {
        this.viewer.navbar.getButton(GalleryButton.id, false)?.toggle(this.items.length > 0);
    }
}
