import { AbstractComponent } from '../components/AbstractComponent';
import type { NavbarGroup } from '../components/Navbar';
import { AttachedTooltip } from '../components/Tooltip';
import { KEY_CODES } from '../data/constants';
import { ResolvableBoolean } from '../model';
import { getConfigParser, getStyleProperty, resolveBoolean, toggleClass } from '../utils';

/**
 * Configuration for {@link AbstractButton}
 */
export type ButtonConfig = {
    id?: string;
    tagName?: string;
    className?: string;
    title?: string;
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
};

const getConfig = getConfigParser<ButtonConfig>({
    id: null,
    tagName: null,
    className: null,
    title: null,
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
        title: '',
        tooltip: null as AttachedTooltip,
    };

    protected readonly config: ButtonConfig;

    get id(): string {
        return this.config.id;
    }

    get title(): string {
        return this.state.title;
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

    get collapsed(): boolean {
        return this.state.collapsed;
    }

    constructor(parent: NavbarGroup, config: ButtonConfig) {
        super(parent, {
            tagName: config.tagName,
            className: `psv-button ${config.className || ''}`,
        });

        this.config = getConfig(config);
        if (!config.id) {
            this.config.id = (this.constructor as typeof AbstractButton).id;
        }

        if (config.icon) {
            this.__setIcon(config.icon);
        }

        const style = window.getComputedStyle(this.container);
        this.state.width = this.container.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);

        this.state.title = this.viewer.config.lang[this.config.title] ?? this.config.title ?? this.viewer.config.lang[this.id];
        if (this.state.title) {
            this.container.setAttribute('aria-label', this.state.title);
            this.state.tooltip = this.viewer.attachTooltip({
                position: 'top',
                content: this.state.title,
                style: {
                    zIndex: 1 + getStyleProperty(this.viewer.navbar.container, 'z-index'),
                },
            }, this.container);
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

    override destroy(): void {
        this.state.tooltip?.destroy();
        super.destroy();
    }

    override show(refresh = true) {
        if (!this.isVisible()) {
            this.state.visible = true;
            if (!this.state.collapsed) {
                this.container.style.display = '';
            }
            (this.parent as NavbarGroup).autoHide();
            if (refresh) {
                this.viewer.navbar.autoSize();
            }
        }
    }

    override hide(refresh = true) {
        if (this.isVisible()) {
            this.state.visible = false;
            this.container.style.display = 'none';
            (this.parent as NavbarGroup).autoHide();
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

            if (this.state.active) {
                this.state.tooltip?.disable();
            } else {
                this.state.tooltip?.enable();
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
    }
}

export type ButtonConstructor = (new (parent: NavbarGroup) => AbstractButton) & typeof AbstractButton;
