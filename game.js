// ============================================================
// SnakeVerse — Snake game logic (game.html)
// Redesigned with Google-Snake-style smooth motion: the grid
// logic still steps on a fixed tick, but rendering runs on
// requestAnimationFrame and interpolates between ticks so the
// snake glides instead of jumping cell to cell.
// ============================================================
(() => {
    const COLS = 20, ROWS = 20;
    const CELL = 24; // px per cell (canvas = 480)
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return; // safety: script only runs on game.html
    const ctx = canvas.getContext('2d');

    const SPEEDS = { easy: 170, medium: 105, hard: 62 };
    let diffKey = 'easy';
    let tickInterval = SPEEDS.easy;
    let tickTimer = null;
    let rafId = null;
    let lastTickAt = 0;
    let running = false;
    let paused = false;

    let snake, prevSnake, dir, nextDir, food, score, moveCount;
    let bonus = null;          // { x, y, expiresAt }
    let bonusChance = 0;       // increments toward a bonus spawn

    const HI_KEY = 'snakeverse_high_score';
    let hiScore = parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0;
    document.getElementById('hiDisplay').textContent = hiScore;

    // ── palette — checkerboard board + friendly blue snake ─────
    const C = {
        boardA: '#b7df82',
        boardB: '#a9d46e',
        boardShade: 'rgba(0,0,0,0.05)',
        snakeHead: '#3d6fa8',
        snakeBody: '#4d84c4',
        snakeBody2: '#4577b3',
        snakeOutline: '#2c4f78',
        tongue: '#d94848',
    };

    // ── fruit cycle: 4 normal fruits + a rare golden bonus ─────
    const FRUITS = [
        { key: 'apple', body: '#e0453f', leaf: '#3f9142', accent: '#f2857f' },
        { key: 'cherry', body: '#c22b4e', leaf: '#3f9142', accent: '#e0678a', pair: true },
        { key: 'orange', body: '#f0932b', leaf: '#3f9142', accent: '#f7b978' },
        { key: 'grape', body: '#7a4fa0', leaf: '#3f9142', accent: '#a97fc9', cluster: true },
    ];
    let currentFruit = FRUITS[0];

    // ── board ────────────────────────────────────────────────
    function drawBoard() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? C.boardA : C.boardB;
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            }
        }
        // subtle vignette so the board reads as a contained arena
        const grd = ctx.createRadialGradient(240, 240, 120, 240, 240, 340);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(0,0,0,0.10)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ── smoothly interpolated snake ─────────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    function drawSnake(t) {
        // build interpolated pixel-space points for every segment
        const pts = snake.map((seg, i) => {
            const prev = prevSnake[i] || seg;
            return {
                x: lerp(prev.x, seg.x, t) * CELL + CELL / 2,
                y: lerp(prev.y, seg.y, t) * CELL + CELL / 2,
            };
        });

        // body — draw as a smooth ribbon of overlapping rounded segments
        for (let i = pts.length - 1; i >= 0; i--) {
            const p = pts[i];
            const isHead = i === 0;
            const r = isHead ? 13 : Math.max(8, 11 - (i / pts.length) * 2);

            ctx.fillStyle = isHead
                ? C.snakeHead
                : (i % 2 ? C.snakeBody : C.snakeBody2);

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        // thin outline stroke over the whole ribbon for definition
        ctx.strokeStyle = C.snakeOutline;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            const r = i === 0 ? 13 : Math.max(8, 11 - (i / pts.length) * 2);

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // face on the head
        const head = pts[0];
        const [ex1, ey1, ex2, ey2, tx, ty, tang] = headFeatures(head, dir);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex1, ey1, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#152033';
        ctx.beginPath();

        ctx.fillStyle = "#152033";

        ctx.beginPath();
        ctx.arc(
            ex1 + Math.cos(tang) * 1.2,
            ey1 + Math.sin(tang) * 1.2,
            1.8,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            ex2 + Math.cos(tang) * 1.2,
            ey2 + Math.sin(tang) * 1.2,
            1.8,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath(); ctx.arc(ex2 + Math.cos(tang) * 1.2, ey2 + Math.sin(tang) * 1.2, 1.8, 0, Math.PI * 2); ctx.fill();

        // flicking tongue
        if (running && !paused && Math.sin(performance.now() / 140) > 0.5) {
            ctx.strokeStyle = C.tongue;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(head.x, head.y);
            ctx.lineTo(tx, ty);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(tang + 0.5) * 5, ty + Math.sin(tang + 0.5) * 5);
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(tang - 0.5) * 5, ty + Math.sin(tang - 0.5) * 5);
            ctx.stroke();
        }
    }

    function headFeatures(head, d) {
        const off = 6.5, side = 4.6, tongueLen = 15;
        let ang;
        if (d === 'RIGHT') ang = 0; else if (d === 'LEFT') ang = Math.PI;
        else if (d === 'UP') ang = -Math.PI / 2; else ang = Math.PI / 2;
        const perp = ang + Math.PI / 2;
        const fx = head.x + Math.cos(ang) * off, fy = head.y + Math.sin(ang) * off;
        const ex1 = fx + Math.cos(perp) * side, ey1 = fy + Math.sin(perp) * side;
        const ex2 = fx - Math.cos(perp) * side, ey2 = fy - Math.sin(perp) * side;
        const tx = head.x + Math.cos(ang) * tongueLen, ty = head.y + Math.sin(ang) * tongueLen;
        return [ex1, ey1, ex2, ey2, tx, ty, ang];
    }

    // ── fruit rendering ──────────────────────────────────────
    function drawFruit(pos, fruit, isBonus, pulse) {
        const x = pos.x * CELL + CELL / 2;
        const y = pos.y * CELL + CELL / 2;
        const rad = (CELL / 2 - 3) * (isBonus ? (1 + 0.08 * pulse) : 1);

        if (isBonus) {
            ctx.save();
            ctx.shadowColor = 'rgba(255,205,60,0.9)';
            ctx.shadowBlur = 14;
        }

        if (fruit.pair) {
            // cherries — two small circles
            ctx.fillStyle = fruit.body;
            ctx.beginPath(); ctx.arc(x - 5, y + 3, rad * 0.62, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 5, y + 5, rad * 0.62, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = fruit.leaf; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(x - 5, y - 2); ctx.quadraticCurveTo(x, y - 12, x + 5, y - 1); ctx.stroke();
        } else if (fruit.cluster) {
            // grapes — small cluster of circles
            ctx.fillStyle = fruit.body;
            const off = rad * 0.5;
            [[0, -off], [-off, 0], [off, 0], [0, off], [-off * 0.5, off * 1.6], [off * 0.5, off * 1.6]].forEach(([dx, dy]) => {
                ctx.beginPath(); ctx.arc(x + dx, y + dy, rad * 0.42, 0, Math.PI * 2); ctx.fill();
            });
        } else {
            ctx.fillStyle = isBonus ? '#f6c343' : fruit.body;
            ctx.beginPath(); ctx.arc(x, y + 1, rad, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath(); ctx.ellipse(x - 3, y - 3, rad * 0.3, rad * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = fruit.leaf; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - rad + 1);
            ctx.quadraticCurveTo(x + 5, y - rad - 6, x + 7, y - rad - 2);
            ctx.stroke();
        }

        if (isBonus) ctx.restore();
    }

    // ── game logic ──────────────────────────────────────────────
    function randomCell(exclude) {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        } while (exclude.some(s => s.x === pos.x && s.y === pos.y) || (bonus && bonus.x === pos.x && bonus.y === pos.y));
        return pos;
    }

    function maybeSpawnBonus() {
        if (bonus || bonusChance < 4) return;
        if (Math.random() < 0.55) {
            bonus = { ...randomCell(snake.concat([food])), expiresAt: performance.now() + 6000 };
        }
        bonusChance = 0;
    }

    function tick() {
        if (paused) return;
        prevSnake = snake.map(s => ({ x: s.x, y: s.y }));
        dir = nextDir;
        const head = snake[0];
        const newHead = { x: head.x, y: head.y };
        if (dir === 'RIGHT') newHead.x++;
        else if (dir === 'LEFT') newHead.x--;
        else if (dir === 'UP') newHead.y--;
        else if (dir === 'DOWN') newHead.y++;

        if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) return endGame();
        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) return endGame();

        snake.unshift(newHead);

        let grew = false;
        if (newHead.x === food.x && newHead.y === food.y) {
            score++;
            grew = true;
            moveCount++;
            bonusChance++;
            currentFruit = FRUITS[moveCount % FRUITS.length];
            food = randomCell(snake);
            maybeSpawnBonus();
        }
        if (bonus && newHead.x === bonus.x && newHead.y === bonus.y) {
            score += 3;
            grew = true;
            snake.push({ ...snake[snake.length - 1] }); // extra growth for the bonus
            bonus = null;
            showToast('+3 bonus!');
        }
        if (bonus && performance.now() > bonus.expiresAt) bonus = null;

        if (!grew) {
            snake.pop();
        } else {
            // keep prevSnake same length as the (possibly longer) snake so the
            // new tail segment doesn't try to interpolate from nothing
            while (prevSnake.length < snake.length) prevSnake.push({ ...snake[snake.length - 1] });
        }

        document.getElementById('scoreDisplay').textContent = score;
        document.getElementById('lenDisplay').textContent = snake.length;
        if (score > hiScore) {
            hiScore = score;
            document.getElementById('hiDisplay').textContent = hiScore;
            localStorage.setItem(HI_KEY, String(hiScore));
        }

        lastTickAt = performance.now();
    }

    let toastTimer = null;
    function showToast(text) {
        const el = document.getElementById('bonusToast');
        if (!el) return;
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 900);
    }

    // ── render loop (rAF, decoupled from tick for smooth glide) ──
    function render() {
        const t = tickTimer ? Math.min(1, (performance.now() - lastTickAt) / tickInterval) : 1;
        drawBoard();
        if (bonus) {
            const pulse = Math.sin(performance.now() / 90);
            drawFruit(bonus, { body: '#f6c343', leaf: '#c98f1e' }, true, pulse);
        }
        drawFruit(food, currentFruit, false, 0);
        drawSnake(t);
        rafId = requestAnimationFrame(render);
    }

    function startGame() {
        snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
        prevSnake = snake.map(s => ({ x: s.x, y: s.y }));
        dir = nextDir = 'RIGHT';
        score = 0; moveCount = 0; bonus = null; bonusChance = 0;
        currentFruit = FRUITS[0];
        paused = false;
        document.getElementById('scoreDisplay').textContent = 0;
        document.getElementById('lenDisplay').textContent = 3;
        food = randomCell(snake);

        document.getElementById('gameOverlay').classList.add('hidden');
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.disabled = false;
        pauseBtn.textContent = '⏸ Pause';

        running = true;
        clearInterval(tickTimer);
        lastTickAt = performance.now();
        tickTimer = setInterval(tick, tickInterval);
        if (!rafId) render();
    }

    function restartGame() {
        clearInterval(tickTimer);
        startGame();
    }

    function togglePause() {
        if (!running) return;
        paused = !paused;
        document.getElementById('pauseBtn').textContent = paused ? '▶ Resume' : '⏸ Pause';
        if (!paused) lastTickAt = performance.now();
    }

    function endGame() {
        running = false;
        paused = false;
        clearInterval(tickTimer);
        tickTimer = null;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '⏸ Pause';

        const overlay = document.getElementById('gameOverlay');
        document.getElementById('overlayTitle').textContent = 'Game Over';
        document.getElementById('overlaySub').textContent = score === 0
            ? "Better luck next time." : "Nice run — try again?";
        const sc = document.getElementById('overlayScore');
        sc.style.display = 'block';
        sc.textContent = 'Score: ' + score + (score === hiScore && score > 0 ? '  🏆 New Best!' : '');
        document.getElementById('startBtn').textContent = '▶ Play Again';
        overlay.classList.remove('hidden');
    }

    // idle board + demo snake on load
    drawBoard();
    (() => {
        snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
        prevSnake = snake.map(s => ({ x: s.x, y: s.y }));
        dir = 'RIGHT';
        food = { x: 14, y: 10 };
        currentFruit = FRUITS[0];
        drawFruit(food, currentFruit, false, 0);
        drawSnake(1);
        snake = null; prevSnake = null;
    })();

    // ── keyboard ────────────────────────────────────────────────
    const opp = { RIGHT: 'LEFT', LEFT: 'RIGHT', UP: 'DOWN', DOWN: 'UP' };
    document.addEventListener('keydown', e => {
        if (!running) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
                startGame(); return;
            }
        }
        if (e.key === ' ' && running) { togglePause(); e.preventDefault(); return; }
        const map = {
            ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
            w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT'
        };
        if (map[e.key] && map[e.key] !== opp[dir]) { nextDir = map[e.key]; e.preventDefault(); }
    });

    // ── dpad ────────────────────────────────────────────────────
    window.dpad = function (d) {
        if (!running) { startGame(); return; }
        if (d !== opp[dir]) nextDir = d;
    };

    // ── difficulty selector ──────────────────────────────────────
    window.setDifficulty = function (d) {
        diffKey = d;
        tickInterval = SPEEDS[d];
        ['easy', 'medium', 'hard'].forEach(k => {
            document.getElementById('diff-' + k).classList.toggle('active', k === d);
        });
        if (running && !paused) {
            clearInterval(tickTimer);
            lastTickAt = performance.now();
            tickTimer = setInterval(tick, tickInterval);
        }
    };

    window.startGame = startGame;
    window.restartGame = restartGame;
    window.togglePause = togglePause;
})();
