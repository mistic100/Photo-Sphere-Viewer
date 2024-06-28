/**
 * Helper for pressable things (buttons, keyboard)
 * When the pressed thing goes up and was not pressed long enough, wait a bit more before execution
 * @internal
 */
export class PressHandler {
    private time = 0;
    private timeout: ReturnType<typeof setTimeout>;

    get pending() {
        return this.time !== 0;
    }

    constructor(private readonly delay = 200) {
        this.delay = delay;
    }

    down() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }

        this.time = new Date().getTime();
    }

    up(cb: () => void) {
        if (!this.time) {
            return;
        }

        const elapsed = Date.now() - this.time;
        if (elapsed < this.delay) {
            this.timeout = setTimeout(() => {
                cb();
                this.timeout = undefined;
                this.time = 0;
            }, this.delay);
        } else {
            cb();
            this.time = 0;
        }
    }
}
