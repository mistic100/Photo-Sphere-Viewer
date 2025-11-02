import { DescriptionButton } from '../buttons/DescriptionButton';
import { AbstractComponent } from './AbstractComponent';
import type { Navbar } from './Navbar';

export class NavbarCaption extends AbstractComponent {
    static readonly id = 'caption';

    private contentWidth = 0;

    private readonly contentElt: HTMLElement;

    constructor(navbar: Navbar) {
        super(navbar, {
            className: 'psv-caption',
        });

        this.contentElt = document.createElement('div');
        this.contentElt.className = 'psv-caption-content psv-navbar-group';
        this.container.appendChild(this.contentElt);

        this.setCaption(this.viewer.config.caption);
    }

    override hide() {
        this.contentElt.style.display = 'none';
        this.state.visible = false;
    }

    override show() {
        this.contentElt.style.display = '';
        this.state.visible = true;
    }

    /**
     * Changes the caption
     */
    setCaption(html: string | null) {
        this.show();
        this.contentElt.innerHTML = html ?? '';

        if (this.contentElt.innerHTML) {
            this.contentWidth = this.contentElt.offsetWidth;
        } else {
            this.contentWidth = 0;
        }

        this.autoSize();
    }

    /**
     * Toggles content and icon depending on available space
     * @internal
     */
    autoSize(atStart?: boolean, atEnd?: boolean) {
        this.toggle(this.container.offsetWidth >= this.contentWidth);
        (this.viewer.navbar.getButton(DescriptionButton.id, false) as DescriptionButton).autoHide();

        if (atStart !== undefined && atEnd !== undefined) {
            if (atStart && !atEnd) {
                this.container.style.justifyContent = 'flex-start';
            } else if (!atStart && atEnd) {
                this.container.style.justifyContent = 'flex-end';
            } else {
                this.container.style.justifyContent = 'center';
            }
        }
    }
}
