import type { Viewer } from '../Viewer';

/**
 * Base class for UI components
 */
export abstract class AbstractComponent {
    /**
     * Reference to main controller
     */
    protected readonly viewer: Viewer;

    /**
     * All child components
     * @internal
     */
    readonly children: AbstractComponent[] = [];

    /**
     * Container element
     */
    readonly container: HTMLDivElement = document.createElement('div');

    /**
     * Internal properties
     * @internal
     */
    protected readonly state = {
        visible: true,
    };

    constructor(
        protected readonly parent: Viewer | AbstractComponent,
        config: { className?: string }
    ) {
        this.viewer = parent instanceof AbstractComponent ? parent.viewer : parent;

        this.container.className = config.className || '';

        this.parent.children.push(this);
        this.parent.container.appendChild(this.container);
    }

    /**
     * Destroys the component
     */
    destroy() {
        this.parent.container.removeChild(this.container);

        const childIdx = this.parent.children.indexOf(this);
        if (childIdx !== -1) {
            this.parent.children.splice(childIdx, 1);
        }

        this.children.slice().forEach((child) => child.destroy());
        this.children.length = 0;
    }

    /**
     * Displays or hides the component
     */
    toggle(visible = !this.isVisible()) {
        if (!visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Hides the component
     */
    // @ts-ignore unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hide(options?: any) {
        this.container.style.display = 'none';
        this.state.visible = false;
    }

    /**
     * Displays the component
     */
    // @ts-ignore unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    show(options?: any) {
        this.container.style.display = '';
        this.state.visible = true;
    }

    /**
     * Checks if the component is visible
     */
    isVisible(): boolean {
        return this.state.visible;
    }
}
