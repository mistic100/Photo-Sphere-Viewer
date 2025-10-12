import type { NavbarGroup } from '../components/Navbar';
import { NavbarCustomElement } from '../model';
import { AbstractButton } from './AbstractButton';

export class CustomButton extends AbstractButton {
    private readonly customOnClick: NavbarCustomElement['onClick'];

    constructor(parent: NavbarGroup, config: NavbarCustomElement) {
        super(parent, {
            id: config.id ?? `psvButton-${Math.random().toString(36).substring(2)}`,
            className: `psv-custom-${config.type} ${config.className || ''}`,
            collapsable: config.type === 'button' && config.collapsable !== false,
            tabbable: config.type === 'button' && config.tabbable !== false,
            title: config.title,
        });

        this.customOnClick = config.onClick;

        if (config.content) {
            if (typeof config.content === 'string') {
                this.container.innerHTML = config.content;
            } else {
                config.content.attachViewer?.(this.viewer);
                this.container.appendChild(config.content);
            }
        }

        const style = window.getComputedStyle(this.container);
        this.state.width = this.container.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);

        if (config.disabled) {
            this.disable();
        }

        if (config.visible === false) {
            this.hide();
        }
    }

    onClick() {
        this.customOnClick?.(this.viewer);
    }
}
