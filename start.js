/* 启动界面：背景粒子 + 游动的蛇 + 按钮交互 */
(() => {
  'use strict';

  const screen = document.getElementById('startScreen');
  const canvas = document.getElementById('startfx');
  const ctx = canvas.getContext('2d');
  const panel = document.getElementById('stPanel');
  let W = 0;
  let H = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const dots = Array.from({ length: 46 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 2.4,
    sp: 0.004 + Math.random() * 0.012,
    ph: Math.random() * Math.PI * 2,
  }));

  function drawParticles(t) {
    for (const p of dots) {
      p.y -= p.sp * 0.02;
      if (p.y < -0.05) {
        p.y = 1.05;
        p.x = Math.random();
      }
      const a = 0.16 + 0.2 * Math.sin(t * 1.4 + p.ph);
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120, 240, 200, ${Math.max(0.05, a)})`;
      ctx.fill();
    }
  }

  function drawSnake(t) {
    const baseY = H * 0.78;
    const amp = Math.min(46, H * 0.045);
    const n = 120;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = -W * 0.06 + u * (W * 0.7);
      const y = baseY + Math.sin(u * 2.6 + t * 0.7) * amp * (0.3 + u * 0.7);
      pts.push([x, y]);
    }

    // 和游戏内一致：身体基本等宽，只有尾巴一小段收圆
    const widthAt = (u) => 46 * (0.52 + 0.48 * Math.min(1, u / 0.16));

    // 用多边形描出整条蛇的轮廓（带深色描边）
    const left = [];
    const right = [];
    for (let i = 0; i < pts.length; i++) {
      const u = i / (pts.length - 1);
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0];
      let ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty;
      const ny = tx;
      const half = widthAt(u) / 2;
      left.push([p[0] + nx * half, p[1] + ny * half]);
      right.push([p[0] - nx * half, p[1] - ny * half]);
    }

    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(46, 210, 178, 0.9)';
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(8, 22, 17, 0.85)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 头部：圆头 + 深色描边 + 两只白点眼
    const head = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(head[0], head[1], 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(64, 224, 190, 0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(8, 22, 17, 0.9)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#f2fffb';
    ctx.beginPath();
    ctx.arc(head[0] - 11, head[1] - 9, 5.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head[0] + 11, head[1] - 9, 5.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(ts) {
    const t = ts / 1000;
    ctx.clearRect(0, 0, W, H);
    drawParticles(t);
    drawSnake(t);
    requestAnimationFrame(frame);
  }

  function startGame() {
    screen.classList.add('gone');
    window.setTimeout(() => { screen.style.display = 'none'; }, 460);
    if (typeof window.startDevour === 'function') window.startDevour();
  }

  document.getElementById('btnStart').addEventListener('click', startGame);

  document.getElementById('btnHelp').addEventListener('click', () => {
    panel.innerHTML = [
      'WASD / 方向键：8 方向移动',
      '空格：发射毒牙（消耗 1 节体长，最低保留 2 节）',
      'E：能量球（消耗 3 节体长，需超过 4 节）命中后 3×3 范围清场',
      'F：切换全图 / 跟随视角　P：暂停　R：重开',
      '体长就是血量：受伤从尾部断节，体长 ≤ 1 时死亡',
      '吃金色豆子变长，击杀小怪 +2 节，清光敌人后门会打开',
    ].join('<br>');
    panel.classList.add('show');
  });

  document.getElementById('btnCredits').addEventListener('click', () => {
    panel.innerHTML = [
      '吞噬之蛇 DEVOUR · v0.1 prototype',
      '设计与实现：郭宇',
      '引擎：Three.js　美术：Canvas 程序化生成',
    ].join('<br>');
    panel.classList.add('show');
  });

  window.addEventListener('keydown', (e) => {
    if (screen.classList.contains('gone')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
  });

  try {
    const best = Number(window.localStorage.getItem('devour-best') || 0);
    document.getElementById('stBest').textContent = String(best);
  } catch (err) {
    /* file:// 下可能禁用 localStorage，忽略 */
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
