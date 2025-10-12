import { AbstractComponent, type AttachedTooltip } from '@photo-sphere-viewer/core';
import { MapComponent } from './MapComponent';

export const enum ButtonPosition {
    DEFAULT,
    DIAGONAL,
    HORIZONTAL,
    VERTICAL,
}

const INVERT_POSITIONS: Record<string, string> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
};

function getButtonPosition(mapPosition: [string, string], direction: ButtonPosition): [string, string] {
    switch (direction) {
        case ButtonPosition.DIAGONAL:
            return [INVERT_POSITIONS[mapPosition[0]], INVERT_POSITIONS[mapPosition[1]]];
        case ButtonPosition.HORIZONTAL:
            return [mapPosition[0], INVERT_POSITIONS[mapPosition[1]]];
        case ButtonPosition.VERTICAL:
            return [INVERT_POSITIONS[mapPosition[0]], mapPosition[1]];
        default:
            return mapPosition;
    }
}

export abstract class AbstractMapButton extends AbstractComponent {
    private tooltip: AttachedTooltip;

    constructor(
        protected map: MapComponent,
        protected langKey: string,
        private position: ButtonPosition,
    ) {
        super(map, {});
    }

    override destroy(): void {
        this.tooltip?.destroy();
        super.destroy();
    }

    applyConfig() {
        this.container.className = `psv-map__button psv-map__button--${getButtonPosition(this.map.config.position, this.position).join('-')}`;
        this.container.setAttribute('aria-label', this.viewer.config.lang[this.langKey]);

        this.tooltip?.destroy();
        this.tooltip = this.viewer.attachTooltip({
            position: 'top',
            content: this.viewer.config.lang[this.langKey],
        }, this.container);
    }
}
