import { CONSTANTS } from '@photo-sphere-viewer/core';
import { AbstractMapButton, ButtonPosition } from './AbstractMapButton';
import type { MapComponent } from './MapComponent';

export class MapCloseButton extends AbstractMapButton {
    constructor(map: MapComponent) {
        super(map, 'close', ButtonPosition.DEFAULT);

        this.container.innerHTML = CONSTANTS.ICONS.close;

        this.container.addEventListener('click', (e) => {
            map.hide();
            e.stopPropagation();
        });
    }
}
