import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, utils, CONSTANTS } from '@photo-sphere-viewer/core';
import { ACTIVE_CLASS, GALLERY_ITEM_DATA, GALLERY_ITEM_DATA_KEY, ITEMS_TEMPLATE } from './constants';
import type { GalleryPlugin } from './GalleryPlugin';
import blankIcon from './icons/blank.svg';
import { GalleryItem } from './model';

export class GalleryComponent extends AbstractComponent {
    protected override readonly state = {
        visible: true,
        mousedown: false,
        initMouseX: null as number,
        mouseX: null as number,
    };

    private readonly observer: IntersectionObserver;
    private readonly items: HTMLElement;

    constructor(
        private readonly plugin: GalleryPlugin,
        viewer: Viewer
    ) {
        super(viewer, {
            className: `psv-gallery ${CONSTANTS.CAPTURE_EVENTS_CLASS}`,
        });

        this.container.innerHTML = blankIcon;
        this.container.querySelector('svg').style.display = 'none';

        const closeBtn = document.createElement('div');
        closeBtn.className = 'psv-panel-close-button';
        closeBtn.innerHTML = CONSTANTS.ICONS.close;
        this.container.appendChild(closeBtn);

        this.items = document.createElement('div');
        this.items.className = 'psv-gallery-container';
        this.container.appendChild(this.items);

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.intersectionRatio > 0) {
                        const element = entry.target as HTMLElement;
                        element.style.backgroundImage = `url(${element.dataset.src})`;
                        delete element.dataset.src;
                        this.observer.unobserve(entry.target);
                    }
                });
            },
            {
                root: this.viewer.container,
            }
        );

        this.container.addEventListener('wheel', this);
        this.container.addEventListener('mousedown', this);
        this.container.addEventListener('mousemove', this);
        this.container.addEventListener('click', this);
        window.addEventListener('mouseup', this);

        closeBtn.addEventListener('click', () => this.plugin.hide());

        this.hide();
    }

    override destroy() {
        window.removeEventListener('mouseup', this);

        this.observer.disconnect();

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case 'wheel':
                this.container.scrollLeft += (e as WheelEvent).deltaY * 50;
                e.preventDefault();
                break;

            case 'mousedown':
                this.state.mousedown = true;
                this.state.initMouseX = (e as MouseEvent).clientX;
                this.state.mouseX = (e as MouseEvent).clientX;
                break;

            case 'mousemove':
                if (this.state.mousedown) {
                    const delta = this.state.mouseX - (e as MouseEvent).clientX;
                    this.container.scrollLeft += delta;
                    this.state.mouseX = (e as MouseEvent).clientX;
                }
                break;

            case 'mouseup':
                this.state.mousedown = false;
                this.state.mouseX = null;
                e.preventDefault();
                break;

            case 'click':
                // prevent click on drag
                if (Math.abs(this.state.initMouseX - (e as MouseEvent).clientX) < 10) {
                    const item = utils.getClosest(e.target as HTMLElement, `[data-${GALLERY_ITEM_DATA_KEY}]`);
                    if (item) {
                        this.plugin.__click(item.dataset[GALLERY_ITEM_DATA]);
                    }
                }
                break;
        }
    }

    override show() {
        this.container.classList.add('psv-gallery--open');
        this.state.visible = true;
    }

    override hide() {
        this.container.classList.remove('psv-gallery--open');
        this.state.visible = false;
    }

    setItems(items: GalleryItem[]) {
        this.items.innerHTML = ITEMS_TEMPLATE(items, this.plugin.config.thumbnailSize);

        if (this.observer) {
            this.observer.disconnect();

            this.items.querySelectorAll('[data-src]').forEach((child) => {
                this.observer.observe(child);
            });
        }
    }

    setActive(id: GalleryItem['id']) {
        const currentActive = this.items.querySelector('.' + ACTIVE_CLASS);
        currentActive?.classList.remove(ACTIVE_CLASS);

        if (id) {
            const nextActive = this.items.querySelector(`[data-${GALLERY_ITEM_DATA_KEY}="${id}"]`);
            nextActive?.classList.add(ACTIVE_CLASS);
        }
    }
}
