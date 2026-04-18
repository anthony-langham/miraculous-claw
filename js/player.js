const KEY_MAPS = {
    ladybug: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        up: 'ArrowUp',
        down: 'ArrowDown',
        attack: 'ShiftRight',
    },
    catnoir: {
        left: 'KeyA',
        right: 'KeyD',
        up: 'KeyW',
        down: 'KeyS',
        attack: 'KeyF',
    },
};

export class Player {
    constructor(x, y, character = 'ladybug') {
        this.x = x;
        this.y = y;
        this.character = character;
        this.keys = KEY_MAPS[character];
        this.width = 40;
        this.height = 64;
        this.speed = 3;
        this.facing = 1;
        this.frame = 0;
        this.animTimer = 0;
        this.state = 'idle';
        this.attacking = false;
        this.attackTimer = 0;
        this.attackDuration = 20;
        this.attackCooldown = 0;
        this.health = 5;
        this.maxHealth = 5;
        this.invincible = 0;
        this.score = 0;
        this.extraLifeThreshold = 2000;
        this.hasPowerup = false;
        this.usingPowerup = false;
        this.vx = 0;
        this.vy = 0;
    }

    update(input, levelWidth) {
        this.vx = 0;
        this.vy = 0;

        if (!this.attacking) {
            if (input.isDown(this.keys.left)) { this.vx = -this.speed; this.facing = -1; }
            if (input.isDown(this.keys.right)) { this.vx = this.speed; this.facing = 1; }
            if (input.isDown(this.keys.up)) this.vy = -this.speed * 0.7;
            if (input.isDown(this.keys.down)) this.vy = this.speed * 0.7;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.x = Math.max(20, Math.min(levelWidth - 20, this.x));
        this.y = Math.max(470, Math.min(650, this.y));

        if (this.attackCooldown > 0) this.attackCooldown--;

        if (input.isJustPressed(this.keys.attack) && !this.attacking && this.attackCooldown <= 0) {
            this.attacking = true;
            if (this.hasPowerup) {
                this.usingPowerup = true;
                this.hasPowerup = false;
                this.attackTimer = 35; // longer super attack
            } else {
                this.usingPowerup = false;
                this.attackTimer = this.attackDuration;
            }
        }

        if (this.attacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.attacking = false;
                this.usingPowerup = false;
                this.attackCooldown = 8;
            }
        }

        if (this.vx !== 0 || this.vy !== 0) {
            this.state = 'walk';
            this.animTimer++;
            if (this.animTimer % 8 === 0) this.frame = (this.frame + 1) % 4;
        } else {
            this.state = 'idle';
            this.animTimer++;
            if (this.animTimer % 20 === 0) this.frame = (this.frame + 1) % 2;
        }

        if (this.attacking) this.state = 'attack';
        if (this.invincible > 0) this.invincible--;
    }

    takeDamage() {
        if (this.invincible > 0) return false;
        this.health--;
        this.invincible = 90;
        return true;
    }

    addScore(pts) {
        this.score += pts;
        if (this.score >= this.extraLifeThreshold) {
            this.health = Math.min(this.health + 1, this.maxHealth);
            this.extraLifeThreshold += 2000;
        }
    }

    getAttackBox() {
        const dur = this.usingPowerup ? 35 : this.attackDuration;
        if (!this.attacking || this.attackTimer < dur - 8) return null;
        const reach = this.usingPowerup ? 150 : 35;
        const h = this.usingPowerup ? 80 : 40;
        return {
            x: this.facing === 1 ? this.x + 10 : this.x - reach - 10,
            y: this.y - h / 2,
            width: reach,
            height: h
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.save();
        if (this.facing === -1) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.character === 'catnoir') {
            this._drawCatNoir(ctx);
        } else {
            this._drawLadybug(ctx);
        }

        // Super attack visual
        if (this.usingPowerup && this.attacking) {
            this._drawSuperAttack(ctx);
        }

        // Powerup glow when charged
        if (this.hasPowerup) {
            const glowColor = this.character === 'ladybug' ? '#E91E63' : '#76FF03';
            ctx.globalAlpha = 0.25 + Math.sin(this.animTimer * 0.15) * 0.15;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.ellipse(0, -25, 25, 40, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
        ctx.restore();
    }

    _drawSuperAttack(ctx) {
        const dur = 35;
        const prog = 1 - (this.attackTimer / dur);
        const extend = Math.sin(prog * Math.PI) * 140;

        if (this.character === 'ladybug') {
            // Lucky Charm - pink/red magical energy wave with spots
            ctx.globalAlpha = 0.7 * (1 - prog);
            // Main energy beam
            const grd = ctx.createLinearGradient(15, 0, 15 + extend, 0);
            grd.addColorStop(0, '#E91E63');
            grd.addColorStop(0.5, '#FF80AB');
            grd.addColorStop(1, 'rgba(233,30,99,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(10, -35, extend, 40);
            // Sparkle spots
            ctx.fillStyle = '#FFF';
            for (let i = 0; i < 6; i++) {
                const sx = 20 + (extend * i / 6);
                const sy = -30 + Math.sin(prog * 10 + i * 2) * 15;
                ctx.beginPath();
                ctx.arc(sx, sy, 3 + Math.sin(prog * 5 + i) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // Ladybug spots in the beam
            ctx.fillStyle = '#C2185B';
            for (let i = 0; i < 4; i++) {
                const sx = 30 + (extend * 0.7 * i / 4);
                const sy = -20 + Math.sin(prog * 8 + i * 3) * 10;
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else {
            // Cataclysm - green/black destructive energy
            ctx.globalAlpha = 0.7 * (1 - prog);
            // Dark energy core
            const grd = ctx.createLinearGradient(15, 0, 15 + extend, 0);
            grd.addColorStop(0, '#111');
            grd.addColorStop(0.3, '#4CAF50');
            grd.addColorStop(0.7, '#76FF03');
            grd.addColorStop(1, 'rgba(17,17,17,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(10, -35, extend, 40);
            // Crackling energy bolts
            ctx.strokeStyle = '#76FF03';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const sx = 20 + (extend * i / 5);
                ctx.beginPath();
                ctx.moveTo(sx, -30);
                ctx.lineTo(sx + 8, -15 + Math.sin(prog * 12 + i * 4) * 10);
                ctx.lineTo(sx + 3, -10);
                ctx.stroke();
            }
            // Dark particles
            ctx.fillStyle = '#111';
            for (let i = 0; i < 4; i++) {
                const sx = 25 + (extend * 0.8 * i / 4);
                const sy = -25 + Math.sin(prog * 6 + i * 2) * 12;
                ctx.fillRect(sx - 3, sy - 3, 6, 6);
            }
            ctx.globalAlpha = 1;
        }
    }

    _drawLadybug(ctx) {
        const walkBob = this.state === 'walk' ? Math.sin(this.animTimer * 0.3) * 2 : 0;
        const idleBob = this.state === 'idle' ? Math.sin(this.animTimer * 0.05) * 1 : 0;
        const bob = walkBob + idleBob;
        const legAnim = this.state === 'walk' ? Math.sin(this.animTimer * 0.3) * 5 : 0;
        const s = 3;

        // Legs
        ctx.fillStyle = '#E53935';
        ctx.fillRect(-8, -8 + bob, 7 * s - 10, 4 * s);
        ctx.fillRect(2, -8 + bob, 7 * s - 10, 4 * s);
        ctx.fillStyle = '#C62828';
        ctx.fillRect(-8, -8 + 4 * s - 2 + bob + legAnim, 9, 4);
        ctx.fillRect(2, -8 + 4 * s - 2 + bob - legAnim, 9, 4);

        // Body
        ctx.fillStyle = '#E53935';
        const bodyTop = -35 + bob;
        ctx.fillRect(-10, bodyTop, 20, 28);

        // Black spots
        ctx.fillStyle = '#212121';
        ctx.beginPath(); ctx.arc(-4, bodyTop + 8, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, bodyTop + 14, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-2, bodyTop + 20, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, bodyTop + 6, 1.5, 0, Math.PI * 2); ctx.fill();

        // Belt (yo-yo)
        ctx.fillStyle = '#111';
        ctx.fillRect(-10, bodyTop + 24, 20, 3);
        ctx.fillStyle = '#E53935';
        ctx.beginPath(); ctx.arc(8, bodyTop + 25, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(8, bodyTop + 25, 1.5, 0, Math.PI * 2); ctx.fill();

        // Arms
        ctx.fillStyle = '#E53935';
        const armSwing = this.state === 'walk' ? Math.sin(this.animTimer * 0.3 + Math.PI) * 4 : 0;

        if (this.state === 'attack') {
            const attackProg = 1 - (this.attackTimer / this.attackDuration);
            const extend = Math.sin(attackProg * Math.PI) * 25;
            ctx.fillRect(-14, bodyTop + 6, 5, 16);
            ctx.fillRect(9, bodyTop + 4, extend + 6, 8);
            if (extend > 10) {
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.arc(15 + extend, bodyTop + 8, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(15 + extend, bodyTop + 8, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#111';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(11, bodyTop + 8);
                ctx.lineTo(15 + extend, bodyTop + 8);
                ctx.stroke();
            }
        } else {
            ctx.fillRect(-14, bodyTop + 6 + armSwing, 5, 16);
            ctx.fillRect(9, bodyTop + 6 - armSwing, 5, 16);
        }

        // Head
        ctx.fillStyle = '#FFCC80';
        const headY = bodyTop - 14;
        ctx.fillRect(-8, headY, 16, 16);

        // Hair (blue-black pigtails)
        ctx.fillStyle = '#1A237E';
        ctx.fillRect(-9, headY - 3, 18, 7);
        ctx.fillRect(-13, headY - 1, 5, 12);
        ctx.fillRect(8, headY - 1, 5, 12);
        ctx.fillStyle = '#E53935';
        ctx.fillRect(-13, headY + 8, 5, 3);
        ctx.fillRect(8, headY + 8, 5, 3);

        // Mask
        ctx.fillStyle = '#E53935';
        ctx.fillRect(-7, headY + 4, 14, 5);
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-4, headY + 6, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, headY + 6, 1.5, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-6, headY + 5, 4, 4);
        ctx.fillRect(2, headY + 5, 4, 4);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(-5, headY + 6, 3, 3);
        ctx.fillRect(3, headY + 6, 3, 3);

        // Smile
        ctx.fillStyle = '#E57373';
        ctx.fillRect(-2, headY + 11, 4, 2);
    }

    _drawCatNoir(ctx) {
        const walkBob = this.state === 'walk' ? Math.sin(this.animTimer * 0.3) * 2 : 0;
        const idleBob = this.state === 'idle' ? Math.sin(this.animTimer * 0.05) * 1 : 0;
        const bob = walkBob + idleBob;
        const legAnim = this.state === 'walk' ? Math.sin(this.animTimer * 0.3) * 5 : 0;

        // Tail (behind body)
        ctx.fillStyle = '#222';
        const tailWag = Math.sin(this.animTimer * 0.1) * 8;
        ctx.save();
        ctx.translate(-8, -12 + bob);
        ctx.rotate((-0.3 + Math.sin(this.animTimer * 0.08) * 0.15));
        ctx.fillRect(-2, 0, 3, 22);
        // Tail tip
        ctx.beginPath();
        ctx.arc(0, 22, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Legs (black suit)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-8, -8 + bob, 11, 12);
        ctx.fillRect(2, -8 + bob, 11, 12);
        // Boots
        ctx.fillStyle = '#111';
        ctx.fillRect(-8, 2 + bob + legAnim, 9, 4);
        ctx.fillRect(2, 2 + bob - legAnim, 9, 4);

        // Body (black suit)
        ctx.fillStyle = '#1a1a1a';
        const bodyTop = -35 + bob;
        ctx.fillRect(-10, bodyTop, 20, 28);

        // Green paw print on chest
        ctx.fillStyle = '#4CAF50';
        // Paw pad
        ctx.beginPath(); ctx.arc(0, bodyTop + 10, 4, 0, Math.PI * 2); ctx.fill();
        // Paw toes
        ctx.beginPath(); ctx.arc(-4, bodyTop + 5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, bodyTop + 3, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, bodyTop + 5, 2, 0, Math.PI * 2); ctx.fill();

        // Belt (tail belt)
        ctx.fillStyle = '#333';
        ctx.fillRect(-10, bodyTop + 24, 20, 3);
        // Bell on belt
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(0, bodyTop + 25, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFA000';
        ctx.fillRect(-0.5, bodyTop + 25, 1, 3);

        // Arms
        ctx.fillStyle = '#1a1a1a';
        const armSwing = this.state === 'walk' ? Math.sin(this.animTimer * 0.3 + Math.PI) * 4 : 0;

        if (this.state === 'attack') {
            const attackProg = 1 - (this.attackTimer / this.attackDuration);
            const extend = Math.sin(attackProg * Math.PI) * 25;
            // Back arm
            ctx.fillRect(-14, bodyTop + 6, 5, 16);
            // Attack arm with claw swipe
            ctx.fillRect(9, bodyTop + 4, extend + 6, 8);
            if (extend > 8) {
                // Claw marks (green energy)
                ctx.strokeStyle = '#76FF03';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(14 + extend, bodyTop + 2 + i * 5);
                    ctx.lineTo(20 + extend, bodyTop + 6 + i * 5);
                    ctx.stroke();
                }
                // Green glow on hand
                ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
                ctx.beginPath();
                ctx.arc(14 + extend, bodyTop + 8, 7, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillRect(-14, bodyTop + 6 + armSwing, 5, 16);
            ctx.fillRect(9, bodyTop + 6 - armSwing, 5, 16);
        }

        // Gloves (clawed)
        ctx.fillStyle = '#111';
        if (this.state !== 'attack') {
            ctx.fillRect(-15, bodyTop + 18 + armSwing, 7, 5);
            ctx.fillRect(8, bodyTop + 18 - armSwing, 7, 5);
        }

        // Head
        ctx.fillStyle = '#FFCC80';
        const headY = bodyTop - 14;
        ctx.fillRect(-8, headY, 16, 16);

        // Hair (blonde, messy/spiky)
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(-10, headY - 4, 20, 8);
        // Spiky bits
        ctx.fillRect(-12, headY - 2, 4, 5);
        ctx.fillRect(8, headY - 2, 4, 5);
        // Fringe spikes
        ctx.beginPath();
        ctx.moveTo(-8, headY + 2);
        ctx.lineTo(-5, headY - 5);
        ctx.lineTo(-2, headY + 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, headY + 2);
        ctx.lineTo(3, headY - 6);
        ctx.lineTo(6, headY + 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(4, headY + 1);
        ctx.lineTo(8, headY - 4);
        ctx.lineTo(10, headY + 2);
        ctx.fill();

        // Cat ears
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(-8, headY - 1);
        ctx.lineTo(-11, headY - 10);
        ctx.lineTo(-4, headY - 3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, headY - 1);
        ctx.lineTo(11, headY - 10);
        ctx.lineTo(4, headY - 3);
        ctx.fill();
        // Inner ear (green)
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(-7, headY - 1);
        ctx.lineTo(-10, headY - 8);
        ctx.lineTo(-5, headY - 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(7, headY - 1);
        ctx.lineTo(10, headY - 8);
        ctx.lineTo(5, headY - 2);
        ctx.fill();

        // Mask (black)
        ctx.fillStyle = '#111';
        ctx.fillRect(-7, headY + 4, 14, 5);

        // Eyes (green cat eyes)
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(-6, headY + 5, 4, 4);
        ctx.fillRect(2, headY + 5, 4, 4);
        // Cat pupils (vertical slits)
        ctx.fillStyle = '#111';
        ctx.fillRect(-4.5, headY + 5, 1.5, 4);
        ctx.fillRect(3.5, headY + 5, 1.5, 4);

        // Smirk
        ctx.fillStyle = '#E57373';
        ctx.fillRect(-1, headY + 11, 4, 2);

        // Bell necklace
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, bodyTop - 2 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA000';
        ctx.fillRect(-0.5, bodyTop - 1 + bob, 1, 3);
    }
}
