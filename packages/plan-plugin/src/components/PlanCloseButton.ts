import { CONSTANTS } from '@photo-sphere-viewer/core';
import { AbstractPlanButton, ButtonPosition } from './AbstractPlanButton';
import type { PlanComponent } from './PlanComponent';

export class PlanCloseButton extends AbstractPlanButton {
    constructor(plan: PlanComponent) {
        super(plan, 'close', ButtonPosition.DEFAULT);

        this.container.innerHTML = CONSTANTS.ICONS.close;

        this.container.addEventListener('click', (e) => {
            plan.hide();
            e.stopPropagation();
        });
    }
}
