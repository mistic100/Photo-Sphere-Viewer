import type { Navbar } from '../components/Navbar';
import { ICONS } from '../data/constants';
import { AbstractZoomButton, ZoomButtonDirection } from './AbstractZoomButton';

export class ZoomOutButton extends AbstractZoomButton {
    static override readonly id = 'zoomOut';

    constructor(navbar: Navbar) {
        super(navbar, ICONS.zoomOut, ZoomButtonDirection.OUT);
    }
}
