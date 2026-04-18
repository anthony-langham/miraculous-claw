export class Enemy {
    constructor(x, y, type = 'regular', speed = 1) {
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 60;
        this.speed = speed;
        this.type = type; // 'regular', 'timebreaker', or 'antibug'
        this.isBoss = type === 'timebreaker' || type === 'antibug';
        this.facing = -1;
        this.frame = 0;
        this.animTimer = 0;
        this.state = 'wander';
        this.health = this.isBoss ? 5 : 2;
        this.maxHealth = this.health;
        this.stunTimer = 0;
        this.purified = false;
        this.purifyTimer = 0;
        this.wanderTimer = 0;
        this.wanderDirX = 0;
        this.wanderDirY = 0;
        this.aggroRange = this.isBoss ? 300 : 350;
        this.attackRange = this.isBoss ? 50 : 40;
        this.attackCooldown = 0;
        this.flashTimer = 0;
        this.hurtTimer = 0;
        this.dormant = 0; // dormant timer for delayed spawns

        this.colorScheme = this._randomScheme();

        // Boss specific
        this.bossPhase = 'idle';
        this.chargeDir = 1;
        this.chargeTimer = 0;
        this.pauseTimer = 0;
    }

    _randomScheme() {
        const schemes = [
            { body: '#7B1FA2', dark: '#4A148C', accent: '#CE93D8' },
            { body: '#6A1B9A', dark: '#38006b', accent: '#BA68C8' },
            { body: '#8E24AA', dark: '#5C007A', accent: '#E040FB' },
            { body: '#5E35B1', dark: '#280680', accent: '#B388FF' },
        ];
        return schemes[Math.floor(Math.random() * schemes.length)];
    }

    update(playerX, playerY, levelWidth) {
        if (this.purified) {
            this.purifyTimer++;
            return;
        }

        if (this.dormant > 0) {
            this.dormant--;
            return;
        }

        this.animTimer++;
        if (this.animTimer % 10 === 0) this.frame = (this.frame + 1) % 4;

        if (this.hurtTimer > 0) this.hurtTimer--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.flashTimer > 0) this.flashTimer--;

        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.state = 'stunned';
            return;
        }

        if (this.isBoss) {
            this._updateBoss(playerX, playerY, levelWidth);
            return;
        }

        // Regular enemy AI
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.aggroRange) {
            this.state = 'chase';
            const moveX = Math.sign(dx) * this.speed;
            const moveY = Math.sign(dy) * this.speed * 0.5;
            this.x += moveX;
            this.y += moveY;
            this.facing = dx > 0 ? 1 : -1;
        } else {
            this.state = 'wander';
            this.wanderTimer--;
            if (this.wanderTimer <= 0) {
                this.wanderDirX = (Math.random() - 0.5) * 2;
                this.wanderDirY = (Math.random() - 0.5) * 2;
                this.wanderTimer = 60 + Math.random() * 120;
            }
            this.x += this.wanderDirX * this.speed * 0.3;
            this.y += this.wanderDirY * this.speed * 0.2;
            if (this.wanderDirX !== 0) this.facing = this.wanderDirX > 0 ? 1 : -1;
        }

        this.x = Math.max(30, Math.min(levelWidth - 30, this.x));
        this.y = Math.max(470, Math.min(650, this.y));
    }

    _updateBoss(playerX, playerY, levelWidth) {
        switch (this.bossPhase) {
            case 'idle':
                this.facing = playerX > this.x ? 1 : -1;
                this.flashTimer = 45;
                this.bossPhase = 'charge';
                this.chargeDir = this.facing;
                this.chargeTimer = 40;
                break;

            case 'charge':
                this.x += this.chargeDir * this.speed * 2.5;
                this.chargeTimer--;
                if (this.chargeTimer <= 0 || this.x < 50 || this.x > levelWidth - 50) {
                    this.bossPhase = 'pause';
                    this.pauseTimer = 120;
                    this.stunTimer = 0;
                }
                this.x = Math.max(30, Math.min(levelWidth - 30, this.x));
                break;

            case 'pause':
                this.pauseTimer--;
                this.state = 'stunned';
                if (this.pauseTimer <= 0) {
                    this.bossPhase = 'idle';
                }
                break;

            case 'defeated':
                this.state = 'stunned';
                break;
        }

        this.y = Math.max(470, Math.min(650, this.y));
    }

    takeDamage() {
        if (this.purified || this.hurtTimer > 0) return false;

        this.health--;
        this.hurtTimer = 15;

        if (this.health <= 0) {
            if (this.isBoss) {
                this.bossPhase = 'defeated';
            }
            this.stunTimer = 999;
            return true;
        }

        this.stunTimer = 20;
        return false;
    }

    purify() {
        this.purified = true;
        this.state = 'purified';
    }

    canBePurified() {
        return this.health <= 0 && !this.purified;
    }

    getHitBox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height,
            width: this.width,
            height: this.height
        };
    }

    getDamageBox() {
        if (this.purified || this.stunTimer > 0 || this.dormant > 0) return null;
        if (this.isBoss && this.bossPhase === 'charge') {
            return {
                x: this.x - 25,
                y: this.y - 50,
                width: 50,
                height: 50
            };
        }
        return {
            x: this.x - 15,
            y: this.y - 40,
            width: 30,
            height: 40
        };
    }

    draw(ctx) {
        if (this.dormant > 0) return; // Don't draw dormant enemies

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.purified) {
            ctx.globalAlpha = Math.max(0, 1 - this.purifyTimer / 60);
            if (this.purifyTimer > 60) { ctx.restore(); return; }
        }

        const f = this.facing;
        ctx.save();
        if (f === -1) ctx.scale(-1, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hurt flash
        if (this.hurtTimer > 0 && this.hurtTimer % 4 < 2) {
            ctx.fillStyle = '#FFF';
            ctx.fillRect(-15, -60, 30, 62);
            ctx.restore();
            ctx.restore();
            return;
        }

        const bob = Math.sin(this.animTimer * 0.1) * 1;

        if (this.type === 'timebreaker') {
            this._drawTimebreaker(ctx, bob);
        } else if (this.type === 'antibug') {
            this._drawAntibug(ctx, bob);
        } else {
            this._drawRegular(ctx, bob);
        }

        // Purple aura
        if (!this.purified && !this.canBePurified()) {
            ctx.globalAlpha = 0.3 + Math.sin(this.animTimer * 0.1) * 0.15;
            ctx.fillStyle = this.type === 'antibug' ? '#F44336' : '#9C27B0';
            ctx.beginPath();
            ctx.ellipse(0, -30, 25, 35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Stunned stars
        if (this.canBePurified()) {
            for (let i = 0; i < 3; i++) {
                const angle = this.animTimer * 0.05 + (i * Math.PI * 2 / 3);
                const sx = Math.cos(angle) * 15;
                const sy = -65 + Math.sin(angle * 2) * 5;
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Flash before boss charges
        if (this.isBoss && this.flashTimer > 0) {
            ctx.globalAlpha = (this.flashTimer / 30) * 0.4;
            ctx.fillStyle = this.type === 'antibug' ? '#F00' : '#FF0';
            ctx.fillRect(-20, -65, 40, 67);
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Boss health bar
        if (this.isBoss && !this.purified) {
            const barWidth = 50;
            const barHeight = 6;
            const ratio = this.health / this.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(-barWidth / 2, -75, barWidth, barHeight);
            ctx.fillStyle = ratio > 0.3 ? '#4CAF50' : '#FF5722';
            ctx.fillRect(-barWidth / 2, -75, barWidth * ratio, barHeight);
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1;
            ctx.strokeRect(-barWidth / 2, -75, barWidth, barHeight);
        }

        ctx.restore();
    }

    _drawRegular(ctx, bob) {
        const c = this.colorScheme;
        const legAnim = this.state === 'chase' ? Math.sin(this.animTimer * 0.2) * 4 : 0;

        ctx.fillStyle = c.dark;
        ctx.fillRect(-8, -8 + bob, 7, 10);
        ctx.fillRect(2, -8 + bob, 7, 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(-8, 0 + bob + legAnim, 8, 4);
        ctx.fillRect(2, 0 + bob - legAnim, 8, 4);

        ctx.fillStyle = c.body;
        ctx.fillRect(-11, -35 + bob, 22, 28);

        const armSwing = this.state === 'chase' ? Math.sin(this.animTimer * 0.2) * 3 : 0;
        ctx.fillStyle = c.body;
        ctx.fillRect(-15, -30 + bob + armSwing, 5, 18);
        ctx.fillRect(10, -30 + bob - armSwing, 5, 18);

        ctx.fillStyle = '#D7CCC8';
        ctx.fillRect(-9, -50 + bob, 18, 17);

        ctx.fillStyle = '#FFF';
        ctx.fillRect(-7, -46 + bob, 5, 5);
        ctx.fillRect(2, -46 + bob, 5, 5);
        ctx.fillStyle = '#E040FB';
        ctx.fillRect(-6, -45 + bob, 4, 4);
        ctx.fillRect(3, -45 + bob, 4, 4);

        ctx.fillStyle = c.dark;
        ctx.fillRect(-7, -48 + bob, 6, 2);
        ctx.fillRect(2, -48 + bob, 6, 2);

        ctx.fillStyle = '#333';
        ctx.fillRect(-3, -38 + bob, 6, 2);
    }

    _drawTimebreaker(ctx, bob) {
        const charging = this.bossPhase === 'charge';
        const legAnim = charging ? Math.sin(this.animTimer * 0.4) * 6 : Math.sin(this.animTimer * 0.15) * 2;

        ctx.fillStyle = '#90CAF9';
        ctx.fillRect(-10, 0, 10, 5);
        ctx.fillRect(2, 0, 10, 5);
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(-7, 5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-2, 5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, 5, 2, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(-9, -12 + bob + legAnim, 8, 14);
        ctx.fillRect(2, -12 + bob - legAnim, 8, 14);

        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(-13, -42 + bob, 26, 32);
        ctx.fillStyle = '#111';
        ctx.fillRect(-2, -42 + bob, 4, 32);

        ctx.fillStyle = '#2E7D32';
        if (charging) {
            ctx.fillRect(-17, -32 + bob, 5, 14);
            ctx.fillRect(12, -32 + bob, 5, 14);
        } else {
            ctx.fillRect(-17, -36 + bob, 5, 18);
            ctx.fillRect(12, -36 + bob, 5, 18);
        }

        ctx.fillStyle = '#FFCC80';
        ctx.fillRect(-10, -58 + bob, 20, 18);

        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(-11, -62 + bob, 22, 10);
        ctx.fillStyle = '#80CBC4';
        ctx.fillRect(-8, -56 + bob, 16, 6);

        ctx.fillStyle = '#F44336';
        ctx.fillRect(-5, -54 + bob, 4, 3);
        ctx.fillRect(2, -54 + bob, 4, 3);

        if (charging) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#B2FF59';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const ly = -40 + i * 15 + bob;
                ctx.beginPath();
                ctx.moveTo(-20, ly);
                ctx.lineTo(-40 - Math.random() * 20, ly);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }

    _drawAntibug(ctx, bob) {
        const charging = this.bossPhase === 'charge';
        const legAnim = charging ? Math.sin(this.animTimer * 0.4) * 6 : Math.sin(this.animTimer * 0.15) * 2;

        // Legs (black suit with red accents - inverse Ladybug)
        ctx.fillStyle = '#111';
        ctx.fillRect(-8, -8 + bob, 11, 12);
        ctx.fillRect(2, -8 + bob, 11, 12);
        ctx.fillStyle = '#B71C1C';
        ctx.fillRect(-8, 2 + bob + legAnim, 9, 4);
        ctx.fillRect(2, 2 + bob - legAnim, 9, 4);

        // Body (black suit with red spots - inverse of Ladybug)
        ctx.fillStyle = '#111';
        const bodyTop = -42 + bob;
        ctx.fillRect(-13, bodyTop, 26, 34);

        // Red spots (inverse of Ladybug's black spots)
        ctx.fillStyle = '#F44336';
        ctx.beginPath(); ctx.arc(-5, bodyTop + 10, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, bodyTop + 18, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-3, bodyTop + 25, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, bodyTop + 8, 2, 0, Math.PI * 2); ctx.fill();

        // Belt
        ctx.fillStyle = '#B71C1C';
        ctx.fillRect(-13, bodyTop + 30, 26, 3);

        // Arms
        ctx.fillStyle = '#111';
        const armSwing = charging ? 0 : Math.sin(this.animTimer * 0.15) * 3;
        if (charging) {
            ctx.fillRect(-17, bodyTop + 8, 5, 14);
            ctx.fillRect(12, bodyTop + 8, 5, 14);
        } else {
            ctx.fillRect(-17, bodyTop + 8 + armSwing, 5, 18);
            ctx.fillRect(12, bodyTop + 8 - armSwing, 5, 18);
        }

        // Head
        ctx.fillStyle = '#FFCC80';
        const headY = bodyTop - 16;
        ctx.fillRect(-9, headY, 18, 17);

        // Hair (dark red/maroon, short spiky)
        ctx.fillStyle = '#880E4F';
        ctx.fillRect(-10, headY - 3, 20, 7);
        ctx.fillRect(-11, headY - 1, 3, 6);
        ctx.fillRect(8, headY - 1, 3, 6);
        // Spiky fringe
        ctx.beginPath();
        ctx.moveTo(-6, headY + 2);
        ctx.lineTo(-3, headY - 5);
        ctx.lineTo(0, headY + 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(2, headY + 2);
        ctx.lineTo(5, headY - 4);
        ctx.lineTo(8, headY + 2);
        ctx.fill();

        // Mask (black)
        ctx.fillStyle = '#111';
        ctx.fillRect(-8, headY + 4, 16, 6);
        // Red mask spots
        ctx.fillStyle = '#F44336';
        ctx.beginPath(); ctx.arc(-4, headY + 7, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, headY + 7, 1.5, 0, Math.PI * 2); ctx.fill();

        // Eyes (angry red)
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-6, headY + 5, 5, 5);
        ctx.fillRect(2, headY + 5, 5, 5);
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-5, headY + 6, 3, 3);
        ctx.fillRect(3, headY + 6, 3, 3);

        // Evil smirk
        ctx.fillStyle = '#C62828';
        ctx.fillRect(-3, headY + 12, 6, 2);

        // Red energy when charging
        if (charging) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#F44336';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const ly = -40 + i * 15 + bob;
                ctx.beginPath();
                ctx.moveTo(-20, ly);
                ctx.lineTo(-40 - Math.random() * 20, ly);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }
}
