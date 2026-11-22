export class Input {
    constructor() {
        this.keys = {};
        this.virtual = {};   // held by on-screen touch controls
        this._pulses = {};   // taps shorter than a frame still register as a press
        this.justPressed = {};
        this._prev = {};

        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Don't leave keys stuck down if the tab loses focus mid-press.
        window.addEventListener('blur', () => {
            this.keys = {};
            this.virtual = {};
        });
    }

    /** Hold/release a key from the on-screen controls. */
    setVirtual(code, down) {
        if (down) {
            if (!this.virtual[code]) this._pulses[code] = true;
            this.virtual[code] = true;
        } else {
            this.virtual[code] = false;
        }
    }

    /** One-shot press (e.g. tapping the screen to start). */
    pulse(code) {
        this._pulses[code] = true;
    }

    update() {
        const codes = new Set([
            ...Object.keys(this.keys),
            ...Object.keys(this.virtual),
            ...Object.keys(this._prev),
            ...Object.keys(this._pulses),
        ]);
        const now = {};
        for (const code of codes) {
            const held = !!this.keys[code] || !!this.virtual[code];
            now[code] = held;
            this.justPressed[code] = (held && !this._prev[code]) || !!this._pulses[code];
        }
        this._pulses = {};
        this._prev = now;
    }

    isDown(key) {
        return !!this.keys[key] || !!this.virtual[key];
    }

    isJustPressed(key) {
        return !!this.justPressed[key];
    }
}
