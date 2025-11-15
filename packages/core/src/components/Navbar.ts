import { AbstractButton, ButtonConstructor } from '../buttons/AbstractButton';
import { CustomButton } from '../buttons/CustomButton';
import { DescriptionButton } from '../buttons/DescriptionButton';
import { DownloadButton } from '../buttons/DownloadButton';
import { FullscreenButton } from '../buttons/FullscreenButton';
import { MenuButton } from '../buttons/MenuButton';
import { MoveDownButton } from '../buttons/MoveDownButton';
import { MoveLeftButton } from '../buttons/MoveLeftButton';
import { MoveRightButton } from '../buttons/MoveRightButton';
import { MoveUpButton } from '../buttons/MoveUpButton';
import { ZoomInButton } from '../buttons/ZoomInButton';
import { ZoomOutButton } from '../buttons/ZoomOutButton';
import { DEFAULTS } from '../data/config';
import { CAPTURE_EVENTS_CLASS } from '../data/constants';
import { ParsedViewerConfig } from '../model';
import { PSVError } from '../PSVError';
import { logWarn } from '../utils';
import type { Viewer } from '../Viewer';
import { AbstractComponent } from './AbstractComponent';
import { NavbarCaption } from './NavbarCaption';

/**
 * List of available buttons
 */
const AVAILABLE_BUTTONS: Record<string, ButtonConstructor> = {};

/**
 * List of available buttons
 */
const AVAILABLE_GROUPS: Record<string, ButtonConstructor[]> = {};

/**
 * Register a new button available for all viewers
 * @param button
 * @param [defaultPosition]  If provided the default configuration of the navbar will be modified.
 * Possible values are :
 *    - `start`
 *    - `end`
 *    - `[id]:left` (same group)
 *    - `[id]:right` (same group)
 *    - `[id]:after` (new group)
 *    - `[id]:before` (new group)
 * @throws {@link PSVError} if the button constructor has no "id"
 */
export function registerButton(button: ButtonConstructor, ...defaultPositions: string[]) {
    if (!button.id) {
        throw new PSVError('Button id is required');
    }

    AVAILABLE_BUTTONS[button.id] = button;

    if (button.groupId) {
        (AVAILABLE_GROUPS[button.groupId] = AVAILABLE_GROUPS[button.groupId] || []).push(button);
    }

    const navbar = DEFAULTS.navbar as string[][];
    defaultPositions.some((defaultPosition) => {
        switch (defaultPosition) {
            case 'start':
                navbar.unshift([button.id]);
                return true;
            case 'end':
                navbar.push([button.id]);
                return true;
            default: {
                const [id, pos] = defaultPosition.split(':');
                return navbar.some((group, i) => {
                    const idx = group.indexOf(id);
                    if (idx !== -1) {
                        switch (pos) {
                            case 'left':
                                group.splice(idx, 0, button.id);
                                return true;
                            case 'right':
                                group.splice(idx + 1, 0, button.id);
                                return true;
                            case 'before':
                                navbar.splice(i, 0, [button.id]);
                                return true;
                            case 'after':
                                navbar.splice(i + 1, 0, [button.id]);
                                return true;
                        }
                    }
                    return false;
                });
            }
        }
    });
}

[
    ZoomOutButton,
    ZoomInButton,
    DescriptionButton,
    DownloadButton,
    FullscreenButton,
    MoveLeftButton,
    MoveRightButton,
    MoveUpButton,
    MoveDownButton,
    MenuButton,
].forEach(btn => registerButton(btn));

/**
 * Group of buttons in the the navbar
 */
export class NavbarGroup extends AbstractComponent {
    protected override readonly state = {
        visible: true,
        margins: 0,
    };

    constructor(navbar: Navbar) {
        super(navbar, {
            className: 'psv-navbar-group',
        });

        const style = window.getComputedStyle(this.container);
        this.state.margins = parseFloat(style.marginLeft) + parseFloat(style.marginRight)
            + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    }

    override toggle() {
        // noop
    }

    /**
     * Returns the width of all visible items (including collapsed ones) + margins
     */
    getWidth(): number {
        return this.children.reduce((total, child) => {
            if (child instanceof AbstractButton && child.isVisible()) {
                return total + child.width;
            } else {
                return total;
            }
        }, this.state.margins);
    }

    /**
     * Collapses all collapsable items
     */
    collapse(): AbstractButton[] {
        const collapsed: AbstractButton[] = [];
        this.children.forEach((child) => {
            if (child instanceof AbstractButton && child.collapsable) {
                child.collapse();
                collapsed.push(child);
            }
        });
        this.autoHide();
        return collapsed;
    }

    /**
     * Uncollapse all items
     */
    uncollapse() {
        this.children.forEach((child) => {
            if (child instanceof AbstractButton && child.collapsable) {
                child.uncollapse();
            }
        });
        this.autoHide();
    }

    /**
     * Automatically hides the container if no items are visible
     */
    autoHide() {
        const hasVisibleItems = this.children.some((child) => {
            if (child instanceof AbstractButton) {
                return child.isVisible() && !child.collapsed;
            } else {
                return true;
            }
        });
        if (hasVisibleItems) {
            this.show();
        } else {
            this.hide();
        }
    }
}

/**
 * Navigation bar component
 */
export class Navbar extends AbstractComponent {
    /**
     * @internal
     */
    collapsed: AbstractButton[] = [];

    /**
     * @internal
     */
    caption?: NavbarCaption;

    /**
     * @internal
     */
    get groups(): NavbarGroup[] {
        return this.children
            .filter(child => child instanceof NavbarGroup);
    }

    /**
     * @internal
     */
    get buttons(): AbstractButton[] {
        return this.children
            .flatMap(child => child.children)
            .filter(child => child instanceof AbstractButton);
    }

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer, {
            className: `psv-navbar ${CAPTURE_EVENTS_CLASS}`,
        });

        this.state.visible = false;
    }

    /**
     * Shows the navbar
     */
    override show() {
        this.viewer.container.classList.add('psv--has-navbar');
        this.container.classList.add('psv-navbar--open');
        this.state.visible = true;
    }

    /**
     * Hides the navbar
     */
    override hide() {
        this.viewer.container.classList.remove('psv--has-navbar');
        this.container.classList.remove('psv-navbar--open');
        this.state.visible = false;
    }

    /**
     * Change the buttons visible on the navbar
     */
    setButtons(groups: ParsedViewerConfig['navbar']) {
        this.children.slice().forEach(item => item.destroy());
        this.children.length = 0;
        this.caption = null;

        const hasDescriptionButton = groups.flat().includes(DescriptionButton.id);
        const hasMenuButton = groups.flat().includes(MenuButton.id);

        let group: NavbarGroup = null;
        const getGroup = () => {
            if (!group) {
                group = new NavbarGroup(this);
            }
            return group;
        };
        const getLastGroup = () => {
            return this.groups.reverse()[0] ?? getGroup();
        };

        groups.forEach((buttons) => {
            buttons.forEach((button) => {
                if (typeof button === 'object') {
                    new CustomButton(getGroup(), button);
                } else if (AVAILABLE_BUTTONS[button]) {
                    // @ts-ignore
                    new AVAILABLE_BUTTONS[button](getGroup());
                } else if (AVAILABLE_GROUPS[button]) {
                    AVAILABLE_GROUPS[button].forEach((buttonCtor) => {
                        // @ts-ignore
                        new buttonCtor(getGroup());
                    });
                } else if (button === NavbarCaption.id) {
                    if (!hasDescriptionButton) {
                        new DescriptionButton(getLastGroup());
                    }
                    this.caption = new NavbarCaption(this);
                    group = null;
                } else {
                    logWarn(`Unknown button ${button}`);
                }
            });

            group = null;
        });

        if (!hasMenuButton) {
            new MenuButton(getLastGroup());
        }

        this.buttons.forEach((item) => {
            item.checkSupported();
        });

        this.autoSize();
    }

    /**
     * Changes the navbar caption
     */
    setCaption(html: string | null) {
        this.caption?.setCaption(html);
    }

    /**
     * Returns a button by its identifier
     */
    getButton(id: string, warnNotFound = true): AbstractButton {
        const button = this.buttons.find(item => item.id === id);

        if (!button && warnNotFound) {
            logWarn(`button "${id}" not found in the navbar`);
        }

        return button as AbstractButton;
    }

    /**
     * Try to focus a button, will focus the first button if the requested button does not exist.
     */
    focusButton(id: string) {
        if (this.isVisible()) {
            (this.getButton(id, false)?.container || this.groups[0]?.container.firstElementChild as HTMLElement)?.focus();
        }
    }

    /**
     * Automatically collapses buttons and adapt the caption
     * @internal
     */
    autoSize() {
        const availableWidth = this.container.offsetWidth;

        const totalWidth = this.groups.reduce((total, group) => {
            if (group.isVisible()) {
                return total + group.getWidth();
            } else {
                return total;
            }
        }, 0);

        if (availableWidth < totalWidth) {
            this.collapsed = this.groups.flatMap(group => group.collapse());

            if (this.collapsed.length) {
                this.getButton(MenuButton.id).show(false);
            }
        } else if (availableWidth >= totalWidth && this.collapsed.length) {
            this.collapsed.length = 0;

            this.groups.forEach(group => group.uncollapse());

            this.getButton(MenuButton.id).hide(false);
        }

        if (this.caption) {
            // check if the caption is the first or last element
            let foundCaption = false;
            let elementsBeforeCaption = false;
            let elementsAfterCaption = false;
            this.children.forEach((child) => {
                if (child instanceof NavbarCaption) {
                    foundCaption = true;
                } else if (child instanceof NavbarGroup && child.isVisible()) {
                    if (foundCaption) {
                        elementsAfterCaption = true;
                    } else {
                        elementsBeforeCaption = true;
                    }
                }
            });

            this.caption.autoSize(!elementsBeforeCaption, !elementsAfterCaption);
        }
    }
}
