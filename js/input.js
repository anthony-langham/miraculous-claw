export class Input {
    constructor() {
        this.keys = {};
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
    }

    update() {
        for (const key in this.keys) {
            this.justPressed[key] = this.keys[key] && !this._prev[key];
        }
        this._prev = { ...this.keys };
    }

    isDown(key) {
        return !!this.keys[key];
    }

    isJustPressed(key) {
        return !!this.justPressed[key];
    }
}
