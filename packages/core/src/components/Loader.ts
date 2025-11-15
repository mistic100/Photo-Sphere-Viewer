import { MathUtils } from 'three';
import { getStyleProperty } from '../utils';
import type { Viewer } from '../Viewer';
import { AbstractComponent } from './AbstractComponent';

/**
 * Loader component
 */
export class Loader extends AbstractComponent {
    /**
     * @internal
     */
    protected override readonly state = {
        visible: true,
        hideTimeout: null as ReturnType<typeof setTimeout>,
    };

    private readonly loader: HTMLElement;
    private readonly text: HTMLElement;
    private readonly path: SVGElement;

    private readonly size: number;
    private readonly spacing: number;
    private readonly thickness: number;

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer, { className: 'psv-loader-container' });

        this.loader = document.createElement('div');
        this.loader.className = 'psv-loader';
        this.container.appendChild(this.loader);

        this.size = this.loader.offsetWidth;
        this.spacing = parseInt(getStyleProperty(this.loader, '--psv-loader-spacing'), 10);
        this.thickness = parseInt(getStyleProperty(this.loader, '--psv-loader-tickness'), 10);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'psv-loader-canvas');
        svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
        this.loader.appendChild(svg);

        this.text = document.createElement('div');
        this.text.className = 'psv-loader-text';
        this.loader.appendChild(this.text);

        svg.innerHTML = `
        <mask id="psv-loader-mask">
            <path d="" fill="none" stroke="white"  stroke-width="${this.thickness}" stroke-linecap="round"/>
        </mask>
        <foreignObject x="0" y="0" width="${this.size}" height="${this.size}" mask="url(#psv-loader-mask)">
            <div style="width: 100%; height: 100%; background: var(--psv-loader-color)" xmlns="http://www.w3.org/1999/xhtml"/>
        </foreignObject>`;

        this.path = svg.querySelector('path');

        super.hide();

        this.container.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity' && !this.isVisible()) {
                clearTimeout(this.state.hideTimeout);
                super.hide();
            }
        });
    }

    override hide(): void {
        this.state.visible = false;
        this.container.classList.remove('psv-loader--undefined');
        this.container.classList.remove('psv-loader-container--visible');

        // watchdog in case the "transitionend" event is not received
        const duration = parseFloat(getStyleProperty(this.container, 'transition-duration'));
        this.state.hideTimeout = setTimeout(() => {
            super.hide();
        }, duration * 2000);
    }

    override show(): void {
        super.show();
        setTimeout(() => {
            this.container.classList.add('psv-loader-container--visible');
        }, 10);
    }

    /**
     * Sets the loader progression
     */
    setProgress(value: number) {
        this.container.classList.remove('psv-loader--undefined');

        const angle = (MathUtils.clamp(value, 0, 99.999) / 100) * Math.PI * 2;
        const halfSize = this.size / 2;
        const startX = halfSize;
        const startY = this.thickness / 2 + this.spacing;
        const radius = (this.size - this.thickness) / 2 - this.spacing;
        const endX = Math.sin(angle) * radius + halfSize;
        const endY = -Math.cos(angle) * radius + halfSize;
        const largeArc = value > 50 ? '1' : '0';

        this.path.setAttributeNS(null, 'd',
            `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
        );

        this.text.innerText = `${Math.round(MathUtils.clamp(value, 0, 100))}%`;
    }

    /**
     * Animates the loader with an unknown state
     */
    showUndefined() {
        this.show();
        this.setProgress(25);
        this.container.classList.add('psv-loader--undefined');
    }
}
