import icon from '../icons/compass.svg';
import { AbstractMapButton, ButtonPosition } from './AbstractMapButton';
import type { MapComponent } from './MapComponent';

export class MapCompassButton extends AbstractMapButton {
    constructor(map: MapComponent) {
        super(map, 'mapNorth', ButtonPosition.VERTICAL);

        this.container.innerHTML = icon;
        this.container.querySelector('svg').style.scale = '1.2';

        this.container.addEventListener('click', (e) => {
            this.viewer.dynamics.position.goto({ yaw: -map.config.rotation }, 2);
            e.stopPropagation();
        });
    }

    rotate(angle: number) {
        this.container.querySelector('svg').style.transform = `rotate3d(0, 0, 1, ${-angle}rad)`;
    }
}
