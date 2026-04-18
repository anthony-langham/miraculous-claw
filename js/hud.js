export class HUD {
    constructor() {
        this.messageText = '';
        this.messageTimer = 0;
        this.messageColor = '#FFF';
    }

    showMessage(text, duration = 120, color = '#FFF') {
        this.messageText = text;
        this.messageTimer = duration;
        this.messageColor = color;
    }

    update() {
        if (this.messageTimer > 0) this.messageTimer--;
    }

    draw(ctx, players, levelName, canvasWidth, cheatMode = false) {
        ctx.save();

        // Top bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvasWidth, 40);

        // Cheat mode indicator
        if (cheatMode) {
            ctx.fillStyle = '#76FF03';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('INVINCIBLE MODE', canvasWidth / 2, 38);
        }

        // P1 (Ladybug) hearts - left side
        const p1 = players[0];
        ctx.fillStyle = '#E53935';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('LADYBUG', 10, 10);
        for (let i = 0; i < p1.maxHealth; i++) {
            const hx = 15 + i * 22;
            const hy = 26;
            this._drawHeart(ctx, hx, hy, i < p1.health ? '#E53935' : '#555');
        }
        // Powerup indicator for P1
        if (p1.hasPowerup) {
            const px = 15 + p1.maxHealth * 22 + 10;
            ctx.fillStyle = '#E91E63';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('LUCKY CHARM!', px, 28);
        }

        // P2 (Cat Noir) hearts - right side
        if (players.length > 1) {
            const p2 = players[1];
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('CAT NOIR', canvasWidth - 10, 10);
            for (let i = 0; i < p2.maxHealth; i++) {
                const hx = canvasWidth - 15 - (p2.maxHealth - 1 - i) * 22;
                const hy = 26;
                this._drawHeart(ctx, hx, hy, i < p2.health ? '#4CAF50' : '#555');
            }
            // Powerup indicator for P2
            if (p2.hasPowerup) {
                const px = canvasWidth - 15 - p2.maxHealth * 22 - 10;
                ctx.fillStyle = '#76FF03';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'right';
                ctx.fillText('CATACLYSM!', px, 28);
            }
        }

        // Score (combined, center)
        const totalScore = players.reduce((sum, p) => sum + p.score, 0);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${totalScore}`, canvasWidth / 2, 16);

        // Level name
        ctx.fillStyle = '#FFF';
        ctx.font = '10px monospace';
        ctx.fillText(levelName, canvasWidth / 2, 30);

        // Controls hint
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px monospace';
        ctx.fillText('ARROWS/R.SHIFT: Ladybug | WASD/F: Cat Noir', canvasWidth / 2, 38);

        // Center message
        if (this.messageTimer > 0) {
            const alpha = this.messageTimer < 30 ? this.messageTimer / 30 : 1;
            ctx.globalAlpha = alpha;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = 'bold 28px monospace';
            const tw = ctx.measureText(this.messageText).width;
            ctx.fillRect(canvasWidth / 2 - tw / 2 - 20, 180, tw + 40, 50);

            ctx.fillStyle = this.messageColor;
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.messageText, canvasWidth / 2, 214);

            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    _drawHeart(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - 3);
        ctx.bezierCurveTo(x, y - 7, x - 7, y - 10, x - 10, y - 5);
        ctx.bezierCurveTo(x - 13, y, x - 5, y + 5, x, y + 8);
        ctx.bezierCurveTo(x + 5, y + 5, x + 13, y, x + 10, y - 5);
        ctx.bezierCurveTo(x + 7, y - 10, x, y - 7, x, y - 3);
        ctx.fill();
    }

    drawTitle(ctx, w, h, frame, cheatMode = false) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        const bob = Math.sin(frame * 0.03) * 5;
        ctx.fillStyle = '#E53935';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MIRACULOUS', w / 2, 120 + bob);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px monospace';
        ctx.fillText('CLAW', w / 2, 175 + bob);

        // Ladybug spot (left) and Cat paw (right)
        ctx.fillStyle = '#E53935';
        ctx.beginPath(); ctx.arc(w / 2 - 140, 140 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(w / 2 - 140, 140 + bob, 4, 0, Math.PI * 2); ctx.fill();

        // Cat paw
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath(); ctx.arc(w / 2 + 137, 142 + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(w / 2 + 130, 135 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(w / 2 + 137, 133 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(w / 2 + 144, 135 + bob, 3, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FF80AB';
        ctx.font = '16px monospace';
        ctx.fillText('Save Paris from the Akumas!', w / 2, 210);

        // 2 Player callout
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('2 PLAYER CO-OP!', w / 2, 240);

        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('Press SPACE to Start!', w / 2, 310);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px monospace';
        ctx.fillText('P1 Ladybug: Arrows + Right Shift', w / 2, 370);
        ctx.fillText('P2 Cat Noir: WASD + F', w / 2, 388);

        if (cheatMode) {
            ctx.fillStyle = '#76FF03';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('INVINCIBLE MODE ACTIVATED!', w / 2, 430);
        }
    }

    drawGameOver(ctx, w, h, score, frame) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#FF5252';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Our Heroes Need Rest!', w / 2, 160);

        ctx.fillStyle = '#FFF';
        ctx.font = '20px monospace';
        ctx.fillText(`Final Score: ${score}`, w / 2, 220);

        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('Press SPACE to Try Again!', w / 2, 310);
        }
    }

    drawVictory(ctx, w, h, score, frame) {
        // Reset all canvas state to be safe
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);

        const bob = Math.sin(frame * 0.05) * 3;

        // Celebration sparkles
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 30; i++) {
            const sx = w / 2 + Math.cos(frame * 0.02 + i * 0.3) * (300 + i * 12);
            const sy = h / 2 + Math.sin(frame * 0.03 + i * 0.7) * 280;
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + Math.sin(frame * 0.1 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Big ladybug drawing in the center
        this._drawBigLadybug(ctx, w / 2, 180 + bob, frame);

        // CONGRATULATIONS
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONGRATULATIONS!', w / 2, 370 + bob);

        // MIRACULOUS
        ctx.fillStyle = '#E53935';
        ctx.font = 'bold 40px monospace';
        ctx.fillText('MIRACULOUS!', w / 2, 420 + bob);

        // Heroes
        ctx.fillStyle = '#E53935';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Ladybug', w / 2 - 130, 470 + bob);
        ctx.fillStyle = '#FF80AB';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('&', w / 2, 470 + bob);
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Cat Noir', w / 2 + 130, 470 + bob);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('Paris is Saved!', w / 2, 510 + bob);

        // Score
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('Final Score: ' + score, w / 2, 555);

        // Watch Miraculous prompt
        ctx.fillStyle = '#FF80AB';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('Want more Miraculous?', w / 2, 600);

        // Play again
        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '14px monospace';
            ctx.fillText('Press SPACE to Play Again', w / 2, 700);
        }

        ctx.restore(); // matches the save at top of drawVictory
    }

    _drawBigLadybug(ctx, x, y, frame) {
        ctx.save();
        ctx.translate(x, y);

        const wingFlap = Math.sin(frame * 0.08) * 0.15;

        // Left wing
        ctx.save();
        ctx.rotate(-0.3 + wingFlap);
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.ellipse(-35, -10, 55, 40, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-50, -20, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-25, -30, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-55, 5, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-30, 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-40, 15, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.rotate(0.3 - wingFlap);
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.ellipse(35, -10, 55, 40, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(50, -20, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, -30, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(55, 5, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(30, 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(40, 15, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Body (center line)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, -50, 18, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(-7, -53, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -53, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2196F3';
        ctx.beginPath(); ctx.arc(-7, -53, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -53, 3, 0, Math.PI * 2); ctx.fill();

        // Antennae
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -65);
        ctx.quadraticCurveTo(-15, -85, -20, -80);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, -65);
        ctx.quadraticCurveTo(15, -85, 20, -80);
        ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-20, -80, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -80, 3, 0, Math.PI * 2); ctx.fill();

        // Smile
        ctx.strokeStyle = '#E53935';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -48, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();
    }

    drawLevelIntro(ctx, w, h, levelName, levelNum, frame) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${levelNum}`, w / 2, 180);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 32px monospace';
        ctx.fillText(levelName, w / 2, 230);

        ctx.fillStyle = '#FF80AB';
        ctx.font = '14px monospace';
        ctx.fillText('Get ready!', w / 2, 280);
    }
}
