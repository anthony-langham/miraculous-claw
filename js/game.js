import { Input } from './input.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { LEVELS, drawBackground } from './level.js';
import { HUD } from './hud.js';
import { ParticleSystem } from './particles.js';
import { Audio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const youtubeBtn = document.getElementById('youtube-btn');
const playagainBtn = document.getElementById('playagain-btn');

playagainBtn.addEventListener('click', () => {
    playagainBtn.style.display = 'none';
    youtubeBtn.style.display = 'none';
    resetGame();
});

const STATE = {
    TITLE: 'title',
    LEVEL_INTRO: 'level_intro',
    PLAYING: 'playing',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
};

let state = STATE.TITLE;
let currentLevel = 0;
let frame = 0;
let stateTimer = 0;
let cameraX = 0;

const input = new Input();
const hud = new HUD();
const particles = new ParticleSystem();
const audio = new Audio();

let players = [];
let enemies = [];
let hearts = [];
let powerups = []; // macarons and cheese
let cheatMode = false;
let cheatBuffer = '';
const CHEAT_CODE = 'cheat';

// Listen for cheat code typing on title screen
window.addEventListener('keydown', (e) => {
    if (state !== STATE.TITLE) return;
    const key = e.key.toLowerCase();
    if (key.length === 1 && key >= 'a' && key <= 'z') {
        cheatBuffer += key;
        if (cheatBuffer.length > CHEAT_CODE.length) {
            cheatBuffer = cheatBuffer.slice(-CHEAT_CODE.length);
        }
        if (cheatBuffer === CHEAT_CODE) {
            cheatMode = true;
            cheatBuffer = '';
            audio.init();
            audio.resume();
            audio.playPickup();
        }
    }
});

function initLevel(levelIndex) {
    const level = LEVELS[levelIndex];

    if (players.length === 0) {
        players = [
            new Player(100, 560, 'ladybug'),
            new Player(150, 570, 'catnoir'),
        ];
    }

    players[0].x = 100;
    players[0].y = 560;
    players[1].x = 150;
    players[1].y = 570;

    for (const p of players) {
        p.attacking = false;
        p.attackTimer = 0;
        p.invincible = 60;
    }

    enemies = [];

    for (const e of level.enemies) {
        const enemy = new Enemy(e.x, e.y, 'regular', e.speed);
        // Enemies starting near the left get a dormant delay
        if (e.x < 200) {
            enemy.dormant = 180; // 3 seconds before they appear
        }
        enemies.push(enemy);
    }

    if (level.boss) {
        const bossType = level.boss.type || 'timebreaker';
        enemies.push(new Enemy(level.boss.x, level.boss.y, bossType, level.boss.speed));
    }

    // Spawn health heart pickups
    hearts = [];
    if (level.hearts) {
        for (const h of level.hearts) {
            hearts.push({ x: h.x, y: h.y, collected: false, bobTimer: Math.random() * 100 });
        }
    }

    // Spawn powerups
    powerups = [];
    if (level.macarons) {
        for (const m of level.macarons) {
            powerups.push({ x: m.x, y: m.y, type: 'macaron', collected: false, bobTimer: Math.random() * 100 });
        }
    }
    if (level.cheese) {
        for (const c of level.cheese) {
            powerups.push({ x: c.x, y: c.y, type: 'cheese', collected: false, bobTimer: Math.random() * 100 });
        }
    }

    cameraX = 0;
    particles.clear();
    audio.startMusic(levelIndex);
}

function resetGame() {
    currentLevel = 0;
    players = [];
    enemies = [];
    hearts = [];
    powerups = [];
    particles.clear();
    state = STATE.LEVEL_INTRO;
    stateTimer = 120;
    initLevel(0);
}

function boxCollide(a, b) {
    if (!a || !b) return false;
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function getTotalScore() {
    return players.reduce((sum, p) => sum + p.score, 0);
}

function update() {
    input.update();
    frame++;
    hud.update();
    particles.update();

    switch (state) {
        case STATE.TITLE:
            if (input.isJustPressed('Space')) {
                audio.init();
                audio.resume();
                resetGame();
            }
            break;

        case STATE.LEVEL_INTRO:
            stateTimer--;
            if (stateTimer <= 0) {
                state = STATE.PLAYING;
            }
            break;

        case STATE.PLAYING:
            updatePlaying();
            break;

        case STATE.LEVEL_COMPLETE:
            stateTimer--;
            if (stateTimer <= 0) {
                currentLevel++;
                if (currentLevel >= LEVELS.length) {
                    state = STATE.VICTORY;
                    audio.stopMusic();
                    audio.playVictory();
                    youtubeBtn.style.display = 'block';
                    playagainBtn.style.display = 'block';
                } else {
                    state = STATE.LEVEL_INTRO;
                    stateTimer = 120;
                    initLevel(currentLevel);
                }
            }
            break;

        case STATE.GAME_OVER:
            if (input.isJustPressed('Space')) {
                resetGame();
            }
            break;

        case STATE.VICTORY:
            if (input.isJustPressed('Space')) {
                state = STATE.TITLE;
                audio.stopMusic();
                youtubeBtn.style.display = 'none';
                playagainBtn.style.display = 'none';
            }
            break;
    }
}

function updatePlaying() {
    const level = LEVELS[currentLevel];

    // Update all players
    for (const p of players) {
        if (p.health > 0) {
            p.update(input, level.width);
        }
    }

    // Camera follows midpoint between alive players
    const alivePlayers = players.filter(p => p.health > 0);
    if (alivePlayers.length > 0) {
        const midX = alivePlayers.reduce((sum, p) => sum + p.x, 0) / alivePlayers.length;
        const targetCam = midX - W / 2;
        cameraX += (targetCam - cameraX) * 0.08;
        cameraX = Math.max(0, Math.min(level.width - W, cameraX));
    }

    // Update enemies - chase nearest alive player
    for (const enemy of enemies) {
        let nearestX = players[0].x;
        let nearestY = players[0].y;
        let nearestDist = Infinity;

        for (const p of alivePlayers) {
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            const dist = dx * dx + dy * dy;
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestX = p.x;
                nearestY = p.y;
            }
        }

        enemy.update(nearestX, nearestY, level.width);
    }

    // Heart powerup collection - generous radius, just walk into them
    for (const heart of hearts) {
        if (heart.collected) continue;
        heart.bobTimer++;

        for (const p of players) {
            if (p.health <= 0) continue;

            const dx = p.x - heart.x;
            const dy = p.y - heart.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 70) {
                heart.collected = true;
                if (p.health < p.maxHealth) {
                    p.health++;
                }
                particles.emitPurify(heart.x, heart.y - 10);
                audio.playPickup();
                break;
            }
        }
    }

    // Powerup collection (macarons for Ladybug, cheese for Cat Noir)
    for (const pu of powerups) {
        if (pu.collected) continue;
        pu.bobTimer++;

        for (const p of players) {
            if (p.health <= 0 || p.hasPowerup) continue;
            // Macarons for Ladybug, cheese for Cat Noir
            if (pu.type === 'macaron' && p.character !== 'ladybug') continue;
            if (pu.type === 'cheese' && p.character !== 'catnoir') continue;

            const dx = p.x - pu.x;
            const dy = p.y - pu.y;
            if (Math.sqrt(dx * dx + dy * dy) < 70) {
                pu.collected = true;
                p.hasPowerup = true;
                particles.emitHit(pu.x, pu.y - 15);
                audio.playPowerupCollect();
                hud.showMessage(
                    pu.type === 'macaron' ? 'Lucky Charm Ready!' : 'Cataclysm Ready!',
                    90,
                    pu.type === 'macaron' ? '#E91E63' : '#76FF03'
                );
                break;
            }
        }
    }

    // Each player's attack hits enemies
    for (const p of players) {
        if (p.health <= 0) continue;

        // Play super attack sound on first frame
        if (p.usingPowerup && p.attacking && p.attackTimer === 34) {
            if (p.character === 'ladybug') {
                audio.playLuckyCharm();
            } else {
                audio.playCataclysm();
            }
        }

        const attackBox = p.getAttackBox();
        if (!attackBox) continue;

        for (const enemy of enemies) {
            if (enemy.purified) continue;

            const hitBox = enemy.getHitBox();

            if (enemy.canBePurified()) {
                if (boxCollide(attackBox, hitBox)) {
                    enemy.purify();
                    const pts = enemy.type === 'timebreaker' ? 1000 : 100;
                    p.addScore(pts);
                    particles.emitPurify(enemy.x, enemy.y - 30);
                    particles.emitScore(enemy.x, enemy.y - 70, pts);
                    audio.playPurify();
                }
            } else if (enemy.health > 0) {
                if (boxCollide(attackBox, hitBox)) {
                    if (p.usingPowerup && !enemy.isBoss) {
                        // Super attack instantly purifies regular enemies
                        enemy.health = 0;
                        enemy.stunTimer = 999;
                        enemy.hurtTimer = 15;
                        enemy.purify();
                        const pts = 100;
                        p.addScore(pts);
                        particles.emitPurify(enemy.x, enemy.y - 30);
                        particles.emitScore(enemy.x, enemy.y - 70, pts);
                        audio.playPurify();
                    } else {
                        // Normal attack: 1 hit. Super attack on boss: 3 hits.
                        const hits = p.usingPowerup ? 3 : 1;
                        let defeated = false;
                        for (let i = 0; i < hits; i++) {
                            if (enemy.health > 0) {
                                defeated = enemy.takeDamage() || defeated;
                                enemy.hurtTimer = 1;
                            }
                        }
                        enemy.hurtTimer = 15;
                        particles.emitHit(enemy.x, enemy.y - 30);
                        if (p.usingPowerup) {
                            particles.emitPurify(enemy.x, enemy.y - 30);
                        }
                        audio.playHit();
                        if (defeated) {
                            hud.showMessage('Attack to Purify!', 90, '#FF80AB');
                        }
                    }
                }
            }
        }
    }

    // Enemy contact damages each player (skipped in cheat mode)
    if (!cheatMode) {
        for (const enemy of enemies) {
            const dmgBox = enemy.getDamageBox();
            if (!dmgBox) continue;

            for (const p of players) {
                if (p.health <= 0) continue;

                const playerBox = {
                    x: p.x - 15,
                    y: p.y - 50,
                    width: 30,
                    height: 50
                };

                if (boxCollide(playerBox, dmgBox)) {
                    if (p.takeDamage()) {
                        particles.emitDamage(p.x, p.y - 25);
                        audio.playDamage();
                    }
                }
            }
        }
    }

    // Game over when ALL players are down
    const allDown = players.every(p => p.health <= 0);
    if (allDown) {
        state = STATE.GAME_OVER;
        audio.stopMusic();
        audio.playGameOver();
        return;
    }

    // Check level complete
    const allPurified = enemies.every(e => e.purified);
    const allFaded = enemies.every(e => e.purified && e.purifyTimer > 60);

    if (allPurified && allFaded) {
        state = STATE.LEVEL_COMPLETE;
        stateTimer = 120;
        for (const p of players) {
            if (p.health > 0) p.addScore(500);
        }
        audio.stopMusic();
        audio.playLevelComplete();
        hud.showMessage('Level Complete! +500', 100, '#FFD700');
    }
}

function drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.3);
    ctx.bezierCurveTo(x, y - size * 0.7, x - size * 0.7, y - size, x - size, y - size * 0.5);
    ctx.bezierCurveTo(x - size * 1.3, y, x - size * 0.5, y + size * 0.5, x, y + size * 0.8);
    ctx.bezierCurveTo(x + size * 0.5, y + size * 0.5, x + size * 1.3, y, x + size, y - size * 0.5);
    ctx.bezierCurveTo(x + size * 0.7, y - size, x, y - size * 0.7, x, y - size * 0.3);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    if (state === STATE.TITLE) {
        drawBackground(ctx, 0, frame * 0.2, W, H);
        hud.drawTitle(ctx, W, H, frame, cheatMode);
        return;
    }

    drawBackground(ctx, currentLevel, cameraX, W, H);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw health heart pickups
    for (const heart of hearts) {
        if (heart.collected) continue;
        const bob = Math.sin(heart.bobTimer * 0.05) * 5;
        const glow = 0.5 + Math.sin(heart.bobTimer * 0.08) * 0.3;

        // Glow
        ctx.save();
        ctx.globalAlpha = glow * 0.4;
        ctx.fillStyle = '#FF80AB';
        ctx.beginPath();
        ctx.arc(heart.x, heart.y - 15 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Heart
        drawHeart(ctx, heart.x, heart.y - 15 + bob, 10, '#E91E63');
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(heart.x - 3, heart.y - 20 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw powerups (macarons and cheese)
    for (const pu of powerups) {
        if (pu.collected) continue;
        const bob = Math.sin(pu.bobTimer * 0.06) * 5;
        const glow = 0.5 + Math.sin(pu.bobTimer * 0.1) * 0.3;

        ctx.save();
        ctx.globalAlpha = glow * 0.3;
        ctx.fillStyle = pu.type === 'macaron' ? '#E91E63' : '#FFEB3B';
        ctx.beginPath();
        ctx.arc(pu.x, pu.y - 12 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (pu.type === 'macaron') {
            // Pink macaron
            ctx.fillStyle = '#F48FB1';
            ctx.beginPath();
            ctx.ellipse(pu.x, pu.y - 15 + bob, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Filling
            ctx.fillStyle = '#FCE4EC';
            ctx.fillRect(pu.x - 8, pu.y - 16 + bob, 16, 3);
            // Top
            ctx.fillStyle = '#E91E63';
            ctx.beginPath();
            ctx.ellipse(pu.x, pu.y - 19 + bob, 9, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Stinky cheese (wedge shape)
            ctx.fillStyle = '#FFC107';
            ctx.beginPath();
            ctx.moveTo(pu.x - 10, pu.y - 8 + bob);
            ctx.lineTo(pu.x + 10, pu.y - 8 + bob);
            ctx.lineTo(pu.x + 5, pu.y - 22 + bob);
            ctx.closePath();
            ctx.fill();
            // Holes
            ctx.fillStyle = '#FF8F00';
            ctx.beginPath(); ctx.arc(pu.x - 2, pu.y - 13 + bob, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(pu.x + 4, pu.y - 16 + bob, 1.5, 0, Math.PI * 2); ctx.fill();
            // Stink lines
            ctx.strokeStyle = '#8BC34A';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            for (let i = 0; i < 3; i++) {
                const sx = pu.x - 4 + i * 4;
                const wave = Math.sin(pu.bobTimer * 0.08 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(sx, pu.y - 22 + bob);
                ctx.quadraticCurveTo(sx + wave, pu.y - 30 + bob, sx, pu.y - 35 + bob);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }

    // Collect all drawables and sort by Y for depth
    const drawables = [];
    for (const enemy of enemies) {
        if (enemy.purified && enemy.purifyTimer > 60) continue;
        drawables.push({ obj: enemy, y: enemy.y });
    }
    for (const p of players) {
        if (p.health > 0) {
            drawables.push({ obj: p, y: p.y });
        }
    }

    drawables.sort((a, b) => a.y - b.y);

    for (const d of drawables) {
        d.obj.draw(ctx);
    }

    particles.drawScreenSpace(ctx);

    ctx.restore();

    // HUD
    if (state === STATE.PLAYING || state === STATE.LEVEL_COMPLETE) {
        hud.draw(ctx, players, LEVELS[currentLevel].name, W, cheatMode);
    }

    // Overlays
    if (state === STATE.LEVEL_INTRO) {
        hud.drawLevelIntro(ctx, W, H, LEVELS[currentLevel].name, currentLevel + 1, frame);
    } else if (state === STATE.GAME_OVER) {
        hud.drawGameOver(ctx, W, H, getTotalScore(), frame);
    } else if (state === STATE.VICTORY) {
        hud.drawVictory(ctx, W, H, getTotalScore(), frame);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
