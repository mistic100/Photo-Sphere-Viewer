import reset from '../icons/reset.svg';
import { AbstractPlanButton, ButtonPosition } from './AbstractPlanButton';
import type { PlanComponent } from './PlanComponent';

export class PlanResetButton extends AbstractPlanButton {
    constructor(plan: PlanComponent) {
        super(plan, 'mapReset', ButtonPosition.HORIZONTAL);

        this.container.innerHTML = reset;
        this.container.querySelector('svg').style.scale = '1.2';

        this.container.addEventListener('click', (e) => {
            plan.reset();
            e.stopPropagation();
        });
    }
}
