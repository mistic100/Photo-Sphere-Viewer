import reset from '../icons/reset.svg';
import { AbstractMapButton, ButtonPosition } from './AbstractMapButton';
import type { MapComponent } from './MapComponent';

export class MapResetButton extends AbstractMapButton {
    constructor(map: MapComponent) {
        super(map, 'mapReset', ButtonPosition.HORIZONTAL);

        this.container.innerHTML = reset;
        this.container.querySelector('svg').style.scale = '1.2';

        this.container.addEventListener('click', (e) => {
            map.reset();
            e.stopPropagation();
        });
    }
}
