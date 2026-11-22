// On-screen controls for phones/tablets, styled after Bloom's: a dark joystick with a light
// ring, and grey rounded action buttons. They hold the same virtual keys the keyboard uses,
// so player.js doesn't know the difference.
//
//   1 player:  Ladybug stick bottom-left, 🐞 bottom-right.
//   2 players: Ladybug stick + 🐞 on the left, Cat Noir stick + 🐾 on the right
//              (one tablet, two kids, one side each).

const STICK_RADIUS = 34;   // how far the thumb can travel from centre (px)
const DEAD_ZONE = 0.35;    // fraction of STICK_RADIUS before a direction counts as pressed

const KEYS = {
    ladybug: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', attack: 'ShiftRight' },
    catnoir: { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', attack: 'KeyF' },
};

/** A phone (not a tablet): too small for two kids to share, so 2-player is hidden. */
export function isPhone() {
    if (!isTouchDevice()) return false;
    const shortSide = Math.min(window.screen.width, window.screen.height);
    return shortSide < 600;
}

export function isTouchDevice() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function requestFullscreenLandscape() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
        const p = req.call(el, { navigationUI: 'hide' });
        const lock = () => screen.orientation?.lock?.('landscape').catch(() => {});
        if (p && p.then) p.then(lock).catch(() => {});
        else lock();
    } catch (e) { /* not allowed here — fine */ }
}

class Stick {
    constructor(zone, input, keys) {
        this.zone = zone;
        this.base = zone.querySelector('.tc-stick-base');
        this.thumb = zone.querySelector('.tc-stick-thumb');
        this.input = input;
        this.keys = keys;
        this.pointer = null;
        zone.addEventListener('pointerdown', (e) => this.down(e));
        zone.addEventListener('pointermove', (e) => this.move(e));
        zone.addEventListener('pointerup', (e) => this.up(e));
        zone.addEventListener('pointercancel', (e) => this.up(e));
        zone.addEventListener('lostpointercapture', (e) => this.up(e));
    }

    down(e) {
        if (this.pointer !== null) return;
        e.preventDefault();
        this.pointer = e.pointerId;
        this.zone.setPointerCapture?.(e.pointerId);
        this.base.classList.add('active');
        this.move(e);
    }

    move(e) {
        if (e.pointerId !== this.pointer) return;
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
        this.input.setVirtual(this.keys.left, nx < -DEAD_ZONE);
        this.input.setVirtual(this.keys.right, nx > DEAD_ZONE);
        this.input.setVirtual(this.keys.up, ny < -DEAD_ZONE);
        this.input.setVirtual(this.keys.down, ny > DEAD_ZONE);
    }

    up(e) {
        if (e.pointerId !== this.pointer) return;
        this.release();
    }

    release() {
        this.pointer = null;
        this.base.classList.remove('active');
        this.thumb.style.transform = '';
        for (const d of ['left', 'right', 'up', 'down']) this.input.setVirtual(this.keys[d], false);
    }
}

export class TouchControls {
    constructor(input, canvas, { onShow, onStart, onPause } = {}) {
        this.input = input;
        this.canvas = canvas;
        this.onShow = onShow;
        this.touch = false;

        const root = document.createElement('div');
        root.id = 'touch-controls';
        root.innerHTML = `
            <div class="tc-menu">
                <div class="tc-menu-row">
                    <button class="tc-menu-btn" type="button" data-players="1">
                        <span class="tc-menu-icons">🐞</span><span>1 PLAYER</span>
                    </button>
                    <button class="tc-menu-btn" type="button" data-players="2">
                        <span class="tc-menu-icons">🐞🐾</span><span>2 PLAYERS</span>
                    </button>
                </div>
                <div class="tc-menu-note tc-note-phone">2 players? Play on a tablet or computer!</div>
                <div class="tc-menu-note tc-note-keys">← → to choose · SPACE to start</div>
            </div>
            <div class="tc-play">
                <div class="tc-stick-zone tc-p1"><div class="tc-stick-base"><div class="tc-stick-thumb"></div></div></div>
                <button class="tc-btn tc-attack tc-p1" type="button" aria-label="Ladybug attack">🐞</button>
                <div class="tc-stick-zone tc-p2"><div class="tc-stick-base"><div class="tc-stick-thumb"></div></div></div>
                <button class="tc-btn tc-attack tc-p2" type="button" aria-label="Cat Noir attack">🐾</button>
            </div>
            <button class="tc-pause" type="button" aria-label="Pause"><span></span><span></span></button>
            <div class="tc-rotate">
                <div class="tc-rotate-icon">📱</div>
                <div>Turn your phone sideways to play!</div>
            </div>
        `;
        document.body.appendChild(root);
        this.root = root;
        this.phone = isPhone();
        root.classList.toggle('phone', this.phone);
        // Two players default on a tablet/computer (the co-op is the point); phones are 1P only.
        this.selected = this.phone ? 1 : 2;
        this.menuButtons = [...root.querySelectorAll('.tc-menu-btn')];
        this._paintSelection();
        // The menu shows on every device; joysticks/buttons only once touch is in use.
        root.classList.add('visible');

        this.sticks = [
            new Stick(root.querySelector('.tc-stick-zone.tc-p1'), input, KEYS.ladybug),
            new Stick(root.querySelector('.tc-stick-zone.tc-p2'), input, KEYS.catnoir),
        ];
        this._bindAttack(root.querySelector('.tc-attack.tc-p1'), KEYS.ladybug.attack);
        this._bindAttack(root.querySelector('.tc-attack.tc-p2'), KEYS.catnoir.attack);

        for (const btn of root.querySelectorAll('.tc-menu-btn')) {
            // `click` (not pointerdown) so it counts as a user gesture for fullscreen + audio.
            btn.addEventListener('click', (e) => {
                const n = Number(btn.dataset.players);
                btn.blur(); // so a later SPACE press doesn't "click" it again
                this.selected = n;
                this._paintSelection();
                if (e.pointerType !== 'mouse' && this.touch) requestFullscreenLandscape();
                onStart?.(n);
            });
            btn.addEventListener('pointerenter', (e) => {
                if (e.pointerType === 'mouse') {
                    this.selected = Number(btn.dataset.players);
                    this._paintSelection();
                }
            });
        }

        const pauseBtn = root.querySelector('.tc-pause');
        pauseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        pauseBtn.addEventListener('click', () => onPause?.());

        // Tapping the game itself = "continue" (Try Again / Play Again / resume from pause).
        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            this.show();
            this.input.pulse('Tap');
        });

        document.addEventListener('contextmenu', (e) => {
            if (this.touch) e.preventDefault();
        });

        // A touch on a laptop with a touchscreen reveals the controls on demand.
        window.addEventListener('touchstart', () => this.show(), { passive: true, once: true });
        // Releasing everything when the page is hidden avoids "stuck" directions on return.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.sticks.forEach((s) => s.release());
        });
    }

    /** Show the touch controls now if this is a touch device. Call once the game is set up. */
    autoShow() {
        if (isTouchDevice()) this.show();
        this.layout();
    }

    show() {
        if (this.touch) return;
        this.touch = true;
        this.root.classList.add('touch');
        this.onShow?.();
        this.layout();
    }

    /** Keyboard menu navigation: -1 / +1 moves the highlight between 1P and 2P. */
    moveSelection(dir) {
        if (this.phone) return;
        this.selected = Math.min(2, Math.max(1, this.selected + dir));
        this._paintSelection();
    }

    get selectedPlayers() {
        return this.phone ? 1 : this.selected;
    }

    _paintSelection() {
        for (const b of this.menuButtons) {
            b.classList.toggle('selected', Number(b.dataset.players) === this.selected);
        }
    }

    /** Track the canvas rectangle so menu/pause chrome lines up with the game art. */
    layout() {
        const r = this.canvas.getBoundingClientRect();
        const s = this.root.style;
        s.setProperty('--cv-left', r.left + 'px');
        s.setProperty('--cv-top', r.top + 'px');
        s.setProperty('--cv-w', r.width + 'px');
        s.setProperty('--cv-h', r.height + 'px');
    }

    /** Called every tick by the game so the right chrome shows for the current screen. */
    sync(screen, players, paused) {
        const d = this.root.dataset;
        if (d.screen !== screen) {
            d.screen = screen;
            if (screen === 'title' || screen === 'victory') this.sticks.forEach((s) => s.release());
        }
        const p = String(players);
        if (d.players !== p) d.players = p;
        const pz = paused ? '1' : '0';
        if (d.paused !== pz) d.paused = pz;
    }

    _bindAttack(btn, code) {
        const press = (e) => {
            e.preventDefault();
            btn.setPointerCapture?.(e.pointerId);
            btn.classList.add('pressed');
            this.input.setVirtual(code, true);
            this.input.pulse('Tap'); // also works as "continue" on Game Over / Victory
        };
        const release = () => {
            btn.classList.remove('pressed');
            this.input.setVirtual(code, false);
        };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('lostpointercapture', release);
    }
}
