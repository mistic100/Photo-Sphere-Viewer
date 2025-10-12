import maximize from '../icons/maximize.svg';
import minimize from '../icons/minimize.svg';
import { AbstractPlanButton, ButtonPosition } from './AbstractPlanButton';
import type { PlanComponent } from './PlanComponent';

const ROTATION: Record<string, number> = {
    'bottom-left': 0,
    'bottom-right': -90,
    'top-right': 180,
    'top-left': 90,
};

export class PlanMaximizeButton extends AbstractPlanButton {
    constructor(plan: PlanComponent) {
        super(plan, 'mapMaximize', ButtonPosition.DIAGONAL);

        this.container.addEventListener('click', (e) => {
            plan.toggleMaximized();
            e.stopPropagation();
        });
    }

    override applyConfig(): void {
        this.langKey = this.plan.maximized ? 'mapMinimize' : 'mapMaximize';
        super.applyConfig();

        this.container.innerHTML = this.plan.maximized ? minimize : maximize;
        this.container.querySelector('svg').style.transform = `rotate3d(0, 0, 1, ${ROTATION[this.plan.config.position.join('-')]}deg)`;
    }
}
