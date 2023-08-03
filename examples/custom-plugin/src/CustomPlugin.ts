import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractPlugin } from '@photo-sphere-viewer/core';
import { CustomPluginEvent, CustomPluginEvents } from './events';
import { CustomPluginConfig } from './model';

export class CustomPlugin extends AbstractPlugin<CustomPluginEvents> {
    static override readonly id = 'custom-plugin';

    constructor(
        viewer: Viewer,
        private config: CustomPluginConfig
    ) {
        super(viewer);
    }

    override init() {
        // do your initialisation logic here
        console.log(this.config.foo);
    }

    override destroy() {
        // do your cleanup logic here
        super.destroy();
    }

    doSomething() {
        this.dispatchEvent(new CustomPluginEvent(true));
    }
}
