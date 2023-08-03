import type { Navbar } from '../components/Navbar';
import { ICONS } from '../data/constants';
import { AbstractZoomButton, ZoomButtonDirection } from './AbstractZoomButton';

export class ZoomInButton extends AbstractZoomButton {
    static override readonly id = 'zoomIn';

    constructor(navbar: Navbar) {
        super(navbar, ICONS.zoomIn, ZoomButtonDirection.IN);
    }
}
