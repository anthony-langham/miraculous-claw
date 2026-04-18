class Particle {
    constructor(x, y, vx, vy, life, color, size, type = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.type = type;
        this.text = '';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity for some particles
        this.life--;
        this.rotation += this.rotSpeed;
    }

    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }

    get dead() {
        return this.life <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (this.type === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'butterfly') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            // Left wing
            ctx.beginPath();
            ctx.ellipse(-4, 0, 6 * this.alpha, 4 * this.alpha, -0.3, 0, Math.PI * 2);
            ctx.fill();
            // Right wing
            ctx.beginPath();
            ctx.ellipse(4, 0, 6 * this.alpha, 4 * this.alpha, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillStyle = '#FFF';
            ctx.fillRect(-1, -3, 2, 6);
        } else if (this.type === 'text') {
            ctx.fillStyle = this.color;
            ctx.font = `bold ${this.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'star') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            this._drawStar(ctx, 0, 0, 5, this.size * this.alpha, this.size * 0.5 * this.alpha);
        }

        ctx.restore();
    }

    _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerR);
        ctx.closePath();
        ctx.fill();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emitPurify(x, y) {
        // White butterflies flying up
        for (let i = 0; i < 5; i++) {
            const p = new Particle(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 2,
                -1 - Math.random() * 2,
                80 + Math.random() * 40,
                '#FFFFFF',
                5,
                'butterfly'
            );
            p.vy = -1.5 - Math.random();
            this.particles.push(p);
        }

        // Pink and white sparkles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                30 + Math.random() * 30,
                Math.random() > 0.5 ? '#FF80AB' : '#FFFFFF',
                3 + Math.random() * 4,
                'star'
            ));
        }

        // Magic circle burst
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                25,
                '#E91E63',
                5,
                'circle'
            ));
        }
    }

    emitHit(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                15 + Math.random() * 10,
                Math.random() > 0.5 ? '#FFD54F' : '#FFFFFF',
                2 + Math.random() * 3,
                'star'
            ));
        }
    }

    emitScore(x, y, points) {
        const p = new Particle(x, y, 0, -1.5, 60, '#FFD700', 18, 'text');
        p.text = `+${points}`;
        p.vy = -1;
        this.particles.push(p);
    }

    emitDamage(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                20,
                '#FF1744',
                3 + Math.random() * 3,
                'circle'
            ));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(-cameraX, 0);
            p.draw(ctx);
            ctx.restore();
        }
    }

    drawScreenSpace(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }

    clear() {
        this.particles = [];
    }
}
