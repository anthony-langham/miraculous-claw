// On-screen controls for phones/tablets, styled after Bloom's: a dark joystick with a light
// ring bottom-left, and a grey rounded action button bottom-right. They drive Ladybug (P1) by
// holding the same virtual keys the keyboard uses, so player.js doesn't know the difference.
// Cat Noir (P2) stays on the keyboard (WASD + F).

const STICK_RADIUS = 34;   // how far the thumb can travel from centre (px)
const DEAD_ZONE = 0.35;    // fraction of STICK_RADIUS before a direction counts as pressed
const P1 = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', attack: 'ShiftRight' };

export function isTouchDevice() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export class TouchControls {
    constructor(input, canvas, onShow) {
        this.input = input;
        this.onShow = onShow;
        this.stickPointer = null;
        this.visible = false;

        const root = document.createElement('div');
        root.id = 'touch-controls';
        root.innerHTML = `
            <div class="tc-stick-zone">
                <div class="tc-stick-base"><div class="tc-stick-thumb"></div></div>
            </div>
            <button class="tc-btn tc-attack" type="button" aria-label="Attack">🐞</button>
        `;
        document.body.appendChild(root);
        this.root = root;
        this.zone = root.querySelector('.tc-stick-zone');
        this.base = root.querySelector('.tc-stick-base');
        this.thumb = root.querySelector('.tc-stick-thumb');
        this.attackBtn = root.querySelector('.tc-attack');

        this.zone.addEventListener('pointerdown', (e) => this._stickDown(e));
        this.zone.addEventListener('pointermove', (e) => this._stickMove(e));
        this.zone.addEventListener('pointerup', (e) => this._stickUp(e));
        this.zone.addEventListener('pointercancel', (e) => this._stickUp(e));

        const press = (e) => {
            e.preventDefault();
            this.attackBtn.setPointerCapture?.(e.pointerId);
            this.attackBtn.classList.add('pressed');
            this.input.setVirtual(P1.attack, true);
            this.input.pulse('Space'); // also starts / restarts the game from menus
        };
        const release = () => {
            this.attackBtn.classList.remove('pressed');
            this.input.setVirtual(P1.attack, false);
        };
        this.attackBtn.addEventListener('pointerdown', press);
        this.attackBtn.addEventListener('pointerup', release);
        this.attackBtn.addEventListener('pointercancel', release);
        this.attackBtn.addEventListener('contextmenu', (e) => e.preventDefault());

        // Tapping the game itself works as SPACE (Start / Try Again / Play Again).
        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            this.show();
            this.input.pulse('Space');
        });

        if (isTouchDevice()) this.show();
        // A touch on a laptop with a touchscreen reveals the controls on demand.
        window.addEventListener('touchstart', () => this.show(), { passive: true, once: true });
    }

    show() {
        if (this.visible) return;
        this.visible = true;
        this.root.classList.add('visible');
        this.onShow?.();
    }

    _stickDown(e) {
        if (this.stickPointer !== null) return;
        e.preventDefault();
        this.stickPointer = e.pointerId;
        this.zone.setPointerCapture?.(e.pointerId);
        this.base.classList.add('active');
        this._stickMove(e);
    }

    _stickMove(e) {
        if (e.pointerId !== this.stickPointer) return;
        const r = this.base.getBoundingClientRect();
        let dx = e.clientX - (r.left + r.width / 2);
        let dy = e.clientY - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > STICK_RADIUS) {
            dx = (dx / len) * STICK_RADIUS;
            dy = (dy / len) * STICK_RADIUS;
        }
        this.thumb.style.transform = `translate(${dx}px, ${dy}px)`;

        const nx = dx / STICK_RADIUS;
        const ny = dy / STICK_RADIUS;
        this.input.setVirtual(P1.left, nx < -DEAD_ZONE);
        this.input.setVirtual(P1.right, nx > DEAD_ZONE);
        this.input.setVirtual(P1.up, ny < -DEAD_ZONE);
        this.input.setVirtual(P1.down, ny > DEAD_ZONE);
    }

    _stickUp(e) {
        if (e.pointerId !== this.stickPointer) return;
        this.stickPointer = null;
        this.base.classList.remove('active');
        this.thumb.style.transform = '';
        for (const dir of ['left', 'right', 'up', 'down']) this.input.setVirtual(P1[dir], false);
    }
}
