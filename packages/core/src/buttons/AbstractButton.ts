import { AbstractComponent } from '../components/AbstractComponent';
import type { Navbar } from '../components/Navbar';
import { KEY_CODES } from '../data/constants';
import { ResolvableBoolean } from '../model';
import { addClasses, getConfigParser, resolveBoolean, toggleClass } from '../utils';

/**
 * Configuration for {@link AbstractButton}
 */
export type ButtonConfig = {
    id?: string;
    className?: string;
    title?: string;
    /**
     * if the button has an mouse hover effect
     * @default false
     */
    hoverScale?: boolean;
    /**
     * if the button can be moved to menu when the navbar is too small
     * @default false
     */
    collapsable?: boolean;
    /**
     * if the button is accessible with the keyboard
     * @default true
     */
    tabbable?: boolean;
    /**
     * icon of the button
     */
    icon?: string;
    /**
     * override icon when the button is active
     */
    iconActive?: string;
}

const getConfig = getConfigParser<ButtonConfig>({
    id: null,
    className: null,
    title: null,
    hoverScale: false,
    collapsable: false,
    tabbable: true,
    icon: null,
    iconActive: null,
});

/**
 * Base class for navbar buttons
 */
export abstract class AbstractButton extends AbstractComponent {
    /**
     * Unique identifier of the button
     */
    static readonly id: string;

    /**
     * Identifier to declare a group of buttons
     */
    static readonly groupId?: string;

    /**
     * Internal properties
     */
    protected override readonly state = {
        visible: true,
        enabled: true,
        supported: true,
        collapsed: false,
        active: false,
        width: 0,
    };

    protected readonly config: ButtonConfig;

    get id(): string {
        return this.config.id;
    }

    get title(): string {
        return this.container.title;
    }

    get content(): string {
        return this.container.innerHTML;
    }

    get width(): number {
        return this.state.width;
    }

    get collapsable(): boolean {
        return this.config.collapsable;
    }

    constructor(navbar: Navbar, config: ButtonConfig) {
        super(navbar, {
            className: `psv-button ${config.hoverScale ? 'psv-button--hover-scale' : ''} ${config.className || ''}`,
        });

        this.config = getConfig(config);
        this.config.id = (this.constructor as typeof AbstractButton).id;

        if (config.icon) {
            this.__setIcon(config.icon);
        }

        this.state.width = this.container.offsetWidth;

        if (this.config.title) {
            this.container.title = this.config.title;
        } else if (this.id && this.id in this.viewer.config.lang) {
            this.container.title = (this.viewer.config.lang as any)[this.id];
        }

        if (config.tabbable) {
            this.container.tabIndex = 0;
        }

        this.container.addEventListener('click', (e) => {
            if (this.state.enabled) {
                this.onClick();
            }
            e.stopPropagation();
        });

        this.container.addEventListener('keydown', (e) => {
            if (e.key === KEY_CODES.Enter && this.state.enabled) {
                this.onClick();
                e.stopPropagation();
            }
        });
    }

    /**
     * Action when the button is clicked
     */
    abstract onClick(): void;

    override show(refresh = true) {
        if (!this.isVisible()) {
            this.state.visible = true;
            if (!this.state.collapsed) {
                this.container.style.display = '';
            }
            if (refresh) {
                this.viewer.navbar.autoSize();
            }
        }
    }

    override hide(refresh = true) {
        if (this.isVisible()) {
            this.state.visible = false;
            this.container.style.display = 'none';
            if (refresh) {
                this.viewer.navbar.autoSize();
            }
        }
    }

    /**
     * Hides/shows the button depending of the result of {@link isSupported}
     * @internal
     */
    checkSupported() {
        resolveBoolean(this.isSupported(), (supported, init) => {
            if (!this.state) {
                return; // the component has been destroyed
            }
            this.state.supported = supported;
            if (!init) {
                this.toggle(supported);
            } else if (!supported) {
                this.hide();
            }
        });
    }

    /**
     * Perform action when the navbar size/content changes
     * @internal
     */
    autoSize() {
        // nothing
    }

    /**
     * Checks if the button can be displayed
     */
    isSupported(): boolean | ResolvableBoolean {
        return true;
    }

    /**
     * Changes the active state of the button
     */
    toggleActive(active = !this.state.active) {
        if (active !== this.state.active) {
            this.state.active = active;
            toggleClass(this.container, 'psv-button--active', this.state.active);

            if (this.config.iconActive) {
                this.__setIcon(this.state.active ? this.config.iconActive : this.config.icon);
            }
        }
    }

    /**
     * Disables the button
     */
    disable() {
        this.container.classList.add('psv-button--disabled');
        this.state.enabled = false;
    }

    /**
     * Enables the button
     */
    enable() {
        this.container.classList.remove('psv-button--disabled');
        this.state.enabled = true;
    }

    /**
     * Collapses the button in the navbar menu
     */
    collapse() {
        this.state.collapsed = true;
        this.container.style.display = 'none';
    }

    /**
     * Uncollapses the button from the navbar menu
     */
    uncollapse() {
        this.state.collapsed = false;
        if (this.state.visible) {
            this.container.style.display = '';
        }
    }

    private __setIcon(icon: string) {
        this.container.innerHTML = icon;
        addClasses(this.container.querySelector('svg'), 'psv-button-svg');
    }
}

export type ButtonConstructor = (new (navbar: Navbar) => AbstractButton) & typeof AbstractButton;
