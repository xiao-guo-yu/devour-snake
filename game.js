/* DEVOUR — 三小关 + Boss 原型
 * 45×45 格 · 8 方向格点移动 · 体长 = HP · 射击消耗体节
 * 流程：清光敌人 → 门开 → 下一关 ×3 → Boss → 三张技能卡（射击选择）→ 传送门通关
 */
(() => {
  'use strict';

  // ---------- 常量 ----------
  const N = 45;
  const HALF = (N - 1) / 2;
  const STEP = 0.12;
  const START_LEN = 3;
  const MAX_BODY = 80;
  const SHOOT_COOLDOWN = 0.14;
  const BULLET_SPEED = 18;
  const INVULN = 0.8;
  const ENEMY_SPEED = 1.35;
  const ENEMY_COOL_SPEED = 0.55;
  const BOSS_HP = 140;
  const BOSS_SPEED = 1.0;
  // ⚠️ 测试用：直接从第 5 关（神庙·柱厅）开始；恢复正常游戏请改回 0
  const DEBUG_START_LEVEL = 0;
  const DOOR_CELL = { i: 22, j: 1 };
  const BOSS_CELL = { i: 22, j: 22 };

  // 关卡表：温室 3 小关 + Rootcoil → 神庙 3 小关 + 法老
  const ROOMS = [
    { theme: 'green', kind: 'clear', enemies: 8, types: ['spore'], name: '腐殖温室 · 前厅' },
    { theme: 'green', kind: 'clear', enemies: 10, types: ['vine'], name: '腐殖温室 · 根礼拜堂' },
    { theme: 'green', kind: 'clear', enemies: 12, types: ['trap'], name: '腐殖温室 · 根之圣所' },
    { theme: 'green', kind: 'boss', boss: 'rootcoil', name: '腐根盘蛇 · ROOTCOIL' },
    { theme: 'temple', kind: 'clear', enemies: 9, types: ['scarab'], name: '沙海神庙 · 柱厅' },
    { theme: 'temple', kind: 'clear', enemies: 11, types: ['mummy'], name: '沙海神庙 · 供奉廊' },
    { theme: 'temple', kind: 'clear', enemies: 13, types: ['anubis'], name: '沙海神庙 · 内殿' },
    { theme: 'temple', kind: 'boss', boss: 'pharaoh', name: '黄金法老 · PHARAOH' },
  ];
  const ROOM_COUNT = ROOMS.length;

  // ---------- 渲染基础 ----------
  const stage = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b0a);
  scene.fog = new THREE.Fog(0x070b0a, 55, 110);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
  camera.up.set(0, 0, -1);
  camera.position.set(0, 80, 0);
  camera.lookAt(0, 0, 0);

  const hemi = new THREE.HemisphereLight(0xa8e6cf, 0x0a1411, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe3b3, 0.95);
  sun.position.set(20, 40, 14);
  scene.add(sun);

  // ---------- 坐标 ----------
  const cellX = (i) => i - HALF;
  const cellZ = (j) => j - HALF;

  // ---------- 地板 ----------
  const floorGeo = new THREE.BoxGeometry(0.96, 0.12, 0.96);
  const matA = new THREE.MeshStandardMaterial({ color: 0x1b2a25, roughness: 0.95 });
  const matB = new THREE.MeshStandardMaterial({ color: 0x22352e, roughness: 0.95 });
  const tilesA = new THREE.InstancedMesh(floorGeo, matA, Math.ceil((N * N) / 2));
  const tilesB = new THREE.InstancedMesh(floorGeo, matB, Math.ceil((N * N) / 2));
  {
    const m = new THREE.Matrix4();
    let a = 0, b = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        m.makeTranslation(cellX(i), -0.06, cellZ(j));
        if ((i + j) % 2 === 0) tilesA.setMatrixAt(a++, m);
        else tilesB.setMatrixAt(b++, m);
      }
    }
    tilesA.count = a;
    tilesB.count = b;
    tilesA.instanceMatrix.needsUpdate = true;
    tilesB.instanceMatrix.needsUpdate = true;
  }
  scene.add(tilesA, tilesB);

  // ---------- 外墙 ----------
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c3d36, roughness: 0.9 });
  const wallGeo = new THREE.BoxGeometry(1, 1.1, 1);
  {
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, (N + 2) * 4);
    const m = new THREE.Matrix4();
    const edge = HALF + 1;
    let k = 0;
    for (let i = -1; i <= N; i++) {
      m.makeTranslation(cellX(i), 0.5, -edge); walls.setMatrixAt(k++, m);
      m.makeTranslation(cellX(i), 0.5, edge); walls.setMatrixAt(k++, m);
    }
    for (let j = 0; j < N; j++) {
      // 左侧墙在 j=22 留一个门洞，通向出生小房间
      if (j !== 22) {
        m.makeTranslation(-edge, 0.5, cellZ(j));
        walls.setMatrixAt(k++, m);
      }
      m.makeTranslation(edge, 0.5, cellZ(j)); walls.setMatrixAt(k++, m);
    }
    walls.count = k;
    scene.add(walls);
  }

  // ---------- 出生小房间：在地图左侧外面，不占场内格子 ----------
  const START_ROOM = { i0: -5, i1: -2, j0: 21, j1: 24, doorI: -1, doorJ: 22 };
  const startRoom = new THREE.Group();
  let startRoomGate = null;
  {
    const roomWallMat = new THREE.MeshStandardMaterial({ color: 0x2c3d36, roughness: 0.9 });
    const roomFloorMat = new THREE.MeshBasicMaterial({ color: 0x26342b, fog: false });
    const rw = START_ROOM.i1 - START_ROOM.i0 + 1;
    const rh = START_ROOM.j1 - START_ROOM.j0 + 1;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), roomFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(
      cellX((START_ROOM.i0 + START_ROOM.i1) / 2),
      0.03,
      cellZ((START_ROOM.j0 + START_ROOM.j1) / 2)
    );
    startRoom.add(floor);

    const addWall = (ci, cj) => {
      const box = new THREE.Mesh(wallGeo, roomWallMat);
      box.position.set(cellX(ci), 0.55, cellZ(cj));
      startRoom.add(box);
    };
    for (let i = START_ROOM.i0 - 1; i <= START_ROOM.i1; i++) {
      addWall(i, START_ROOM.j0 - 1);
      addWall(i, START_ROOM.j1 + 1);
    }
    for (let j = START_ROOM.j0; j <= START_ROOM.j1; j++) {
      if (j !== START_ROOM.doorJ) addWall(START_ROOM.i0 - 1, j);
    }

    startRoomGate = new THREE.Mesh(wallGeo, roomWallMat);
    startRoomGate.position.set(cellX(START_ROOM.doorI), 0.55, cellZ(START_ROOM.doorJ));
    startRoom.add(startRoomGate);

    startRoom.visible = false;
    scene.add(startRoom);
  }

  // 房间消失后补上的墙块（把外墙门洞封死）
  const doorPlug = new THREE.Mesh(
    wallGeo,
    new THREE.MeshStandardMaterial({ color: 0x2c3d36, roughness: 0.9 })
  );
  doorPlug.position.set(cellX(START_ROOM.doorI), 0.55, cellZ(START_ROOM.doorJ));
  doorPlug.visible = false;
  scene.add(doorPlug);

  function startRoomWalls() {
    const cells = [];
    for (let i = START_ROOM.i0 - 1; i <= START_ROOM.i1; i++) {
      cells.push([i, START_ROOM.j0 - 1], [i, START_ROOM.j1 + 1]);
    }
    for (let j = START_ROOM.j0; j <= START_ROOM.j1; j++) {
      if (j !== START_ROOM.doorJ) cells.push([START_ROOM.i0 - 1, j]);
    }
    return cells;
  }

  /** 出生房间期间允许在房间/门洞里活动（场外格子不算场地） */
  function inStartRoom(i, j) {
    if (!(state.roomActive || state.roomTimer > 0)) return false;
    if (i >= START_ROOM.i0 && i <= START_ROOM.i1 && j >= START_ROOM.j0 && j <= START_ROOM.j1) return true;
    return i === START_ROOM.doorI && j === START_ROOM.doorJ;
  }

  // ---------- 障碍柱子 ----------
  const obstacles = new Set();
  const STUMP_COUNT = 8;

  const inBounds = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  const isObstacle = (i, j) => obstacles.has(`${i},${j}`);

  // ---------- 手绘 sprite（canvas 2D 贴图） ----------
  function spriteTexture(size, draw) {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext && canvas.getContext('2d');
    if (!g) return null;
    draw(g, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }

  const INK = '#08160f';

  function drawSnakeHead(g, S) {
    const cx = S * 0.5, cy = S * 0.52;
    const w = S * 0.27, h = S * 0.36;
    g.clearRect(0, 0, S, S);
    // 头
    g.beginPath();
    g.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
    g.fillStyle = '#35e0c4';
    g.fill();
    g.lineWidth = S * 0.038;
    g.strokeStyle = INK;
    g.stroke();
    // 头顶高光
    g.beginPath();
    g.ellipse(cx - w * 0.18, cy - h * 0.3, w * 0.5, h * 0.32, -0.2, 0, Math.PI * 2);
    g.fillStyle = 'rgba(190, 255, 246, 0.55)';
    g.fill();
    // 白点眼
    for (const dx of [-0.46, 0.46]) {
      g.beginPath();
      g.arc(cx + w * dx, cy - h * 0.42, S * 0.045, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
      g.lineWidth = S * 0.012;
      g.strokeStyle = 'rgba(8,22,15,0.7)';
      g.stroke();
    }
    // 鼻孔
    for (const dx of [-0.12, 0.12]) {
      g.beginPath();
      g.arc(cx + w * dx, cy - h * 0.85, S * 0.012, 0, Math.PI * 2);
      g.fillStyle = INK;
      g.fill();
    }
  }

  function drawStump(g, S) {
    const cx = S / 2, cy = S / 2;
    const barkR = S * 0.40;
    const faceR = S * 0.33;
    g.clearRect(0, 0, S, S);

    // 外圈树皮
    g.beginPath();
    g.arc(cx, cy, barkR, 0, Math.PI * 2);
    g.fillStyle = '#4a2c18';
    g.fill();
    g.lineWidth = S * 0.035;
    g.strokeStyle = INK;
    g.stroke();

    // 树皮竖纹
    g.strokeStyle = '#33200f';
    g.lineWidth = S * 0.016;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * barkR * 0.86, cy + Math.sin(a) * barkR * 0.86);
      g.lineTo(cx + Math.cos(a) * barkR * 0.99, cy + Math.sin(a) * barkR * 0.99);
      g.stroke();
    }

    // 切面
    g.beginPath();
    g.arc(cx, cy, faceR, 0, Math.PI * 2);
    g.fillStyle = '#8a5a34';
    g.fill();
    g.lineWidth = S * 0.026;
    g.strokeStyle = '#2a170c';
    g.stroke();

    // 年轮
    g.strokeStyle = '#a9713f';
    g.lineWidth = S * 0.015;
    for (let r = 0.9; r > 0.12; r -= 0.16) {
      g.beginPath();
      g.arc(cx, cy, faceR * r, 0, Math.PI * 2);
      g.stroke();
    }

    // 放射状裂纹
    g.strokeStyle = '#2a170c';
    g.lineWidth = S * 0.02;
    for (const a of [0.3, 1.6, 2.7, 4.4, 5.5]) {
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * faceR * 0.12, cy + Math.sin(a) * faceR * 0.12);
      g.lineTo(cx + Math.cos(a) * faceR * 0.95, cy + Math.sin(a) * faceR * 0.95);
      g.stroke();
    }

    // 边缘苔藓
    g.fillStyle = '#5f8a3a';
    for (const a of [0.9, 2.2, 4.9]) {
      g.beginPath();
      g.ellipse(
        cx + Math.cos(a) * barkR * 0.95,
        cy + Math.sin(a) * barkR * 0.95,
        S * 0.065, S * 0.04, a, 0, Math.PI * 2
      );
      g.fill();
    }
  }

  function drawPortal(g, S) {
    const cx = S / 2, cy = S / 2;
    g.clearRect(0, 0, S, S);

    // 中心黑洞
    const core = g.createRadialGradient(cx, cy, 1, cx, cy, S * 0.25);
    core.addColorStop(0, '#000000');
    core.addColorStop(0.7, '#04030a');
    core.addColorStop(1, 'rgba(40, 12, 70, 0)');
    g.fillStyle = core;
    g.beginPath();
    g.arc(cx, cy, S * 0.25, 0, Math.PI * 2);
    g.fill();

    // 紫 / 青交错的漩涡环
    const rings = [
      { r: 0.44, w: 0.045, c: 'rgba(120, 80, 255, 0.55)' },
      { r: 0.40, w: 0.065, c: 'rgba(60, 220, 230, 0.85)' },
      { r: 0.35, w: 0.055, c: 'rgba(150, 90, 255, 0.75)' },
      { r: 0.30, w: 0.045, c: 'rgba(70, 240, 225, 0.9)' },
      { r: 0.255, w: 0.035, c: 'rgba(180, 120, 255, 0.8)' },
    ];
    for (const ring of rings) {
      g.beginPath();
      g.arc(cx, cy, S * ring.r, 0, Math.PI * 2);
      g.strokeStyle = ring.c;
      g.lineWidth = S * ring.w;
      g.stroke();
    }

    // 断续弧光
    g.lineCap = 'round';
    for (let k = 0; k < 12; k++) {
      const a0 = k * 0.52;
      g.beginPath();
      g.arc(cx, cy, S * (0.32 + (k % 3) * 0.035), a0, a0 + 0.46);
      g.strokeStyle = k % 2 ? 'rgba(120, 250, 245, 0.9)' : 'rgba(160, 110, 255, 0.9)';
      g.lineWidth = S * 0.012;
      g.stroke();
    }

    // 星点
    g.fillStyle = 'rgba(220, 240, 255, 0.9)';
    for (const [x, y, r] of [[0.30, 0.42, 0.007], [0.72, 0.55, 0.005], [0.55, 0.27, 0.004], [0.40, 0.73, 0.005]]) {
      g.beginPath();
      g.arc(S * x, S * y, S * r, 0, Math.PI * 2);
      g.fill();
    }
  }

  function drawSpore(g, S) {
    const cx = S / 2, cy = S / 2, r = S * 0.36;
    g.clearRect(0, 0, S, S);
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = '#8a7b86';
    g.fill();
    g.lineWidth = S * 0.04;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = '#2b2028';
    const spots = [[-0.35, -0.3, 0.16], [0.25, -0.15, 0.2], [-0.1, 0.3, 0.18], [0.42, 0.28, 0.12], [-0.45, 0.35, 0.1]];
    for (const [dx, dy, rr] of spots) {
      g.beginPath();
      g.ellipse(cx + r * dx, cy + r * dy, r * rr, r * rr * 0.8, 0.4, 0, Math.PI * 2);
      g.fill();
    }
    // 小柄
    g.fillStyle = '#5b4f59';
    g.fillRect(cx - S * 0.05, cy + r * 0.85, S * 0.1, S * 0.1);
  }

  function drawVine(g, S) {
    g.clearRect(0, 0, S, S);
    g.strokeStyle = '#e0c04a';
    g.lineWidth = S * 0.13;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(S * 0.5, S * 0.86);
    g.bezierCurveTo(S * 0.2, S * 0.7, S * 0.8, S * 0.55, S * 0.45, S * 0.3);
    g.bezierCurveTo(S * 0.3, S * 0.18, S * 0.55, S * 0.12, S * 0.62, S * 0.1);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = S * 0.03;
    g.stroke();
    // 刺
    g.fillStyle = '#a8791f';
    const thorns = [[0.34, 0.62, -0.6], [0.66, 0.5, 0.7], [0.36, 0.34, -0.5], [0.6, 0.22, 0.5]];
    for (const [x, y, a] of thorns) {
      g.save();
      g.translate(S * x, S * y);
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(S * 0.16, S * 0.02);
      g.lineTo(0, S * 0.07);
      g.closePath();
      g.fill();
      g.restore();
    }
    // 叶
    g.fillStyle = '#c9a83a';
    for (const [x, y, a] of [[0.7, 0.78, 0.5], [0.3, 0.8, -0.4], [0.72, 0.3, 0.9]]) {
      g.save();
      g.translate(S * x, S * y);
      g.rotate(a);
      g.beginPath();
      g.ellipse(0, 0, S * 0.1, S * 0.05, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }

  function drawTrap(g, S) {
    const cx = S / 2, cy = S * 0.54, r = S * 0.3;
    g.clearRect(0, 0, S, S);
    g.beginPath();
    g.ellipse(cx, cy, r, r * 1.1, 0, 0, Math.PI * 2);
    g.fillStyle = '#6b7a4a';
    g.fill();
    g.lineWidth = S * 0.04;
    g.strokeStyle = INK;
    g.stroke();
    // 缝合线
    g.beginPath();
    g.moveTo(cx, cy - r * 1.05);
    for (let i = 0; i <= 6; i++) {
      const y = cy - r + (i / 6) * r * 2;
      g.lineTo(cx + (i % 2 ? 0.18 : -0.18) * r, y);
    }
    g.strokeStyle = INK;
    g.lineWidth = S * 0.02;
    g.stroke();
    // 牙
    g.fillStyle = '#e8e3d3';
    for (let i = 0; i < 7; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = cx + Math.cos(a) * r * 0.95;
      const y = cy + Math.sin(a) * r * 0.95;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * S * 0.05, y + Math.sin(a) * S * 0.05);
      g.lineTo(x - Math.sin(a) * S * 0.035, y + Math.cos(a) * S * 0.035);
      g.closePath();
      g.fill();
    }
  }

  function drawBoss(g, S) {
    const cx = S / 2, cy = S * 0.52;
    g.clearRect(0, 0, S, S);
    // 根须轮廓
    g.save();
    g.translate(cx, cy);
    g.beginPath();
    g.ellipse(0, 0, S * 0.34, S * 0.32, 0, 0, Math.PI * 2);
    g.fillStyle = '#6b4a2f';
    g.fill();
    g.lineWidth = S * 0.035;
    g.strokeStyle = INK;
    g.stroke();
    // 苔藓斑
    g.fillStyle = 'rgba(111,138,69,0.85)';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.beginPath();
      g.ellipse(Math.cos(a) * S * 0.26, Math.sin(a) * S * 0.24, S * 0.07, S * 0.045, a, 0, Math.PI * 2);
      g.fill();
    }
    // 琥珀眼
    for (const dx of [-0.13, 0.13]) {
      g.beginPath();
      g.ellipse(dx * S, -S * 0.02, S * 0.055, S * 0.045, 0, 0, Math.PI * 2);
      g.fillStyle = '#ffb347';
      g.fill();
      g.lineWidth = S * 0.018;
      g.strokeStyle = INK;
      g.stroke();
      g.beginPath();
      g.ellipse(dx * S, -S * 0.02, S * 0.012, S * 0.03, 0, 0, Math.PI * 2);
      g.fillStyle = '#1a0d05';
      g.fill();
    }
    // 鼻子与嘴
    g.beginPath();
    g.moveTo(-S * 0.09, S * 0.13);
    g.lineTo(0, S * 0.17);
    g.lineTo(S * 0.09, S * 0.13);
    g.strokeStyle = INK;
    g.lineWidth = S * 0.02;
    g.stroke();
    g.restore();
  }

  function drawScarab(g, S, broken) {
    const cx = S / 2, cy = S / 2;
    g.clearRect(0, 0, S, S);
    // 腿
    g.strokeStyle = INK;
    g.lineWidth = S * 0.03;
    for (const [a, len] of [[-2.5, 0.42], [-2.1, 0.46], [-1.0, 0.46], [-0.6, 0.42], [0.5, 0.44], [0.9, 0.46], [2.1, 0.46], [2.5, 0.42]]) {
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * S * 0.16, cy + Math.sin(a) * S * 0.16);
      g.lineTo(cx + Math.cos(a) * S * len, cy + Math.sin(a) * S * len);
      g.stroke();
    }
    // 甲壳（被打中后变灰）
    g.beginPath();
    g.ellipse(cx, cy + S * 0.05, S * 0.3, S * 0.34, 0, 0, Math.PI * 2);
    g.fillStyle = broken ? '#8d8d8d' : '#d9a441';
    g.fill();
    g.lineWidth = S * 0.04;
    g.strokeStyle = INK;
    g.stroke();
    // 中缝
    g.beginPath();
    g.moveTo(cx, cy - S * 0.24);
    g.lineTo(cx, cy + S * 0.36);
    g.stroke();
    // 头
    g.beginPath();
    g.ellipse(cx, cy - S * 0.28, S * 0.16, S * 0.12, 0, 0, Math.PI * 2);
    g.fillStyle = broken ? '#6f6f6f' : '#b07d24';
    g.fill();
    g.stroke();
    // 双角
    g.beginPath();
    g.moveTo(cx - S * 0.1, cy - S * 0.34);
    g.lineTo(cx - S * 0.2, cy - S * 0.46);
    g.moveTo(cx + S * 0.1, cy - S * 0.34);
    g.lineTo(cx + S * 0.2, cy - S * 0.46);
    g.stroke();
    // 高光
    g.beginPath();
    g.ellipse(cx - S * 0.1, cy - S * 0.02, S * 0.08, S * 0.14, -0.4, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255, 235, 170, 0.7)';
    g.fill();
  }

  function drawMummy(g, S) {
    const cx = S / 2;
    g.clearRect(0, 0, S, S);
    // 身体：圆滚滚的绷带团
    g.beginPath();
    g.ellipse(cx, S * 0.58, S * 0.24, S * 0.28, 0, 0, Math.PI * 2);
    g.fillStyle = '#efe4cd';
    g.fill();
    g.lineWidth = S * 0.035;
    g.strokeStyle = INK;
    g.stroke();
    // 身体绷带
    g.strokeStyle = '#cbb995';
    g.lineWidth = S * 0.018;
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      g.moveTo(cx - S * 0.21, S * (0.44 + k * 0.06));
      g.lineTo(cx + S * 0.21, S * (0.4 + k * 0.06));
      g.stroke();
    }
    // 小手
    for (const dx of [-0.26, 0.26]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.52, S * 0.055, 0, Math.PI * 2);
      g.fillStyle = '#f6d7b0';
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = S * 0.025;
      g.stroke();
    }
    // 大脑袋
    g.beginPath();
    g.arc(cx, S * 0.3, S * 0.19, 0, Math.PI * 2);
    g.fillStyle = '#f2e7d2';
    g.fill();
    g.lineWidth = S * 0.035;
    g.strokeStyle = INK;
    g.stroke();
    // 绷带交叉
    g.strokeStyle = '#d3c3a2';
    g.lineWidth = S * 0.02;
    g.beginPath();
    g.moveTo(cx - S * 0.16, S * 0.2);
    g.lineTo(cx + S * 0.12, S * 0.36);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + S * 0.16, S * 0.22);
    g.lineTo(cx - S * 0.1, S * 0.38);
    g.stroke();
    // 露出的脸
    g.beginPath();
    g.ellipse(cx, S * 0.33, S * 0.115, S * 0.1, 0, 0, Math.PI * 2);
    g.fillStyle = '#f6d7b0';
    g.fill();
    // 大眼睛
    for (const dx of [-0.058, 0.058]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.31, S * 0.038, 0, Math.PI * 2);
      g.fillStyle = '#2b2320';
      g.fill();
      g.beginPath();
      g.arc(cx + S * dx - S * 0.012, S * 0.3, S * 0.013, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
    }
    // 嘴
    g.beginPath();
    g.arc(cx, S * 0.36, S * 0.028, 0.15, Math.PI - 0.15);
    g.strokeStyle = '#8a5a48';
    g.lineWidth = S * 0.014;
    g.stroke();
  }

  function drawAnubis(g, S) {
    const cx = S / 2;
    g.clearRect(0, 0, S, S);
    // 身体
    g.beginPath();
    g.ellipse(cx, S * 0.62, S * 0.17, S * 0.22, 0, 0, Math.PI * 2);
    g.fillStyle = '#2b2b33';
    g.fill();
    g.lineWidth = S * 0.035;
    g.strokeStyle = INK;
    g.stroke();
    // 金项圈
    g.beginPath();
    g.ellipse(cx, S * 0.47, S * 0.16, S * 0.06, 0, 0, Math.PI * 2);
    g.fillStyle = '#e0b64a';
    g.fill();
    // 头
    g.beginPath();
    g.ellipse(cx, S * 0.3, S * 0.13, S * 0.15, 0, 0, Math.PI * 2);
    g.fillStyle = '#1d1d24';
    g.fill();
    g.stroke();
    // 长耳
    for (const dx of [-0.08, 0.08]) {
      g.beginPath();
      g.moveTo(cx + S * dx, S * 0.2);
      g.lineTo(cx + S * dx - S * 0.03, S * 0.04);
      g.lineTo(cx + S * dx + S * 0.05, S * 0.18);
      g.closePath();
      g.fillStyle = '#1d1d24';
      g.fill();
      g.stroke();
    }
    // 眼
    for (const dx of [-0.05, 0.05]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.29, S * 0.018, 0, Math.PI * 2);
      g.fillStyle = '#ffd47a';
      g.fill();
    }
    // 法杖
    g.beginPath();
    g.moveTo(cx + S * 0.26, S * 0.2);
    g.lineTo(cx + S * 0.26, S * 0.86);
    g.strokeStyle = '#d9a441';
    g.lineWidth = S * 0.035;
    g.stroke();
    g.beginPath();
    g.arc(cx + S * 0.26, S * 0.18, S * 0.06, 0, Math.PI * 2);
    g.stroke();
  }

  function drawPharaoh(g, S) {
    const cx = S / 2;
    g.clearRect(0, 0, S, S);

    // 脚下的绿色能量环
    const glow = g.createRadialGradient(cx, S * 0.87, S * 0.02, cx, S * 0.87, S * 0.36);
    glow.addColorStop(0, 'rgba(96, 255, 150, 0.55)');
    glow.addColorStop(1, 'rgba(96, 255, 150, 0)');
    g.fillStyle = glow;
    g.beginPath();
    g.ellipse(cx, S * 0.87, S * 0.36, S * 0.1, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(cx, S * 0.87, S * 0.26, S * 0.06, 0, 0, Math.PI * 2);
    g.strokeStyle = '#7dffb0';
    g.lineWidth = S * 0.012;
    g.stroke();

    // 权杖（先画，挡在身体后面）
    g.strokeStyle = '#c99a2e';
    g.lineWidth = S * 0.024;
    g.beginPath();
    g.moveTo(S * 0.28, S * 0.9);
    g.lineTo(S * 0.28, S * 0.3);
    g.stroke();
    g.beginPath();
    g.arc(S * 0.32, S * 0.28, S * 0.05, Math.PI * 0.9, Math.PI * 2.2);
    g.stroke();
    g.fillStyle = '#e8c25a';
    g.beginPath();
    g.arc(S * 0.28, S * 0.24, S * 0.02, 0, Math.PI * 2);
    g.fill();

    // 头巾（nemes）：上窄下宽的梯形
    g.beginPath();
    g.moveTo(cx - S * 0.13, S * 0.22);
    g.lineTo(cx + S * 0.13, S * 0.22);
    g.lineTo(cx + S * 0.27, S * 0.58);
    g.lineTo(cx - S * 0.27, S * 0.58);
    g.closePath();
    g.fillStyle = '#e9c258';
    g.fill();
    g.lineWidth = S * 0.028;
    g.strokeStyle = INK;
    g.stroke();
    // 蓝金条纹
    g.save();
    g.beginPath();
    g.moveTo(cx - S * 0.13, S * 0.22);
    g.lineTo(cx + S * 0.13, S * 0.22);
    g.lineTo(cx + S * 0.27, S * 0.58);
    g.lineTo(cx - S * 0.27, S * 0.58);
    g.closePath();
    g.clip();
    g.fillStyle = '#2f5f9e';
    for (let k = -3; k <= 3; k++) {
      g.fillRect(cx + S * k * 0.075 - S * 0.02, S * 0.2, S * 0.026, S * 0.4);
    }
    g.restore();
    g.beginPath();
    g.moveTo(cx - S * 0.13, S * 0.22);
    g.lineTo(cx + S * 0.13, S * 0.22);
    g.lineTo(cx + S * 0.27, S * 0.58);
    g.lineTo(cx - S * 0.27, S * 0.58);
    g.closePath();
    g.lineWidth = S * 0.028;
    g.strokeStyle = INK;
    g.stroke();

    // 白色长袍
    g.beginPath();
    g.moveTo(cx - S * 0.15, S * 0.56);
    g.lineTo(cx + S * 0.15, S * 0.56);
    g.lineTo(cx + S * 0.21, S * 0.88);
    g.lineTo(cx - S * 0.21, S * 0.88);
    g.closePath();
    g.fillStyle = '#f3ecdb';
    g.fill();
    g.lineWidth = S * 0.026;
    g.strokeStyle = INK;
    g.stroke();
    // 腰带与宝石
    g.fillStyle = '#e0b64a';
    g.fillRect(cx - S * 0.19, S * 0.66, S * 0.38, S * 0.05);
    g.beginPath();
    g.arc(cx, S * 0.685, S * 0.032, 0, Math.PI * 2);
    g.fillStyle = '#2f8fd8';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = S * 0.012;
    g.stroke();

    // 手臂
    g.strokeStyle = '#e8c36a';
    g.lineWidth = S * 0.05;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - S * 0.15, S * 0.6);
    g.lineTo(cx - S * 0.24, S * 0.66);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + S * 0.15, S * 0.6);
    g.lineTo(cx + S * 0.24, S * 0.72);
    g.stroke();

    // 头
    g.beginPath();
    g.ellipse(cx, S * 0.4, S * 0.15, S * 0.16, 0, 0, Math.PI * 2);
    g.fillStyle = '#f0cd72';
    g.fill();
    g.lineWidth = S * 0.026;
    g.strokeStyle = INK;
    g.stroke();

    // 绿色发光眼 + 怒眉
    for (const dx of [-0.06, 0.06]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.39, S * 0.042, 0, Math.PI * 2);
      g.fillStyle = '#8dffb4';
      g.fill();
      g.beginPath();
      g.arc(cx + S * dx, S * 0.39, S * 0.032, 0, Math.PI * 2);
      g.fillStyle = '#3fe08a';
      g.fill();
      g.beginPath();
      g.moveTo(cx + S * (dx - 0.05), S * 0.33);
      g.lineTo(cx + S * (dx + 0.04), S * 0.35);
      g.strokeStyle = INK;
      g.lineWidth = S * 0.022;
      g.stroke();
    }
    // 嘴
    g.beginPath();
    g.moveTo(cx - S * 0.045, S * 0.47);
    g.lineTo(cx + S * 0.045, S * 0.47);
    g.strokeStyle = INK;
    g.lineWidth = S * 0.018;
    g.stroke();

    // 额前圣蛇（uraeus）
    g.beginPath();
    g.ellipse(cx, S * 0.255, S * 0.03, S * 0.045, 0, 0, Math.PI * 2);
    g.fillStyle = '#2f8fd8';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = S * 0.012;
    g.stroke();
  }

  function drawColumn(g, S) {
    // 从上方斜看的小金字塔：阶梯 + 象形文字 + 侧影
    const cx = S / 2;
    const baseY = S * 0.82;
    const topY = S * 0.14;
    const halfBase = S * 0.38;
    g.clearRect(0, 0, S, S);

    // 左侧暗面
    g.beginPath();
    g.moveTo(cx, topY);
    g.lineTo(cx - halfBase, baseY);
    g.lineTo(cx, baseY);
    g.closePath();
    g.fillStyle = '#b08a4f';
    g.fill();
    // 右侧亮面
    g.beginPath();
    g.moveTo(cx, topY);
    g.lineTo(cx + halfBase, baseY);
    g.lineTo(cx, baseY);
    g.closePath();
    g.fillStyle = '#e0c188';
    g.fill();

    // 阶梯横线
    g.strokeStyle = '#8a6a38';
    g.lineWidth = S * 0.012;
    for (let k = 1; k <= 6; k++) {
      const t = k / 7;
      const y = topY + (baseY - topY) * t;
      const half = halfBase * t;
      g.beginPath();
      g.moveTo(cx - half, y);
      g.lineTo(cx + half, y);
      g.stroke();
    }

    // 象形文字装饰
    g.fillStyle = '#8a6a38';
    for (let k = 0; k < 3; k++) {
      const y = topY + (baseY - topY) * (0.3 + k * 0.18);
      g.fillRect(cx - S * 0.045, y - S * 0.012, S * 0.09, S * 0.024);
    }

    // 外轮廓
    g.beginPath();
    g.moveTo(cx, topY);
    g.lineTo(cx - halfBase, baseY);
    g.lineTo(cx + halfBase, baseY);
    g.closePath();
    g.lineWidth = S * 0.035;
    g.strokeStyle = INK;
    g.stroke();

    // 塔尖高光
    g.beginPath();
    g.moveTo(cx, topY);
    g.lineTo(cx - S * 0.05, topY + S * 0.08);
    g.lineTo(cx + S * 0.02, topY + S * 0.08);
    g.closePath();
    g.fillStyle = '#f5dfae';
    g.fill();
  }

  const headTex = spriteTexture(256, drawSnakeHead);
  const TEX = {
    spore: spriteTexture(192, drawSpore),
    vine: spriteTexture(192, drawVine),
    trap: spriteTexture(192, drawTrap),
    scarab: spriteTexture(192, drawScarab),
    scarabBroken: spriteTexture(192, (g, S) => drawScarab(g, S, true)),
    mummy: spriteTexture(192, drawMummy),
    anubis: spriteTexture(192, drawAnubis),
  };
  const ENEMY_MATS = {};
  for (const key of Object.keys(TEX)) {
    ENEMY_MATS[key] = TEX[key]
      ? new THREE.MeshBasicMaterial({ map: TEX[key], transparent: true, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: 0x8a7b86 });
  }
  const BOSS_TEX = {
    rootcoil: spriteTexture(512, drawBoss),
    pharaoh: spriteTexture(512, drawPharaoh),
  };

  // ---------- 障碍外观：温室用树桩，神庙用石柱（每处占 2×2 = 4 格） ----------
  const OBSTACLE_PLANES = 16;
  const stumpPlanes = [];
  const STUMP_TEX = spriteTexture(256, drawStump);
  const COLUMN_TEX = spriteTexture(256, drawColumn);
  {
    const geo = new THREE.PlaneGeometry(2.05, 2.05);
    for (let k = 0; k < OBSTACLE_PLANES; k++) {
      const mat = new THREE.MeshBasicMaterial({
        map: STUMP_TEX || null,
        color: STUMP_TEX ? 0xffffff : 0x6b4526,
        transparent: true,
        depthWrite: false,
        fog: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.45, 0);
      mesh.visible = false;
      mesh.renderOrder = 1;
      scene.add(mesh);
      stumpPlanes.push(mesh);
    }
  }

  /** 把 2×2 的障碍块铺到场上，并同步贴图与位置 */
  function placeObstacles(seeds, tex) {
    obstacles.clear();
    for (const [si, sj] of seeds) {
      for (let di = 0; di < 2; di++) {
        for (let dj = 0; dj < 2; dj++) obstacles.add(`${si + di},${sj + dj}`);
      }
    }
    for (let k = 0; k < stumpPlanes.length; k++) {
      const s = seeds[k];
      const mesh = stumpPlanes[k];
      if (!s) { mesh.visible = false; continue; }
      mesh.visible = true;
      mesh.material.map = tex || null;
      mesh.material.color.setHex(tex ? 0xffffff : 0x6b4526);
      mesh.material.needsUpdate = true;
      mesh.position.set(cellX(s[0] + 0.5), 0.45, cellZ(s[1] + 0.5));
    }
  }

  /** 温室：随机树桩，避开出生点 / 传送门 / Boss */
  function layoutStumps(level) {
    const seeds = [];
    const startJ = 38;
    const fits = (i, j) => {
      if (i < 3 || j < 3 || i > N - 4 || j > N - 4) return false;
      if (Math.abs(i - 22) < 7 && Math.abs(j - startJ) < 8) return false;
      if (Math.abs(i - 22) < 6 && j < 8) return false;
      const bossRoom = ROOMS[level] && ROOMS[level].kind === 'boss';
      if (bossRoom && Math.abs(i - 22) < 7 && Math.abs(j - 22) < 7) return false;
      for (const [si, sj] of seeds) {
        if (Math.abs(si - i) < 6 && Math.abs(sj - j) < 6) return false;
      }
      return true;
    };

    let attempts = 0;
    while (seeds.length < 8 && attempts++ < 500) {
      const i = 3 + randInt(N - 9);
      const j = 3 + randInt(N - 9);
      if (!fits(i, j)) continue;
      seeds.push([i, j]);
    }
    placeObstacles(seeds, STUMP_TEX);
    if (level === 0) {
      for (const [i, j] of startRoomWalls()) obstacles.add(`${i},${j}`);
    }
  }

  /** 神庙：规则石柱阵（4 列 × 3 行，每根 2×2 格） */
  function layoutTemple() {
    // 每关重新随机摆放金字塔，避开出生点 / 传送门 / Boss 中心
    const seeds = [];
    const fits = (i, j) => {
      if (i < 4 || j < 4 || i > N - 5 || j > N - 6) return false;
      if (Math.abs(i - 22) < 6 && j < 8) return false;        // 门
      if (Math.abs(i - 22) < 7 && j > 33) return false;       // 出生点
      if (Math.abs(i - 22) < 6 && Math.abs(j - 22) < 6) return false; // Boss 中心
      for (const [si, sj] of seeds) {
        if (Math.abs(si - i) < 7 && Math.abs(sj - j) < 7) return false;
      }
      return true;
    };
    let attempts = 0;
    while (seeds.length < 12 && attempts++ < 600) {
      const i = 4 + randInt(N - 10);
      const j = 4 + randInt(N - 10);
      if (!fits(i, j)) continue;
      seeds.push([i, j]);
    }
    placeObstacles(seeds, COLUMN_TEX);
  }

  // ---------- 蛇：一条连续的带状身体 ----------
  const MAX_PTS = 400;
  const ribbonGeo = new THREE.BufferGeometry();
  const ribbonPos = new Float32Array(MAX_PTS * 2 * 3);
  const ribbonCol = new Float32Array(MAX_PTS * 2 * 3);
  const ribbonNrm = new Float32Array(MAX_PTS * 2 * 3);
  for (let i = 0; i < MAX_PTS * 2; i++) ribbonNrm[i * 3 + 1] = 1;
  ribbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPos, 3));
  ribbonGeo.setAttribute('color', new THREE.BufferAttribute(ribbonCol, 3));
  ribbonGeo.setAttribute('normal', new THREE.BufferAttribute(ribbonNrm, 3));
  const ribIdx = [];
  for (let i = 0; i < MAX_PTS - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    ribIdx.push(a, b, c, b, d, c);
  }
  ribbonGeo.setIndex(ribIdx);
  ribbonGeo.setDrawRange(0, 0);
  // 纯色不受光照影响，避免在暗地板上看起来“透明”
  const ribbon = new THREE.Mesh(ribbonGeo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.DoubleSide,
  }));
  ribbon.frustumCulled = false;
  scene.add(ribbon);

  const outlinePos = new Float32Array(MAX_PTS * 2 * 3);
  const outlineGeo = new THREE.BufferGeometry();
  outlineGeo.setAttribute('position', new THREE.BufferAttribute(outlinePos, 3));
  outlineGeo.setAttribute('normal', new THREE.BufferAttribute(ribbonNrm.slice(), 3));
  outlineGeo.setIndex(ribIdx.slice());
  outlineGeo.setDrawRange(0, 0);
  const outline = new THREE.Mesh(outlineGeo, new THREE.MeshBasicMaterial({ color: 0x08160f, side: THREE.DoubleSide }));
  outline.frustumCulled = false;
  scene.add(outline);

  // 尾端封口：实心圆片，保证尾巴是同色而不是透出地板
  const tailCap = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 18),
    new THREE.MeshBasicMaterial({ color: 0x2ee6c8 })
  );
  tailCap.rotation.x = -Math.PI / 2;
  tailCap.position.y = 0.44;
  tailCap.visible = false;
  scene.add(tailCap);

  // 头部：canvas 手绘贴图，平铺在场景里（伪 2D）
  const headPivot = new THREE.Group();
  const headPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    headTex
      ? new THREE.MeshBasicMaterial({ map: headTex, transparent: true, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: 0x4ecb9b })
  );
  headPlane.rotation.x = -Math.PI / 2;
  headPivot.add(headPlane);
  headPivot.position.y = 0.56;
  scene.add(headPivot);

  // ---------- 豆子 ----------
  const pelletGeo = new THREE.IcosahedronGeometry(0.18, 0);
  const pelletMat = new THREE.MeshStandardMaterial({
    color: 0xf2c14e, emissive: 0xc98b12, emissiveIntensity: 1.2, roughness: 0.35,
  });
  const pelletPool = [];
  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(pelletGeo, pelletMat);
    mesh.visible = false;
    scene.add(mesh);
    pelletPool.push(mesh);
  }

  // ---------- 小怪（按关卡换皮：孢子囊 / 藤鞭 / 食蝇草） ----------
  const ENEMY_TINTS = [
    { c: 0x8a7b86, e: 0x3a2f38 }, // 孢子囊：灰紫
    { c: 0xe0c04a, e: 0x6b5310 }, // 藤鞭：黄色
    { c: 0x6b7a4a, e: 0x2a3318 }, // 食蝇草：橄榄绿
    { c: 0x8a7b86, e: 0x3a2f38 },
  ];
  const enemyGeo = new THREE.PlaneGeometry(1.75, 1.75);
  const enemyPool = [];
  for (let i = 0; i < 24; i++) {
    const mesh = new THREE.Mesh(enemyGeo, ENEMY_MATS.spore);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    enemyPool.push(mesh);
  }

  // ---------- 子弹 ----------
  const bulletPool = [];
  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x9ff5d8, emissive: 0x2ee6a8, emissiveIntensity: 1.6 })
    );
    mesh.visible = false;
    scene.add(mesh);
    bulletPool.push(mesh);
  }

  // ---------- Boss 弹幕 ----------
  const bossBulletPool = [];
  for (let i = 0; i < 260; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffb199, emissive: 0xd93a12, emissiveIntensity: 1.5 })
    );
    mesh.visible = false;
    scene.add(mesh);
    bossBulletPool.push(mesh);
  }

  // ---------- 第三关小怪的能量豆（比 Boss 弹幕更大） ----------
  const podPool = [];
  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xa8ff9e, emissive: 0x3fbf4a, emissiveIntensity: 1.4 })
    );
    mesh.visible = false;
    scene.add(mesh);
    podPool.push(mesh);
  }

  // ---------- 大招：巨型能量球（2×2）+ 3×3 爆炸 ----------
  const orbPool = [];
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0x9dffe0, transparent: true, opacity: 0.92, fog: false })
    );
    mesh.visible = false;
    scene.add(mesh);
    orbPool.push(mesh);
  }
  const boomPool = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 1.0, 40),
      new THREE.MeshBasicMaterial({ color: 0xa6ffe0, transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.5;
    mesh.visible = false;
    scene.add(mesh);
    boomPool.push(mesh);
  }

  const bossMesh = new THREE.Group();
  let bossPlaneMat = null;
  {
    bossPlaneMat = new THREE.MeshBasicMaterial({
      map: BOSS_TEX.rootcoil || null,
      color: BOSS_TEX.rootcoil ? 0xffffff : 0x6b4a2f,
      transparent: true,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), bossPlaneMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.62;
    bossMesh.add(plane);
  }
  bossMesh.visible = false;
  scene.add(bossMesh);

  // ---------- 传送门：紫青色漩涡 ----------
  const doorGroup = new THREE.Group();
  const PORTAL_TEX = spriteTexture(256, drawPortal);
  const doorPad = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
      map: PORTAL_TEX || null,
      color: PORTAL_TEX ? 0xffffff : 0x6ee7b7,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    })
  );
  doorPad.rotation.x = -Math.PI / 2;
  doorPad.position.y = 0.12;
  doorGroup.add(doorPad);
  doorGroup.position.set(cellX(DOOR_CELL.i), 0, cellZ(DOOR_CELL.j));
  scene.add(doorGroup);

  // ---------- 技能卡 ----------
  const CARD_DEFS = [
    { type: 'agility', color: 0x4fd1e0, name: '疾鳞', desc: '射击间隔 -35%' },
    { type: 'survival', color: 0x5fd18a, name: '再生', desc: '立刻 +6 节' },
    { type: 'strength', color: 0xe4572e, name: '巨牙', desc: '子弹伤害 ×1.7' },
  ];
  const cardMeshes = [];
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.14, 1.65),
      new THREE.MeshStandardMaterial({
        color: CARD_DEFS[i].color, emissive: CARD_DEFS[i].color, emissiveIntensity: 0.55, roughness: 0.4,
      })
    );
    mesh.visible = false;
    scene.add(mesh);
    cardMeshes.push(mesh);
  }

  // ---------- 状态 ----------
  const state = {
    level: 0,
    phase: 'clear',
    cells: [],
    dir: { i: 0, j: -1 },
    progress: 1,
    invuln: 0,
    score: 0,
    kills: 0,
    eaten: 0,
    over: false,
    paused: false,
    shootCd: 0,
    bullets: [],
    enemyBullets: [],
    pods: [],
    orbs: [],
    booms: [],
    energyCd: 0,
    roomActive: false,
    roomTimer: 0,
    enemies: [],
    pellets: [],
    boss: null,
    prevTail: null,
    hitFlash: 0,
    cards: [],
    doorOpen: false,
    pelletsOff: false,
    time: 0,
    shotDamage: 6,
    shootCdMul: 1,
    enemySpeedMul: 1,
    enemyShoot: false,
  };

  let viewMode = 'full';
  const camTarget = new THREE.Vector3();
  const held = new Set();

  const el = {
    level: document.getElementById('level'),
    len: document.getElementById('len'),
    score: document.getElementById('score'),
    kills: document.getElementById('kills'),
    hp: document.getElementById('hpfill'),
    objective: document.getElementById('objective'),
    bossbar: document.getElementById('bossbar'),
    bfill: document.getElementById('bfill'),
    bname: document.getElementById('bname'),
    mode: document.getElementById('mode'),
    toast: document.getElementById('toast'),
    toasttext: document.getElementById('toasttext'),
    toastbig: document.getElementById('toastbig'),
    overlay: document.getElementById('overlay'),
    ovtitle: document.getElementById('ovtitle'),
    ovsub: document.getElementById('ovsub'),
    ovscore: document.getElementById('ovscore'),
    ovtime: document.getElementById('ovtime'),
    ovdetail: document.getElementById('ovdetail'),
    help: document.getElementById('help'),
  };

  // 操作提示：显示 5 秒后自动隐藏；暂停时再出现 5 秒
  let helpTimer = 0;
  function showHelp() {
    if (!el.help) return;
    el.help.classList.remove('hide');
    if (helpTimer) window.clearTimeout(helpTimer);
    helpTimer = window.setTimeout(() => el.help.classList.add('hide'), 5000);
  }

  let toastTimer = 0;

  // ---------- 工具 ----------
  const randInt = (n) => Math.floor(Math.random() * n);

  function toast(text, big) {
    el.toasttext.textContent = text || '';
    el.toastbig.textContent = big || '';
    el.toast.style.display = 'block';
    toastTimer = 2.2;
  }

  function randomFreeCell() {
    for (let tries = 0; tries < 400; tries++) {
      const i = randInt(N), j = randInt(N);
      if (isObstacle(i, j)) continue;
      if (state.cells.some((c) => c.i === i && c.j === j)) continue;
      if (state.pellets.some((p) => p.i === i && p.j === j)) continue;
      if (state.enemies.some((e) => e.alive && Math.abs(e.i - i) + Math.abs(e.j - j) < 4)) continue;
      return { i, j };
    }
    return { i: 1, j: 1 };
  }

  function spawnPellet() {
    if (state.pelletsOff) return; // 过关后不再生成豆子
    const c = randomFreeCell();
    state.pellets.push({ i: c.i, j: c.j, phase: Math.random() * Math.PI * 2 });
  }

  function spawnEnemy(distFromHead = 10) {
    const h = state.cells[0] || { i: HALF, j: HALF };
    const slot = state.enemies.find((e) => !e.alive);
    if (!slot) return;
    for (let tries = 0; tries < 300; tries++) {
      const i = randInt(N), j = randInt(N);
      if (isObstacle(i, j)) continue;
      if (Math.abs(i - h.i) + Math.abs(j - h.j) < distFromHead) continue;
      if (state.enemies.some((e) => e.alive && e.i === i && e.j === j)) continue;
      Object.assign(slot, {
        alive: true, i, j, x: cellX(i), z: cellZ(j), cool: 0, bob: Math.random() * 6,
        shootTimer: 0.8 + Math.random() * 1.4,
        hp: slot.type === 'scarab' ? 2 : 1,
      });
      // 复活时恢复原色/原贴图（甲虫被打灰后）
      const idx = state.enemies.indexOf(slot);
      if (idx >= 0 && enemyPool[idx]) {
        enemyPool[idx].material.map = TEX[slot.type] || null;
        enemyPool[idx].material.color.setHex(0xffffff);
        enemyPool[idx].material.needsUpdate = true;
      }
      return;
    }
  }

  function updateHud() {
    const len = state.cells.length;
    el.level.textContent = `${Math.min(state.level + 1, ROOM_COUNT)} / ${ROOM_COUNT}`;
    el.len.textContent = String(len);
    el.score.textContent = String(state.score);
    el.kills.textContent = String(state.kills);
    el.hp.style.width = `${Math.max(0, Math.min(100, (len / 24) * 100))}%`;

    if (state.phase === 'boss' && state.boss && state.boss.alive) {
      el.bossbar.style.display = 'block';
      el.bfill.style.width = `${Math.max(0, (state.boss.hp / state.boss.max) * 100)}%`;
    } else {
      el.bossbar.style.display = 'none';
    }

    let obj = '';
    if (state.phase === 'clear') {
      const left = state.enemies.filter((e) => e.alive).length;
      obj = left > 0 ? `清光敌人（剩余 ${left}）` : '门已打开 → 进入传送门';
    } else if (state.phase === 'boss') {
      obj = '击败 Boss';
    } else if (state.phase === 'pick') {
      obj = '射击一张技能卡';
    } else if (state.phase === 'exit') {
      obj = '进入传送门，结束本局';
    }
    el.objective.textContent = obj;
  }

  // ---------- 关卡 ----------
  const THEMES = {
    green: { fog: 0x08120e, a: 0x1b2a25, b: 0x22352e, hemi: 0xa8e6cf },
    temple: { fog: 0x1c1306, a: 0x3b2c19, b: 0x4a3720, hemi: 0xf5d9a0 },
  };

  function startLevel(idx) {
    const room = ROOMS[idx] || ROOMS[0];
    state.level = idx;
    state.phase = room.kind === 'boss' ? 'boss' : 'clear';
    state.doorOpen = false;
    state.boss = null;
    bossMesh.visible = false;
    if (room.theme === 'temple') layoutTemple(idx);
    else layoutStumps(idx);

    state.enemies.forEach((e) => { e.alive = false; });
    state.bullets.forEach((b) => { b.mesh.visible = false; });
    state.bullets.length = 0;
    state.enemyBullets.forEach((b) => { b.mesh.visible = false; });
    state.enemyBullets.length = 0;
    (state.pods || []).forEach((b) => { b.mesh.visible = false; });
    state.pods = [];
    (state.orbs || []).forEach((o) => { o.mesh.visible = false; });
    state.orbs = [];
    (state.booms || []).forEach((b) => { b.mesh.visible = false; });
    state.booms = [];
    state.pellets.length = 0;
    state.cards.length = 0;
    cardMeshes.forEach((m) => { m.visible = false; });

    // 温室关卡特性保留：第二关小怪更快，第三关会远程
    state.enemySpeedMul = room.theme === 'green' ? (idx === 1 ? 2 : (idx === 2 ? 0.7 : 1)) : 1;
    state.enemyShoot = room.theme === 'green' && idx === 2;

    // 第一关：从左侧 4×4 出生小房间钻出来；其余关卡仍在底部重生
    state.roomActive = false;
    state.roomTimer = 0;
    // 只有第一关开局时门洞是开的；其余关卡外墙保持完整
    doorPlug.visible = idx !== 0;
    if (idx === 0) {
      state.cells.length = 0;
      for (let k = 0; k < START_LEN; k++) {
        state.cells.push({ i: START_ROOM.i1 - k, j: START_ROOM.doorJ });
      }
      state.dir = { i: 1, j: 0 };
      state.roomActive = true;
      startRoom.visible = true;
      if (startRoomGate) {
        startRoomGate.position.y = 0.55;
        startRoomGate.visible = true;
      }
    } else {
      const keep = Math.max(START_LEN, state.cells.length || START_LEN);
      const startJ = Math.min(40, 44 - keep);
      state.cells.length = 0;
      for (let k = 0; k < keep; k++) state.cells.push({ i: 22, j: startJ + k });
      state.dir = { i: 0, j: -1 };
      startRoom.visible = false;
    }
    state.progress = 1;
    state.prevTail = null;
    state.invuln = 1.0;
    state.shootCd = 0;
    state.pelletsOff = false; // 新关卡重新开始刷豆

    for (let k = 0; k < 10; k++) spawnPellet();

    const tint = THEMES[room.theme] || THEMES.green;
    scene.fog.color.setHex(tint.fog);
    scene.background.setHex(tint.fog);
    matA.color.setHex(tint.a);
    matB.color.setHex(tint.b);
    hemi.color.setHex(tint.hemi);

    // 敌人外观 / 类型按关卡轮换
    const types = room.types || ['spore'];
    for (let k = 0; k < enemyPool.length; k++) {
      const type = types[k % types.length];
      enemyPool[k].material = (ENEMY_MATS[type] || ENEMY_MATS.spore).clone();
      enemyPool[k].material.color.setHex(0xffffff);
      state.enemies[k].type = type;
      state.enemies[k].hp = type === 'scarab' ? 2 : 1;
    }

    if (room.kind === 'clear') {
      for (let k = 0; k < room.enemies; k++) spawnEnemy(9);
      toast(room.name, `敌人 ${room.enemies}`);
    } else {
      spawnBoss(room.boss);
      toast('BOSS', room.name);
    }
    updateHud();
  }

  function spawnBoss(kind = 'rootcoil') {
    const isPharaoh = kind === 'pharaoh';
    const hp = isPharaoh ? 380 : BOSS_HP;
    state.boss = {
      alive: true,
      kind,
      hp,
      max: hp,
      x: cellX(BOSS_CELL.i),
      z: cellZ(BOSS_CELL.j),
      shootTimer: isPharaoh ? 2.4 : 3,
      cool: 0,
    };
    bossPlaneMat.map = (BOSS_TEX[kind] || BOSS_TEX.rootcoil) || null;
    bossPlaneMat.color.setHex(bossPlaneMat.map ? 0xffffff : 0x6b4a2f);
    bossPlaneMat.needsUpdate = true;
    bossMesh.visible = true;
    bossMesh.position.set(state.boss.x, 0, state.boss.z);
    bossMesh.scale.setScalar(isPharaoh ? 0.95 : 1);
    el.bname.textContent = isPharaoh ? '黄金法老 · PHARAOH' : '腐根盘蛇 · ROOTCOIL';
  }

  function bossDie() {
    state.boss.alive = false;
    bossMesh.visible = false;
    state.phase = 'pick';
    // Boss 战结束也停止刷豆，场上豆子清空
    state.pelletsOff = true;
    state.pellets.length = 0;
    state.pods.forEach((p) => { p.mesh.visible = false; });
    state.pods.length = 0;
    // Boss 死后残留弹幕立刻清空
    state.enemyBullets.forEach((b) => { b.mesh.visible = false; });
    state.enemyBullets.length = 0;
    spawnCards();
    updateHud();
    toast('Boss 倒下', '撞向一张技能卡即可获得');
  }

  function spawnCards() {
    state.cards.length = 0;
    CARD_DEFS.forEach((def, idx) => {
      const mesh = cardMeshes[idx];
      mesh.visible = true;
      state.cards.push({
        type: def.type,
        name: def.name,
        desc: def.desc,
        color: def.color,
        mesh,
        baseX: (idx - 1) * 3.2,
        baseZ: 0,
        phase: idx * 1.3,
      });
    });
  }

  function pickCard(cardIdx) {
    const card = state.cards[cardIdx];
    if (!card) return;
    if (card.type === 'agility') state.shootCdMul *= 0.65;
    if (card.type === 'survival') growBy(6);
    if (card.type === 'strength') state.shotDamage *= 1.7;

    state.cards.length = 0;
    cardMeshes.forEach((m) => { m.visible = false; });
    state.phase = 'exit';
    state.doorOpen = true;
    updateHud();
    toast(`获得技能卡：${card.name}`, card.desc);
  }

  // ---------- 蛇体 ----------
  function headPosition(out) {
    const a = state.cells[0];
    const b = state.cells[1] || state.cells[0];
    const t = Math.max(0, Math.min(1, state.progress));
    out = out || new THREE.Vector3();
    out.set(
      cellX(b.i) + (cellX(a.i) - cellX(b.i)) * t,
      0.42,
      cellZ(b.j) + (cellZ(a.j) - cellZ(b.j)) * t
    );
    return out;
  }

  const _tmpA = new THREE.Vector3();
  const _tmpB = new THREE.Vector3();
  function sampleBack(distance, out) {
    out = out || new THREE.Vector3();
    headPosition(out);
    let remaining = distance;
    for (let k = 1; k < state.cells.length; k++) {
      if (!state.cells[k]) break;
      _tmpB.set(cellX(state.cells[k].i), 0.42, cellZ(state.cells[k].j));
      const seg = out.distanceTo(_tmpB);
      if (remaining <= seg) {
        if (seg <= 0.0001) return out;
        return out.lerp(_tmpB, remaining / seg);
      }
      remaining -= seg;
      out.copy(_tmpB);
    }
    return out;
  }

  function hitsSelf(i, j) {
    const last = state.cells.length - 1;
    for (let k = 0; k < last; k++) {
      const c = state.cells[k];
      if (!c) continue;
      if (c.i === i && c.j === j) return true;
    }
    return false;
  }

  /** 蛇身（含头）到某点的最近距离平方，用于身体碰撞体积判定 */
  function bodyDistanceSq(x, z) {
    let best = Infinity;
    for (let k = 0; k < state.cells.length; k++) {
      const c = state.cells[k];
      if (!c) break;
      const dx = cellX(c.i) - x;
      const dz = cellZ(c.j) - z;
      const d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return best;
  }

  function damage(n) {
    if (state.over || state.invuln > 0) return;
    state.prevTail = null;
    state.hitFlash = 0.18;
    for (let k = 0; k < n && state.cells.length > 1; k++) state.cells.pop();
    state.invuln = INVULN;
    updateHud();
    if (state.cells.length <= 1) {
      gameOver('体长归零 —— 蛇不能没有身体。');
      return;
    }
    // 掉血立刻补一只怪（清怪压力）
    if (state.phase === 'clear' && state.enemies.filter((e) => e.alive).length < 16) spawnEnemy(8);
  }

  function growBy(n) {
    state.prevTail = null;
    const tail = state.cells[state.cells.length - 1];
    if (!tail) return;
    for (let k = 0; k < n && state.cells.length < MAX_BODY; k++) {
      state.cells.push({ i: tail.i, j: tail.j });
    }
    updateHud();
  }

  function step() {
    const d = state.dir;
    const h = state.cells[0];
    const ni = h.i + d.i;
    const nj = h.j + d.j;

    if (!(inBounds(ni, nj) || inStartRoom(ni, nj)) || isObstacle(ni, nj) || hitsSelf(ni, nj)) {
      damage(2);
      state.progress = 0;
      return;
    }

    state.cells.unshift({ i: ni, j: nj });

    const pi = state.pellets.findIndex((p) => p.i === ni && p.j === nj);
    if (pi >= 0) {
      state.pellets.splice(pi, 1);
      state.score += 10;
      state.eaten += 1;
      state.prevTail = null; // 生长：尾巴不动
      spawnPellet();
      updateHud();
    } else {
      state.prevTail = state.cells.pop(); // 记录被裁掉的尾格，用于平滑收尾
      if (state.cells.length > MAX_BODY) state.cells.pop();
    }
  }

  // ---------- 输入 ----------
  const DIRS = {
    w: { i: 0, j: -1 }, arrowup: { i: 0, j: -1 },
    s: { i: 0, j: 1 }, arrowdown: { i: 0, j: 1 },
    a: { i: -1, j: 0 }, arrowleft: { i: -1, j: 0 },
    d: { i: 1, j: 0 }, arrowright: { i: 1, j: 0 },
  };

  function directionFromHeld() {
    let dx = 0, dz = 0;
    if (held.has('a') || held.has('arrowleft')) dx -= 1;
    if (held.has('d') || held.has('arrowright')) dx += 1;
    if (held.has('w') || held.has('arrowup')) dz -= 1;
    if (held.has('s') || held.has('arrowdown')) dz += 1;
    if (dx === 0 && dz === 0) return null;
    return { i: dx, j: dz };
  }

  function applyDir(d) {
    if (!d || state.over || state.paused) return;
    const reverse = d.i === -state.dir.i && d.j === -state.dir.j;
    if (reverse && state.cells.length > 2) return;
    state.dir = d;
  }

  function shoot() {
    if (state.over || state.paused) return;
    if (state.shootCd > 0) return;
    if (state.cells.length <= 2) return;
    state.shootCd = SHOOT_COOLDOWN * state.shootCdMul;
    state.cells.pop();
    const from = headPosition();
    const d = state.dir;
    const mesh = bulletPool.find((m) => !m.visible) || bulletPool[0];
    mesh.visible = true;
    mesh.position.copy(from);
    state.bullets.push({
      mesh, x: from.x, z: from.z,
      vx: d.i * BULLET_SPEED, vz: d.j * BULLET_SPEED, life: 1.8,
    });
    updateHud();
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'spacebar') { e.preventDefault(); shoot(); return; }
    if (k === 'r') { resetGame(); return; }
    if (k === 'f') {
      viewMode = viewMode === 'full' ? 'follow' : 'full';
      el.mode.textContent = viewMode === 'full' ? '视角：全图（F 切换）' : '视角：跟随（F 切换）';
      return;
    }
    if (k === 'p') {
      if (state.over) return;
      state.paused = !state.paused;
      el.ovtitle.textContent = '暂停';
      el.ovsub.textContent = '按 P 继续';
      el.ovscore.textContent = '';
      el.ovtime.textContent = '';
      el.ovdetail.textContent = '';
      el.overlay.classList.toggle('show', state.paused);
      if (state.paused) showHelp();
      return;
    }
    if (k === 'e') { e.preventDefault(); fireEnergy(); return; }
    if (DIRS[k]) { e.preventDefault(); held.add(k); applyDir(directionFromHeld()); }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    held.delete(k);
    const d = directionFromHeld();
    if (d) applyDir(d);
  });

  window.addEventListener('blur', () => held.clear());

  // ---------- 更新 ----------
  function updateSnake(dt) {
    state.progress += dt / STEP;
    let guard = 0;
    while (state.progress >= 1 && !state.over && guard++ < 4) {
      state.progress -= 1;
      step();
    }
    if (state.over) return;

    const pos = headPosition(_tmpA);
    const di = state.dir.i, dj = state.dir.j;
    headPivot.position.set(pos.x, 0.56, pos.z);
    headPivot.rotation.y = Math.atan2(-di, -dj);

    updateRibbon();
    headPivot.visible = state.invuln > 0 ? (Math.floor(state.time * 14) % 2 === 0) : true;
  }

  // 把蛇的格子路径重采样成一条连续条带
  const _poly = [];
  const _p0 = { x: 0, z: 0 };
  const _p1 = { x: 0, z: 0 };

  function buildPolyline() {
    _poly.length = 0;
    const h = headPosition();
    _poly.push({ x: h.x, z: h.z });
    for (let k = 1; k < state.cells.length; k++) {
      const c = state.cells[k];
      if (!c) break;
      _poly.push({ x: cellX(c.i), z: cellZ(c.j) });
    }
    // 尾巴平滑收尾：把“刚被裁掉的尾格”与当前尾格之间做插值，
    // 避免每次前进一格时尾巴瞬移造成的抽搐。
    if (state.prevTail && _poly.length > 1) {
      const last = state.cells[state.cells.length - 1];
      if (last) {
        const t = Math.min(1, Math.max(0, state.progress));
        const e = t * t * (3 - 2 * t); // smoothstep
        const tx = cellX(state.prevTail.i) + (cellX(last.i) - cellX(state.prevTail.i)) * e;
        const tz = cellZ(state.prevTail.j) + (cellZ(last.j) - cellZ(state.prevTail.j)) * e;
        const tailEnd = _poly[_poly.length - 1];
        if (Math.hypot(tx - tailEnd.x, tz - tailEnd.z) > 0.001) {
          _poly.push({ x: tx, z: tz });
        }
      }
    }
    let total = 0;
    for (let k = 1; k < _poly.length; k++) {
      total += Math.hypot(_poly[k].x - _poly[k - 1].x, _poly[k].z - _poly[k - 1].z);
    }
    return total;
  }

  function samplePoly(s, out) {
    let acc = 0;
    for (let k = 1; k < _poly.length; k++) {
      const a = _poly[k - 1];
      const b = _poly[k];
      const seg = Math.hypot(b.x - a.x, b.z - a.z);
      if (acc + seg >= s || k === _poly.length - 1) {
        const t = seg <= 0.0001 ? 0 : Math.min(1, Math.max(0, (s - acc) / seg));
        out.x = a.x + (b.x - a.x) * t;
        out.z = a.z + (b.z - a.z) * t;
        return out;
      }
      acc += seg;
    }
    out.x = 0; out.z = 0;
    return out;
  }

  function updateRibbon() {
    const total = buildPolyline();
    if (total < 0.05 || _poly.length < 2) {
      ribbonGeo.setDrawRange(0, 0);
      outlineGeo.setDrawRange(0, 0);
      return;
    }
    const spacing = 0.2;
    const count = Math.max(2, Math.min(MAX_PTS, Math.floor(total / spacing) + 2));
    let prevX = 0, prevZ = 0;

    for (let i = 0; i < count; i++) {
      const s = Math.min(total, i * spacing);
      samplePoly(s, _p0);

      let tx, tz;
      if (i === 0) {
        samplePoly(Math.min(total, s + 0.06), _p1);
        tx = _p1.x - _p0.x; tz = _p1.z - _p0.z;
      } else {
        tx = _p0.x - prevX; tz = _p0.z - prevZ;
      }
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl; tz /= tl;
      const nx = -tz, nz = tx;

      // 尾部 1.8 格内收窄
      const tailFade = Math.min(1, Math.max(0, (total - s) / 1.8));
      const w = 0.44 * (0.45 + 0.55 * tailFade);
      const ow = w + 0.12 * Math.max(0.35, tailFade);
      const y = 0.42;

      const base = i * 6;
      ribbonPos[base] = _p0.x + nx * w;
      ribbonPos[base + 1] = y;
      ribbonPos[base + 2] = _p0.z + nz * w;
      ribbonPos[base + 3] = _p0.x - nx * w;
      ribbonPos[base + 4] = y;
      ribbonPos[base + 5] = _p0.z - nz * w;

      outlinePos[base] = _p0.x + nx * ow;
      outlinePos[base + 1] = y - 0.05;
      outlinePos[base + 2] = _p0.z + nz * ow;
      outlinePos[base + 3] = _p0.x - nx * ow;
      outlinePos[base + 4] = y - 0.05;
      outlinePos[base + 5] = _p0.z - nz * ow;

      // 深浅相间的横纹
      const band = Math.floor(s / 1.5) % 2;
      const r = band ? 0.10 : 0.18;
      const g = band ? 0.66 : 0.90;
      const b = band ? 0.58 : 0.80;
      ribbonCol[base] = r; ribbonCol[base + 1] = g; ribbonCol[base + 2] = b;
      ribbonCol[base + 3] = r; ribbonCol[base + 4] = g; ribbonCol[base + 5] = b;

      prevX = _p0.x; prevZ = _p0.z;
    }

    ribbonGeo.attributes.position.needsUpdate = true;
    ribbonGeo.attributes.color.needsUpdate = true;
    outlineGeo.attributes.position.needsUpdate = true;
    ribbonGeo.setDrawRange(0, (count - 1) * 6);
    outlineGeo.setDrawRange(0, (count - 1) * 6);

    // 尾端封口，跟到最后一个采样点（颜色跟随最后一节横纹）
    samplePoly(total, _p1);
    tailCap.position.set(_p1.x, 0.44, _p1.z);
    const tailBand = Math.floor(total / 1.5) % 2;
    tailCap.material.color.setHex(0x2ee6c8); // 与头部同色
    tailCap.visible = total > 0.3;
  }

  function updatePellets() {
    for (let k = 0; k < pelletPool.length; k++) {
      const mesh = pelletPool[k];
      const p = state.pellets[k];
      if (!p) { mesh.visible = false; continue; }
      mesh.visible = true;
      mesh.position.set(cellX(p.i), 0.28 + Math.sin(state.time * 3 + p.phase) * 0.07, cellZ(p.j));
      mesh.rotation.y += 0.02;
    }
  }

  function updateEnemies(dt) {
    const hp = headPosition(_tmpA).clone();
    for (let k = 0; k < enemyPool.length; k++) {
      const mesh = enemyPool[k];
      const e = state.enemies[k];
      if (!e || !e.alive) { mesh.visible = false; continue; }
      mesh.visible = true;

      const dx = hp.x - e.x;
      const dz = hp.z - e.z;
      const len = Math.hypot(dx, dz) || 1;
      if (e.cool > 0) e.cool -= dt;
      const typeMul = e.type === 'scarab' ? 1.2 : e.type === 'mummy' ? 1.5 : e.type === 'anubis' ? 0.9 : 1;
      const speed = (e.cool > 0 ? ENEMY_COOL_SPEED : ENEMY_SPEED) * state.enemySpeedMul * typeMul;
      let nx = e.x + (dx / len) * speed * dt;
      let nz = e.z + (dz / len) * speed * dt;

      const ci = Math.round(nx + HALF);
      const cj = Math.round(nz + HALF);
      if (!inBounds(ci, cj) || isObstacle(ci, cj)) {
        nx = e.x + (-dz / len) * speed * dt;
        nz = e.z + (dx / len) * speed * dt;
      }
      e.x = nx; e.z = nz;
      e.i = Math.round(nx + HALF); e.j = Math.round(nz + HALF);

      mesh.position.set(nx, 0.5 + Math.sin(state.time * 4 + e.bob) * 0.04, nz);
      mesh.rotation.z = Math.sin(state.time * 2 + e.bob) * 0.08;

      if (bodyDistanceSq(nx, nz) < 0.75 * 0.75 && e.cool <= 0) {
        e.cool = 1.2;
        e.x -= (dx / len) * 2.2;
        e.z -= (dz / len) * 2.2;
        damage(2);
        if (state.over) return;
      }

      // 能量豆：温室第三关全体 / 神庙的阿努比斯守卫
      if (state.enemyShoot || e.type === 'anubis') {
        if (e.shootTimer === undefined) e.shootTimer = 1 + Math.random() * 1.5;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          const isAnubis = e.type === 'anubis';
          e.shootTimer = isAnubis ? 5.5 : 4;
          const dist = Math.hypot(hp.x - nx, hp.z - nz);
          if (dist < 24) {
            if (isAnubis) {
              // 阿努比斯：一次两发，带小角度散射
              const base = Math.atan2(hp.z - nz, hp.x - nx);
              for (const off of [-0.16, 0.16]) {
                const a = base + off;
                spawnPod(nx, nz, nx + Math.cos(a) * dist, nz + Math.sin(a) * dist, 0.75);
              }
            } else {
              spawnPod(nx, nz, hp.x, hp.z);
            }
          }
        }
      }
    }
  }

  function updateBoss(dt) {
    const b = state.boss;
    if (!b || !b.alive) return;
    const hp = headPosition(_tmpA).clone();
    const dx = hp.x - b.x;
    const dz = hp.z - b.z;
    const len = Math.hypot(dx, dz) || 1;
    b.x += (dx / len) * BOSS_SPEED * dt;
    b.z += (dz / len) * BOSS_SPEED * dt;
    b.x = Math.max(-HALF + 2, Math.min(HALF - 2, b.x));
    b.z = Math.max(-HALF + 2, Math.min(HALF - 2, b.z));

    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.z = Math.sin(state.time * 1.2) * 0.04;
    bossMesh.scale.setScalar(1 + Math.sin(state.time * 2.6) * 0.03);

    if (b.cool > 0) b.cool -= dt;
    if (bodyDistanceSq(b.x, b.z) < 2.5 * 2.5 && b.cool <= 0) {
      b.cool = 1.6;
      damage(2);
      if (state.over) return;
    }

    b.shootTimer -= dt;
    if (b.shootTimer <= 0) {
      const isPharaoh = b.kind === 'pharaoh';
      if (isPharaoh) {
        // 三面扇形爆发：三个方向各三圈，子弹数从外圈到内圈递减
        b.shootTimer = 3.5;
        const base = Math.atan2(hp.z - b.z, hp.x - b.x);
        const fans = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
        const rings = [
          { r: 3.8, n: 18, spd: 4.4 }, // 外圈最多、最慢
          { r: 2.4, n: 12, spd: 5.4 },
          { r: 1.2, n: 7, spd: 6.4 },  // 内圈最少、最快
        ];
        for (const off of fans) {
          const a0 = base + off;
          for (const ring of rings) {
            for (let k = 0; k < ring.n; k++) {
              const spread = ring.n > 1 ? (k / (ring.n - 1) - 0.5) * 1.7 : 0;
              const a = a0 + spread;
              spawnBossBullet(
                b.x + Math.cos(a) * ring.r,
                b.z + Math.sin(a) * ring.r,
                Math.cos(a) * ring.spd,
                Math.sin(a) * ring.spd
              );
            }
          }
        }
      } else {
        b.shootTimer = 2.2;
        const count = 10;
        const spd = 6;
        for (let k = 0; k < count; k++) {
          const ang = (k / count) * Math.PI * 2 + state.time;
          spawnBossBullet(b.x, b.z, Math.cos(ang) * spd, Math.sin(ang) * spd);
        }
      }
    }
  }

  function spawnBossBullet(x, z, vx, vz) {
    const mesh = bossBulletPool.find((m) => !m.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.position.set(x, 0.5, z);
    state.enemyBullets.push({ mesh, x, z, vx, vz, life: 4 });
  }

  function updateBossBullets(dt) {
    const hp = headPosition(_tmpA).clone();
    for (let k = state.enemyBullets.length - 1; k >= 0; k--) {
      const b = state.enemyBullets[k];
      b.life -= dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, 0.5, b.z);

      let dead = b.life <= 0 || Math.abs(b.x) > HALF + 1 || Math.abs(b.z) > HALF + 1 ||
        isObstacle(Math.round(b.x + HALF), Math.round(b.z + HALF)); // 木桩挡弹
      if (!dead && bodyDistanceSq(b.x, b.z) < 0.7 * 0.7) {
        dead = true;
        damage(1);
      }
      if (dead) {
        b.mesh.visible = false;
        state.enemyBullets.splice(k, 1);
      }
    }
  }

  // 第三关小怪的能量豆：直线飞向蛇头，体型比 Boss 弹幕更大
  function spawnPod(x, z, tx, tz, scale = 1) {
    const mesh = podPool.find((m) => !m.visible);
    if (!mesh) return;
    const dx = tx - x;
    const dz = tz - z;
    const len = Math.hypot(dx, dz) || 1;
    const speed = 6;
    mesh.visible = true;
    mesh.scale.setScalar(scale);
    mesh.position.set(x, 0.55, z);
    state.pods.push({
      mesh, x, z,
      vx: (dx / len) * speed, vz: (dz / len) * speed,
      life: 3.5,
    });
  }

  // ---------- 大招：能量球 ----------
  function fireEnergy() {
    if (state.over || state.paused) return;
    if (state.cells.length <= 4) {
      toast('体长不足', '超过 4 节才能使用能量球（消耗 3 节）');
      return;
    }
    if (state.energyCd > 0) return;
    const mesh = orbPool.find((m) => !m.visible);
    if (!mesh) return;
    state.energyCd = 3;
    // 消耗 3 节体长
    for (let k = 0; k < 3 && state.cells.length > 1; k++) state.cells.pop();
    state.prevTail = null;
    updateHud();
    const from = headPosition();
    const d = state.dir;
    mesh.visible = true;
    mesh.position.set(from.x, 0.6, from.z);
    state.orbs.push({ mesh, x: from.x, z: from.z, vx: d.i * 9, vz: d.j * 9, life: 2.6 });
    toast('能量球', '消耗 3 节 · 命中后 3×3 范围清场');
  }

  function explodeAt(x, z) {
    const ci = Math.round(x + HALF);
    const cj = Math.round(z + HALF);
    for (const en of state.enemies) {
      if (!en.alive) continue;
      if (Math.abs(en.i - ci) <= 1 && Math.abs(en.j - cj) <= 1) {
        en.alive = false;
        state.kills += 1;
        state.score += 30;
        // 能量球清场不再返还体长，保证消耗固定为 3 节
      }
    }
    const mesh = boomPool.find((m) => !m.visible) || boomPool[0];
    mesh.visible = true;
    mesh.position.set(x, 0.52, z);
    mesh.scale.setScalar(0.6);
    mesh.material.opacity = 0.95;
    state.booms.push({ mesh, t: 0 });
    updateHud();
  }

  function updateOrbs(dt) {
    state.energyCd = Math.max(0, state.energyCd - dt);
    for (let k = state.orbs.length - 1; k >= 0; k--) {
      const o = state.orbs[k];
      o.life -= dt;
      o.x += o.vx * dt;
      o.z += o.vz * dt;
      o.mesh.position.set(o.x, 0.6, o.z);
      o.mesh.rotation.y += dt * 3;

      const ci = Math.round(o.x + HALF);
      const cj = Math.round(o.z + HALF);
      let boom = o.life <= 0 || Math.abs(o.x) > HALF + 1 || Math.abs(o.z) > HALF + 1 ||
        !inBounds(ci, cj) || isObstacle(ci, cj);

      if (!boom) {
        for (const en of state.enemies) {
          if (!en.alive) continue;
          if (Math.hypot(en.x - o.x, en.z - o.z) < 1.15) {
            boom = true;
            o.boomX = en.x; // 以命中的怪为中心爆炸，保证 3×3 覆盖
            o.boomZ = en.z;
            break;
          }
        }
      }
      // 打 Boss 也有效
      if (!boom && state.boss && state.boss.alive &&
        Math.hypot(state.boss.x - o.x, state.boss.z - o.z) < 2.6) {
        boom = true;
        o.boomX = state.boss.x;
        o.boomZ = state.boss.z;
        state.boss.hp -= 45;
        updateHud();
        if (state.boss.hp <= 0) bossDie();
      }
      if (boom) {
        o.mesh.visible = false;
        state.orbs.splice(k, 1);
        explodeAt(o.boomX !== undefined ? o.boomX : o.x, o.boomZ !== undefined ? o.boomZ : o.z);
      }
    }
  }

  function updateBooms(dt) {
    for (let k = state.booms.length - 1; k >= 0; k--) {
      const b = state.booms[k];
      b.t += dt;
      const p = Math.min(1, b.t / 0.45);
      b.mesh.scale.setScalar(0.6 + p * 2.2);
      b.mesh.material.opacity = 0.95 * (1 - p);
      if (p >= 1) {
        b.mesh.visible = false;
        state.booms.splice(k, 1);
      }
    }
  }

  function updatePods(dt) {
    for (let k = state.pods.length - 1; k >= 0; k--) {
      const b = state.pods[k];
      b.life -= dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, 0.55, b.z);

      let dead = b.life <= 0 || Math.abs(b.x) > HALF + 1 || Math.abs(b.z) > HALF + 1 ||
        isObstacle(Math.round(b.x + HALF), Math.round(b.z + HALF)); // 木桩挡豆
      if (!dead && bodyDistanceSq(b.x, b.z) < 0.72 * 0.72) {
        dead = true;
        damage(1);
      }
      if (dead) {
        b.mesh.visible = false;
        state.pods.splice(k, 1);
      }
    }
  }

  function updateBullets(dt) {
    for (let k = state.bullets.length - 1; k >= 0; k--) {
      const b = state.bullets[k];
      b.life -= dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, 0.4, b.z);

      const ci = Math.round(b.x + HALF);
      const cj = Math.round(b.z + HALF);
      let dead = b.life <= 0 || !inBounds(ci, cj) || isObstacle(ci, cj);

      // 命中小怪
      if (!dead && state.phase === 'clear') {
        for (let e = 0; e < state.enemies.length; e++) {
          const en = state.enemies[e];
          if (!en.alive) continue;
          if (Math.hypot(en.x - b.x, en.z - b.z) < 0.62) {
            if (en.hp > 1) {
              en.hp -= 1; // 圣甲虫壳硬，需要两发
              // 翅膀被打灰：第一发后换成破损贴图
              if (en.type === 'scarab' && enemyPool[e]) {
                enemyPool[e].material.map = TEX.scarabBroken || enemyPool[e].material.map;
                enemyPool[e].material.needsUpdate = true;
              }
              dead = true;
              break;
            }
            en.alive = false;
            state.kills += 1;
            state.score += 25;
            growBy(2);
            updateHud();
            dead = true;
            break;
          }
        }
      }

      // 命中 Boss
      if (!dead && state.phase === 'boss' && state.boss && state.boss.alive) {
        if (Math.hypot(state.boss.x - b.x, state.boss.z - b.z) < 2.3) {
          state.boss.hp -= state.shotDamage;
          state.score += 10;
          updateHud();
          dead = true;
          if (state.boss.hp <= 0) bossDie();
        }
      }

      // 技能卡改为撞击拾取，子弹直接穿过

      if (dead) {
        b.mesh.visible = false;
        state.bullets.splice(k, 1);
      }
    }
  }

  function updateCards(dt) {
    for (let k = 0; k < state.cards.length; k++) {
      const card = state.cards[k];
      card.mesh.position.set(
        card.baseX + Math.sin(state.time * 1.4 + card.phase) * 0.25,
        0.6 + Math.sin(state.time * 2.2 + card.phase) * 0.12,
        card.baseZ + Math.cos(state.time * 1.1 + card.phase) * 0.25
      );
      card.mesh.rotation.y += dt * 1.2;

      // 撞击即获得（不再需要射击）
      if (state.phase === 'pick' && bodyDistanceSq(card.mesh.position.x, card.mesh.position.z) < 1.15 * 1.15) {
        pickCard(k);
        return;
      }
    }
  }

  function updateDoor(dt) {
    const target = state.doorOpen ? 0.75 : 0.0;
    doorPad.material.opacity += (target - doorPad.material.opacity) * Math.min(1, dt * 6);
    doorPad.visible = doorPad.material.opacity > 0.02;
    doorGroup.rotation.y += dt * 0.4;
  }

  /** 出生小房间：蛇完全钻出来后关门并隐藏房间 */
  function updateStartRoom(dt) {
    if (state.roomTimer > 0) {
      state.roomTimer -= dt;
      if (startRoomGate) startRoomGate.position.y = Math.max(-0.15, startRoomGate.position.y - dt * 3);
      if (state.roomTimer <= 0) {
        // 房间彻底消失后再把外墙门洞封上
        startRoom.visible = false;
        doorPlug.visible = true;
        obstacles.add(`${START_ROOM.doorI},${START_ROOM.doorJ}`);
      }
      return;
    }
    if (!state.roomActive) return;
    const out = state.cells.length > 0 && state.cells.every((c) => c && c.i > START_ROOM.doorI);
    if (out) {
      state.roomActive = false;
      state.roomTimer = 0.5;
    }
  }

  function checkDoor() {
    if (!state.doorOpen || state.over) return;
    const p = headPosition(_tmpA);
    const dx = p.x - cellX(DOOR_CELL.i);
    const dz = p.z - cellZ(DOOR_CELL.j);
    if (Math.hypot(dx, dz) > 1.4) return;

    if (state.phase === 'clear') {
      startLevel(Math.min(state.level + 1, ROOM_COUNT - 1));
    } else if (state.phase === 'exit') {
      if (state.level + 1 < ROOM_COUNT) startLevel(state.level + 1);
      else victory();
    }
  }

  function checkClear() {
    if (state.phase !== 'clear' || state.doorOpen) return;
    if (state.enemies.some((e) => e.alive)) return;
    state.doorOpen = true;
    // 过关后豆子全部消失，且本关不再生成
    state.pelletsOff = true;
    state.pellets.length = 0;
    updateHud();
    toast('房间已清空', '门开了 → 进入传送门');
  }

  function updateCamera(dt) {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    let halfH = viewMode === 'full' ? HALF + 2.2 : 12;
    let halfW = halfH * aspect;
    if (viewMode === 'full' && halfW < HALF + 1.5) {
      halfW = HALF + 1.5;
      halfH = halfW / aspect;
    }

    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;

    if (viewMode === 'follow') {
      headPosition(_tmpA);
      camTarget.lerp(_tmpA, Math.min(1, dt * 4));
      const maxX = Math.max(0, HALF - halfW + 0.5);
      const maxZ = Math.max(0, HALF - halfH + 0.5);
      camera.position.set(
        Math.max(-maxX, Math.min(maxX, camTarget.x)),
        80,
        Math.max(-maxZ, Math.min(maxZ, camTarget.z))
      );
      camera.lookAt(camera.position.x, 0, camera.position.z);
    } else {
      // 出生房间阶段镜头稍微左移，让场外小房间也看得见
      const targetX = state.roomActive ? cellX((START_ROOM.i0 + START_ROOM.i1) / 2) + 9 : 0;
      camTarget.x += (targetX - camTarget.x) * Math.min(1, dt * 3);
      camera.position.set(camTarget.x, 80, 0);
      camera.lookAt(camTarget.x, 0, 0);
    }
    camera.updateProjectionMatrix();
  }

  // ---------- 流程 ----------
  function resetGame() {
    state.cells.length = 0;
    for (let k = 0; k < START_LEN; k++) state.cells.push({ i: 22, j: 34 + k });
    state.dir = { i: 0, j: -1 };
    state.progress = 1;
    state.prevTail = null;
    state.invuln = 1;
    state.score = 0;
    state.kills = 0;
    state.eaten = 0;
    state.over = false;
    state.paused = false;
    state.shootCd = 0;
    state.energyCd = 0;
    state.roomActive = false;
    state.roomTimer = 0;
    if (startRoom) startRoom.visible = false;
    if (doorPlug) doorPlug.visible = false;
    state.time = 0;
    state.shotDamage = 6;
    state.shootCdMul = 1;
    state.enemies = Array.from({ length: 24 }, () => ({ alive: false, i: 0, j: 0, x: 0, z: 0, cool: 0, bob: 0 }));

    el.overlay.classList.remove('show');
    // 调试直跳时给一点体长，方便测试后面的关卡
    if (DEBUG_START_LEVEL > 0) {
      while (state.cells.length < 12) {
        const tail = state.cells[state.cells.length - 1];
        state.cells.push({ i: tail.i, j: tail.j });
      }
    }
    startLevel(DEBUG_START_LEVEL);
  }

  function formatDuration(sec) {
    const total = Math.max(0, Math.floor(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}分${String(s).padStart(2, '0')}秒`;
  }

  function saveBest() {
    try {
      const key = 'devour-best';
      const best = Math.max(Number(window.localStorage.getItem(key) || 0), state.score);
      window.localStorage.setItem(key, String(best));
    } catch (err) {
      /* 无 localStorage 时忽略 */
    }
  }

  function gameOver(reason) {
    state.over = true;
    saveBest();
    el.ovtitle.textContent = '被吞掉了';
    el.ovsub.textContent = reason;
    el.ovscore.textContent = `${state.score} 分`;
    el.ovtime.textContent = `存活 ${formatDuration(state.time)}`;
    el.ovdetail.textContent = `抵达第 ${state.level + 1} 关 · 击杀 ${state.kills} · 吃豆 ${state.eaten}`;
    el.overlay.classList.add('show');
  }

  function victory() {
    state.over = true;
    saveBest();
    el.ovtitle.textContent = '通关';
    el.ovsub.textContent = '你吞掉了根须巨蛇与黄金法老，整座神庙都成了你的巢。';
    el.ovscore.textContent = `${state.score} 分`;
    el.ovtime.textContent = `存活 ${formatDuration(state.time)}`;
    el.ovdetail.textContent = `体长 ${state.cells.length} · 击杀 ${state.kills} · 吃豆 ${state.eaten}`;
    el.overlay.classList.add('show');
  }

  // ---------- 主循环 ----------
  const clock = new THREE.Clock();

  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    state.time += dt;

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) el.toast.style.display = 'none';
    }

    if (!state.paused && !state.over) {
      state.shootCd = Math.max(0, state.shootCd - dt);
      state.invuln = Math.max(0, state.invuln - dt);

      // 受击时身体整体闪一下（包括被身体挡下的伤害）
      state.hitFlash = Math.max(0, state.hitFlash - dt);
      if (state.hitFlash > 0) {
        ribbon.material.color.setHex(0xffb3a0);
      } else {
        ribbon.material.color.setHex(0xffffff);
      }

      updateSnake(dt);
      updateStartRoom(dt);

      if (state.phase === 'clear') {
        updateEnemies(dt);
        updatePods(dt);
      }
      if (state.phase === 'boss') {
        updateBoss(dt);
        updateBossBullets(dt);
      }

      updateBullets(dt);
      updateOrbs(dt);
      updateBooms(dt);
      updatePellets();
      updateCards(dt);
      updateDoor(dt);
      checkClear();
      checkDoor();
      updateCamera(dt);
    } else if (state.paused) {
      updateDoor(dt);
    }

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  resetGame();
  state.paused = true; // 等待开始界面点击后再跑
  showHelp();
  window.__devour = state; // 调试钩子
  window.__devourApi = { startLevel, bossDie, pickCard, resetGame, isObstacle, clearObstacles: () => obstacles.clear() };
  window.startDevour = () => {
    resetGame();
    showHelp();
    clock.getDelta(); // 清掉暂停期间累积的 delta
    state.paused = false;
  };
  renderer.setAnimationLoop(tick);
})();
