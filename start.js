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

    const traceBody = () => {
      ctx.beginPath();
      ctx.moveTo(left[0][0], left[0][1]);
      for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      ctx.closePath();
    };

    ctx.save();
    ctx.translate(0, Math.max(12, H * 0.018));
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#00120d';
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowBlur = 22;
    traceBody();
    ctx.fill();
    ctx.restore();

    const bodyGradient = ctx.createLinearGradient(0, 0, W * 0.76, 0);
    bodyGradient.addColorStop(0, '#116249');
    bodyGradient.addColorStop(0.42, '#2dbb8e');
    bodyGradient.addColorStop(0.72, '#68e9bb');
    bodyGradient.addColorStop(1, '#2aa77f');
    traceBody();
    ctx.fillStyle = bodyGradient;
    ctx.shadowColor = 'rgba(71,232,183,.24)';
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(3, 19, 13, 0.94)';
    ctx.lineWidth = Math.max(5, W * 0.0042);
    ctx.stroke();

    ctx.save();
    traceBody();
    ctx.clip();
    ctx.strokeStyle = 'rgba(5, 66, 49, .42)';
    ctx.lineWidth = 1.15;
    for (let i = 7; i < pts.length - 4; i += 7) {
      const p = pts[i];
      const a = pts[i - 2];
      const b = pts[i + 2];
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.beginPath();
      ctx.ellipse(p[0], p[1] + 4, 9, 5, angle, 0, Math.PI);
      ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 5; i < pts.length - 4; i++) {
      const p = pts[i];
      if (i === 5) ctx.moveTo(p[0], p[1] - 13);
      else ctx.lineTo(p[0], p[1] - 13);
    }
    ctx.strokeStyle = 'rgba(210, 255, 238, .2)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 头部：圆头 + 深色描边 + 两只白点眼
    const head = pts[pts.length - 1];
    const headGlow = ctx.createRadialGradient(
      head[0] - 10, head[1] - 12, 5,
      head[0], head[1], 36
    );
    headGlow.addColorStop(0, '#a9ffe2');
    headGlow.addColorStop(0.4, '#61e5b7');
    headGlow.addColorStop(1, '#208a68');

    ctx.save();
    ctx.shadowColor = 'rgba(76,231,181,.35)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(head[0], head[1], 31, 0, Math.PI * 2);
    ctx.fillStyle = headGlow;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(4, 19, 13, 0.95)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#f2fff9';
    ctx.beginPath();
    ctx.ellipse(head[0] - 10, head[1] - 9, 6.2, 7.4, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(head[0] + 11, head[1] - 8, 6.2, 7.4, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#08150f';
    ctx.beginPath();
    ctx.ellipse(head[0] - 8.8, head[1] - 7.4, 2.1, 3.1, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(head[0] + 9.4, head[1] - 6.4, 2.1, 3.1, 0.12, 0, Math.PI * 2);
    ctx.fill();

    const tongueWave = Math.sin(t * 4.2) * 3;
    ctx.strokeStyle = '#ef6a59';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(head[0] + 27, head[1] + 5);
    ctx.quadraticCurveTo(head[0] + 42, head[1] + 5 + tongueWave, head[0] + 52, head[1] + 1 + tongueWave);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(head[0] + 52, head[1] + 1 + tongueWave);
    ctx.lineTo(head[0] + 61, head[1] - 5 + tongueWave);
    ctx.moveTo(head[0] + 52, head[1] + 1 + tongueWave);
    ctx.lineTo(head[0] + 61, head[1] + 6 + tongueWave);
    ctx.stroke();
  }

  function frame(ts) {
    const t = ts / 1000;
    ctx.clearRect(0, 0, W, H);
    drawParticles(t);
    requestAnimationFrame(frame);
  }

  function startGame() {
    if (window.DevourAudio) window.DevourAudio.playMenu();
    screen.classList.add('gone');
    window.setTimeout(() => { screen.style.display = 'none'; }, 460);
    if (window.DevourCampaign && typeof window.DevourCampaign.showRegions === 'function') {
      window.DevourCampaign.showRegions();
      return;
    }
    if (typeof window.startDevour === 'function') {
      if (window.DevourAudio) window.DevourAudio.playGameplay();
      window.startDevour(0);
    }
  }

  function continueGame() {
    if (!window.DevourCampaign) return;
    if (window.DevourAudio) window.DevourAudio.playMenu();
    screen.classList.add('gone');
    window.setTimeout(() => { screen.style.display = 'none'; }, 460);
    window.DevourCampaign.showLastRegion();
  }

  function refreshBest() {
    try {
      const best = Number(window.localStorage.getItem('devour-best-v2') || 0);
      document.getElementById('stBest').textContent = String(best);
    } catch (err) {
      /* localStorage may be unavailable when opened as a local file. */
    }
    if (window.DevourCampaign) window.DevourCampaign.refreshEntryState();
  }

  function restartGame() {
    if (window.__devourApi && typeof window.__devourApi.resetGame === 'function') {
      const currentLevel = window.__devour && Number.isInteger(window.__devour.level)
        ? window.__devour.level
        : undefined;
      window.__devourApi.resetGame(currentLevel);
      return;
    }
    sendKey('keydown', 'r');
  }

  function continuePausedGame() {
    if (!window.__devour || !window.__devour.paused) return;
    window.__devour.paused = false;
    document.getElementById('btnOverlayContinue').hidden = true;
    document.getElementById('overlay').classList.remove('show');
  }

  function returnToMenu() {
    if (window.__devour) window.__devour.paused = true;
    if (window.DevourAudio) window.DevourAudio.playMenu();
    if (window.DevourCampaign) window.DevourCampaign.hide();
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('show');
    panel.innerHTML = '';
    panel.classList.remove('show');
    screen.style.display = 'grid';
    requestAnimationFrame(() => screen.classList.remove('gone'));
    refreshBest();
  }

  function returnToCampaignMap() {
    if (window.__devour) window.__devour.paused = true;
    if (window.DevourAudio) window.DevourAudio.playMenu();
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('show');
    panel.innerHTML = '';
    panel.classList.remove('show');
    if (!window.DevourCampaign) return;
    screen.classList.add('gone');
    screen.style.display = 'none';
    window.DevourCampaign.showLastRegion();
  }

  document.getElementById('btnStart').addEventListener('click', startGame);
  document.getElementById('btnContinue').addEventListener('click', continueGame);
  document.getElementById('btnRestartGame').addEventListener('click', restartGame);
  document.getElementById('btnGameMap').addEventListener('click', returnToCampaignMap);
  document.getElementById('btnMainMenu').addEventListener('click', returnToMenu);
  document.getElementById('btnOverlayRestart').addEventListener('click', restartGame);
  document.getElementById('btnOverlayContinue').addEventListener('click', continuePausedGame);
  document.getElementById('btnOverlayMap').addEventListener('click', returnToCampaignMap);
  document.getElementById('btnOverlayMenu').addEventListener('click', returnToMenu);
  document.getElementById('btnOverlaySettings').addEventListener('click', () => {
    if (window.__devour) window.__devour.paused = true;
    window.DevourSkills?.showTab?.('skills');
    document.getElementById('btnSettings').click();
  });

  document.getElementById('btnHelp').addEventListener('click', () => {
    panel.innerHTML = [
      'WASD / 方向键：8 方向移动',
      '空格：发射毒牙（消耗 1 节体长，最低保留 2 节）',
      'E：使用已装备的核心技能（绿色 3×3 能量波 / 红色 2×2 烈焰弹）',
      'Q：已装备技能（金核壁垒护盾 / 冰霜吐息扇形攻击）',
      'F：切换全图 / 跟随视角　P：暂停　R：重开',
      '击败 Boss 后吞噬发光核心，可在“设置 → 技能”中更换 E / Q 槽',
      '体长就是血量：受伤从尾部断节，体长 ≤ 1 时死亡',
      '吃金色豆子变长，击杀小怪 +2 节，清光敌人后门会打开',
    ].join('<br>');
    panel.classList.add('show');
  });

  document.getElementById('btnCredits').addEventListener('click', () => {
    panel.innerHTML = [
      '吞噬之蛇 · v0.1 prototype',
      '设计与实现：郭宇',
      '引擎：Three.js　美术：Canvas 程序化生成',
    ].join('<br>');
    panel.classList.add('show');
  });

  window.addEventListener('keydown', (e) => {
    if (screen.classList.contains('gone')) return;
    if (document.body.classList.contains('settings-open')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
  });

  try {
    const best = Number(window.localStorage.getItem('devour-best-v2') || 0);
    document.getElementById('stBest').textContent = String(best);
  } catch (err) {
    /* file:// 下可能禁用 localStorage，忽略 */
  }
  if (window.DevourCampaign) window.DevourCampaign.refreshEntryState();

  const sendKey = (type, key) => {
    window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
  };

  document.querySelectorAll('[data-key]').forEach((button) => {
    const key = button.getAttribute('data-key');
    let repeat = 0;
    const release = () => {
      if (repeat) window.clearInterval(repeat);
      repeat = 0;
      sendKey('keyup', key);
    };
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      try {
        if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
      } catch (err) {
        /* Synthetic test events do not own a pointer capture. */
      }
      sendKey('keydown', key);
      if (key !== ' ' && key !== 'e') return;
      repeat = window.setInterval(() => sendKey('keydown', key), 150);
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  });

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
