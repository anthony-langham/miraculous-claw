export const LEVELS = [
    {
        name: 'Eiffel Tower Park',
        width: 1600,
        enemies: [
            { x: 50, y: 550, speed: 0.6 },
            { x: 700, y: 580, speed: 0.5 },
            { x: 1300, y: 520, speed: 0.7 },
        ],
        hearts: [{ x: 400, y: 560 }, { x: 1000, y: 580 }],
        macarons: [{ x: 800, y: 560 }],
        cheese: [{ x: 600, y: 560 }],
        bgColor: '#87CEEB',
        groundColor: '#4CAF50',
    },
    {
        name: 'Seine River Banks',
        width: 2000,
        enemies: [
            { x: 60, y: 540, speed: 0.8 },
            { x: 1700, y: 590, speed: 0.9 },
            { x: 800, y: 560, speed: 0.7 },
            { x: 40, y: 580, speed: 1.0 },
        ],
        hearts: [{ x: 500, y: 560 }, { x: 1200, y: 540 }],
        macarons: [{ x: 900, y: 550 }],
        cheese: [{ x: 1400, y: 570 }],
        bgColor: '#81D4FA',
        groundColor: '#8D6E63',
    },
    {
        name: 'Notre-Dame Square',
        width: 2200,
        enemies: [
            { x: 50, y: 550, speed: 1.0 },
            { x: 2000, y: 580, speed: 0.9 },
            { x: 900, y: 520, speed: 1.1 },
            { x: 70, y: 590, speed: 1.0 },
            { x: 1500, y: 560, speed: 1.2 },
        ],
        hearts: [{ x: 600, y: 560 }, { x: 1300, y: 580 }, { x: 1800, y: 540 }],
        macarons: [{ x: 1100, y: 560 }],
        cheese: [{ x: 700, y: 550 }],
        bgColor: '#B0BEC5',
        groundColor: '#78909C',
    },
    {
        // Boss level
        name: 'BOSS: Timebreaker!',
        width: 800,
        enemies: [],
        boss: { x: 600, y: 560, speed: 1.5 },
        hearts: [{ x: 200, y: 550 }, { x: 600, y: 590 }],
        macarons: [{ x: 350, y: 560 }],
        cheese: [{ x: 450, y: 560 }],
        bgColor: '#37474F',
        groundColor: '#455A64',
    },
    {
        name: 'Champs-Elysees',
        width: 2400,
        enemies: [
            { x: 50, y: 540, speed: 1.0 },
            { x: 2100, y: 590, speed: 1.2 },
            { x: 1000, y: 560, speed: 1.1 },
            { x: 60, y: 580, speed: 1.0 },
            { x: 1600, y: 520, speed: 1.3 },
        ],
        hearts: [{ x: 500, y: 560 }, { x: 1300, y: 540 }, { x: 1900, y: 580 }],
        macarons: [{ x: 1100, y: 560 }],
        cheese: [{ x: 800, y: 570 }],
        bgColor: '#FFF9C4',
        groundColor: '#A1887F',
    },
    {
        name: 'Montmartre',
        width: 2600,
        enemies: [
            { x: 40, y: 550, speed: 1.1 },
            { x: 2300, y: 580, speed: 1.2 },
            { x: 900, y: 520, speed: 1.0 },
            { x: 60, y: 590, speed: 1.3 },
            { x: 1600, y: 560, speed: 1.1 },
            { x: 2100, y: 570, speed: 1.2 },
        ],
        hearts: [{ x: 500, y: 560 }, { x: 1200, y: 580 }, { x: 2000, y: 540 }],
        macarons: [{ x: 1500, y: 560 }],
        cheese: [{ x: 800, y: 550 }],
        bgColor: '#F8BBD0',
        groundColor: '#BCAAA4',
    },
    {
        // Final boss
        name: 'BOSS: Antibug!',
        width: 800,
        enemies: [],
        boss: { x: 600, y: 560, type: 'antibug', speed: 1.5 },
        hearts: [{ x: 200, y: 550 }, { x: 600, y: 590 }],
        macarons: [{ x: 300, y: 560 }],
        cheese: [{ x: 500, y: 560 }],
        bgColor: '#1A1A2E',
        groundColor: '#16213E',
    },
];

export function drawBackground(ctx, levelIndex, cameraX, canvasWidth, canvasHeight) {
    const level = LEVELS[levelIndex];
    const parallax = cameraX * 0.3;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.6);
    skyGrad.addColorStop(0, level.bgColor);
    skyGrad.addColorStop(1, _lighten(level.bgColor));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.6);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 5; i++) {
        const cx = ((i * 300 + 100) - parallax * 0.3) % (canvasWidth + 200) - 50;
        const cy = 40 + (i % 3) * 30;
        _drawCloud(ctx, cx, cy);
    }

    // Background landmark (parallax)
    switch (levelIndex) {
        case 0: _drawEiffelTower(ctx, canvasWidth / 2 - parallax * 0.5, canvasHeight * 0.6); break;
        case 1: _drawBridges(ctx, parallax, canvasWidth, canvasHeight); break;
        case 2: _drawNotreDame(ctx, canvasWidth / 2 - parallax * 0.5, canvasHeight * 0.6); break;
        case 3: _drawRooftops(ctx, parallax, canvasWidth, canvasHeight); break;
        case 4: _drawArcDeTriomphe(ctx, canvasWidth / 2 - parallax * 0.5, canvasHeight * 0.6); break;
        case 5: _drawSacreCoeur(ctx, canvasWidth / 2 - parallax * 0.5, canvasHeight * 0.55); break;
        case 6: _drawAntibugArena(ctx, parallax, canvasWidth, canvasHeight); break;
    }

    // Ground
    const groundY = canvasHeight * 0.6;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvasHeight);
    groundGrad.addColorStop(0, level.groundColor);
    groundGrad.addColorStop(1, _darken(level.groundColor));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvasWidth, canvasHeight * 0.4);

    // Ground details (parallax)
    _drawGroundDetails(ctx, levelIndex, cameraX, canvasWidth, canvasHeight, groundY);
}

function _drawCloud(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 5, 15, 0, Math.PI * 2);
    ctx.arc(x + 35, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 5, 14, 0, Math.PI * 2);
    ctx.fill();
}

function _drawEiffelTower(ctx, x, groundY) {
    ctx.fillStyle = '#5D4037';
    // Main structure
    ctx.beginPath();
    ctx.moveTo(x - 40, groundY);
    ctx.lineTo(x - 8, groundY - 180);
    ctx.lineTo(x + 8, groundY - 180);
    ctx.lineTo(x + 40, groundY);
    ctx.fill();
    // Top
    ctx.fillRect(x - 3, groundY - 220, 6, 40);
    // Platform 1
    ctx.fillRect(x - 30, groundY - 60, 60, 5);
    // Platform 2
    ctx.fillRect(x - 18, groundY - 120, 36, 4);
    // Antenna
    ctx.fillRect(x - 1, groundY - 235, 2, 15);
    // Arches at base
    ctx.fillStyle = _lighten('#5D4037');
    ctx.beginPath();
    ctx.arc(x, groundY, 25, Math.PI, 0);
    ctx.fill();
}

function _drawBridges(ctx, parallax, w, h) {
    // River
    const riverY = h * 0.55;
    ctx.fillStyle = '#1E88E5';
    ctx.fillRect(0, riverY, w, 25);
    // Water shimmer
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 8; i++) {
        const sx = ((i * 110) - parallax * 0.4) % (w + 50);
        ctx.fillRect(sx, riverY + 5 + (i % 3) * 6, 30, 2);
    }
    // Bridge
    ctx.fillStyle = '#8D6E63';
    const bx = 400 - parallax * 0.5;
    ctx.fillRect(bx - 60, riverY - 5, 120, 8);
    // Arches
    ctx.fillStyle = '#6D4C41';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(bx - 30 + i * 30, riverY + 3, 12, Math.PI, 0);
        ctx.fill();
    }
}

function _drawNotreDame(ctx, x, groundY) {
    ctx.fillStyle = '#9E9E9E';
    // Main body
    ctx.fillRect(x - 50, groundY - 100, 100, 100);
    // Towers
    ctx.fillRect(x - 55, groundY - 140, 25, 140);
    ctx.fillRect(x + 30, groundY - 140, 25, 140);
    // Tower tops
    ctx.fillRect(x - 52, groundY - 148, 19, 8);
    ctx.fillRect(x + 33, groundY - 148, 19, 8);
    // Rose window
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(x, groundY - 70, 15, 0, Math.PI * 2);
    ctx.fill();
    // Door
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 12, groundY - 30, 24, 30);
    ctx.beginPath();
    ctx.arc(x, groundY - 30, 12, Math.PI, 0);
    ctx.fill();
    // Cross
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 1, groundY - 160, 2, 15);
    ctx.fillRect(x - 5, groundY - 155, 10, 2);
}

function _drawRooftops(ctx, parallax, w, h) {
    // Dark sky with moon
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.arc(650 - parallax * 0.2, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    // Stars
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 20; i++) {
        const sx = (i * 43 + 17) % w;
        const sy = (i * 31 + 11) % (h * 0.4);
        ctx.fillRect(sx, sy, 2, 2);
    }
    // Rooftop silhouettes
    ctx.fillStyle = '#263238';
    for (let i = 0; i < 6; i++) {
        const rx = i * 160 - parallax * 0.4;
        const rh = 60 + (i % 3) * 30;
        ctx.fillRect(rx, h * 0.6 - rh, 130, rh);
        // Chimney
        ctx.fillRect(rx + 20, h * 0.6 - rh - 15, 12, 15);
    }
    // Gargoyle silhouettes
    ctx.fillStyle = '#37474F';
    const gx = 200 - parallax * 0.3;
    ctx.fillRect(gx, h * 0.6 - 30, 20, 30);
    ctx.fillRect(gx + 15, h * 0.6 - 20, 15, 8);
}

function _drawArcDeTriomphe(ctx, x, groundY) {
    ctx.fillStyle = '#BDBDBD';
    // Main block
    ctx.fillRect(x - 45, groundY - 110, 90, 110);
    // Top
    ctx.fillRect(x - 50, groundY - 118, 100, 10);
    // Arch
    ctx.fillStyle = '#795548';
    ctx.fillRect(x - 18, groundY - 60, 36, 60);
    ctx.beginPath();
    ctx.arc(x, groundY - 60, 18, Math.PI, 0);
    ctx.fill();
    // Pillars
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(x - 40, groundY - 105, 8, 105);
    ctx.fillRect(x + 32, groundY - 105, 8, 105);
    // Flag
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x - 2, groundY - 130, 2, 15);
    ctx.fillStyle = '#F44336';
    ctx.fillRect(x, groundY - 130, 8, 6);
}

function _drawSacreCoeur(ctx, x, groundY) {
    ctx.fillStyle = '#FAFAFA';
    // Main dome
    ctx.beginPath();
    ctx.arc(x, groundY - 90, 40, Math.PI, 0);
    ctx.fill();
    // Body
    ctx.fillRect(x - 40, groundY - 90, 80, 90);
    // Side domes
    ctx.beginPath();
    ctx.arc(x - 30, groundY - 70, 20, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 30, groundY - 70, 20, Math.PI, 0);
    ctx.fill();
    // Top cross
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 1, groundY - 138, 2, 12);
    ctx.fillRect(x - 4, groundY - 133, 8, 2);
    // Door
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 10, groundY - 30, 20, 30);
    ctx.beginPath();
    ctx.arc(x, groundY - 30, 10, Math.PI, 0);
    ctx.fill();
    // Steps (hill)
    ctx.fillStyle = '#A5D6A7';
    ctx.beginPath();
    ctx.moveTo(x - 100, groundY);
    ctx.quadraticCurveTo(x, groundY - 20, x + 100, groundY);
    ctx.lineTo(x + 100, groundY + 5);
    ctx.lineTo(x - 100, groundY + 5);
    ctx.fill();
}

function _drawAntibugArena(ctx, parallax, w, h) {
    // Dark dramatic sky with red moon
    ctx.fillStyle = '#B71C1C';
    ctx.beginPath();
    ctx.arc(w * 0.7 - parallax * 0.2, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    // Stars
    ctx.fillStyle = '#E57373';
    for (let i = 0; i < 25; i++) {
        const sx = (i * 53 + 17) % w;
        const sy = (i * 37 + 11) % (h * 0.4);
        ctx.fillRect(sx, sy, 2, 2);
    }
    // Dark Paris skyline
    ctx.fillStyle = '#0D0D1A';
    for (let i = 0; i < 8; i++) {
        const rx = i * 180 - parallax * 0.4;
        const rh = 80 + (i % 3) * 40;
        ctx.fillRect(rx, h * 0.6 - rh, 150, rh);
        ctx.fillRect(rx + 30, h * 0.6 - rh - 20, 15, 20);
    }
    // Eiffel Tower silhouette in background
    const tx = w / 2 - parallax * 0.3;
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.moveTo(tx - 50, h * 0.6);
    ctx.lineTo(tx - 10, h * 0.6 - 200);
    ctx.lineTo(tx + 10, h * 0.6 - 200);
    ctx.lineTo(tx + 50, h * 0.6);
    ctx.fill();
    ctx.fillRect(tx - 3, h * 0.6 - 230, 6, 30);
}

function _drawGroundDetails(ctx, levelIndex, cameraX, w, h, groundY) {
    const parallax = cameraX * 0.6;

    // Trees / lampposts based on level
    if (levelIndex === 0 || levelIndex === 4) {
        // Trees
        for (let i = 0; i < 8; i++) {
            const tx = ((i * 220 + 80) - parallax) % (w + 100) - 50;
            _drawTree(ctx, tx, groundY + 5);
        }
    }

    if (levelIndex === 1) {
        // Benches along river
        for (let i = 0; i < 4; i++) {
            const bx = ((i * 300 + 150) - parallax) % (w + 100) - 50;
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(bx, groundY + 20, 30, 3);
            ctx.fillRect(bx + 3, groundY + 20, 3, 10);
            ctx.fillRect(bx + 24, groundY + 20, 3, 10);
        }
    }

    if (levelIndex === 4) {
        // Lampposts on Champs-Elysees
        for (let i = 0; i < 5; i++) {
            const lx = ((i * 250 + 100) - parallax) % (w + 100) - 50;
            ctx.fillStyle = '#333';
            ctx.fillRect(lx, groundY - 40, 3, 45);
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath();
            ctx.arc(lx + 1, groundY - 42, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (levelIndex === 5) {
        // Cobblestone hints
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 20; i++) {
            const sx = ((i * 80 + 20) - parallax * 0.8) % (w + 50);
            const sy = groundY + 15 + (i % 4) * 20;
            ctx.fillRect(sx, sy, 25, 10);
        }
    }

    // Path lines on ground
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 50);
    ctx.lineTo(w, groundY + 50);
    ctx.stroke();
    ctx.setLineDash([]);
}

function _drawTree(ctx, x, y) {
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 3, y - 25, 6, 28);
    // Leaves
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(x, y - 30, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.arc(x + 5, y - 35, 14, 0, Math.PI * 2);
    ctx.fill();
}

function _lighten(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})`;
}

function _darken(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})`;
}
