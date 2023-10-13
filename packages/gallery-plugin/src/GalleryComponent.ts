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
        initMouse: null as number,
        mouse: null as number,
        itemMargin: null as number,
        breakpoint: null as number,
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

        this.state.itemMargin = parseInt(utils.getStyleProperty(this.items, 'padding-left'), 10);
        this.state.breakpoint = parseInt(utils.getStyleProperty(this.container, '--psv-gallery-breakpoint'), 10);

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

        this.items.addEventListener('wheel', this);
        this.items.addEventListener('mousedown', this);
        this.items.addEventListener('mousemove', this);
        this.items.addEventListener('click', this);
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
            case 'wheel': {
                if (window.innerWidth > this.state.breakpoint) {
                    const evt = e as WheelEvent;
                    const scrollAmount = this.plugin.config.thumbnailSize.width + this.state.itemMargin ?? 0;
                    this.items.scrollLeft += (evt.deltaY / Math.abs(evt.deltaY)) * scrollAmount;
                    e.preventDefault();
                }
                break;
            }

            case 'mousedown':
                this.state.mousedown = true;
                if (window.innerWidth > this.state.breakpoint) {
                    this.state.initMouse = (e as MouseEvent).clientX;
                } else {
                    this.state.initMouse = (e as MouseEvent).clientY;
                }
                this.state.mouse = this.state.initMouse;
                break;

            case 'mousemove':
                if (this.state.mousedown) {
                    if (window.innerWidth > this.state.breakpoint) {
                        const delta = this.state.mouse - (e as MouseEvent).clientX;
                        this.items.scrollLeft += delta;
                        this.state.mouse = (e as MouseEvent).clientX;
                    } else {
                        const delta = this.state.mouse - (e as MouseEvent).clientY;
                        this.items.scrollTop += delta;
                        this.state.mouse = (e as MouseEvent).clientY;
                    }
                }
                break;

            case 'mouseup':
                this.state.mousedown = false;
                this.state.mouse = null;
                e.preventDefault();
                break;

            case 'click':
                // prevent click on drag
                if (Math.abs(this.state.initMouse - (e as MouseEvent).clientX) < 10) {
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
            nextActive?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }
}
