import type { NavbarGroup } from '../components/Navbar';
import { ICONS } from '../data/constants';
import { AbstractZoomButton, ZoomButtonDirection } from './AbstractZoomButton';

export class ZoomInButton extends AbstractZoomButton {
    static override readonly id = 'zoomIn';

    constructor(parent: NavbarGroup) {
        super(parent, ICONS.zoomIn, ZoomButtonDirection.IN);
    }
}
