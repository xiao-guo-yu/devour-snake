/* DEVOUR — 七小关 + Boss 战役原型
 * 45×45 格 · 8 方向格点移动 · 体长 = HP · 射击消耗体节
 * 流程：清光敌人 → 门开 → 下一关 ×7 → Boss → 吞噬核心获得技能 → 传送门通关
 */
(() => {
  'use strict';

  // ---------- 常量 ----------
  const N = 45;
  const HALF = (N - 1) / 2;
  const STEP = 0.12;
  const START_LEN = 5;
  const MAX_BODY = 80;
  const SHOOT_COOLDOWN = 0.14;
  const BULLET_SPEED = 18;
  const INVULN = 0.8;
  const BOSS_HP = 280;
  const BOSS_SPEED = 1.0;
  const WISP_RENDER_SCALE = 1.45;
  const PLAYER_BULLET_RADIUS = 0.16;
  const ENEMY_HIT_RADIUS = 1.5;
  const SHIELD_DURATION = 2;
  const SHIELD_COOLDOWN = 5;
  const FIRE_BULLET_COST = 2;
  const FIRE_BULLET_DAMAGE = 2;
  const FIRE_BULLET_SCALE = 1.9;
  const ENERGY_BALL_COST = 3;
  const ENERGY_BALL_COOLDOWN = 3;
  const ENERGY_BALL_DAMAGE = 45;
  const GHOST_BULLET_RADIUS = 0.56;
  // 原命中半径 0.62，攻击整体放大为两倍
  const GHOST_BULLET_HIT_RADIUS = 1.24;
  const GHOST_BULLET_SPEED = 2;
  const ICE_SPAWN_INTERVAL = 15;
  const ICE_MAX_ACTIVE = 72;
  const DRAGON_BREATH_TELEGRAPH = 0.85;
  const DRAGON_BREATH_ACTIVE = 1.15;
  const DRAGON_BREATH_COOLDOWN = 6.2;
  const DRAGON_BREATH_RANGE = 19;
  const DRAGON_BREATH_HALF_ANGLE = Math.PI * 0.29;
  const FROST_SKILL_COST = 2;
  const FROST_SKILL_COOLDOWN = 6;
  const FROST_SKILL_DURATION = 3;
  const FROST_SKILL_RANGE = 13;
  const FROST_SKILL_HALF_ANGLE = Math.PI * 0.34;
  // 默认从第一关开始；开发时可用 ?level=11 显式进入指定房间。
  const DEBUG_START_LEVEL = (() => {
    try {
      const value = Number(new URLSearchParams(window.location.search).get('level'));
      return Number.isInteger(value) ? Math.max(0, Math.min(ROOM_COUNT - 1, value)) : 0;
    } catch (err) {
      return 0;
    }
  })();
  const DOOR_CELL = { i: 22, j: 1 };
  const SPAWN_DOOR_CELL = { i: 22, j: N - 1 };
  const BOSS_CELL = { i: 22, j: 22 };
  const COLOSSUS_LANDING_CELLS = [
    { i: 4, j: 4 },
    { i: N - 5, j: 4 },
    { i: 4, j: N - 5 },
    { i: N - 5, j: N - 5 },
    { i: 22, j: 22 },
  ];
  const COLOSSUS_RENDER_SCALE = 2.4;
  const COLOSSUS_JUMP_TIME = 2.2;
  const COLOSSUS_JUMP_COOLDOWN = 10;
  const COLOSSUS_CRUSH_RADIUS = 5.25;
  const COLOSSUS_FIREBALL_SIZE = 7.6;
  const COLOSSUS_FIREBALL_SPEED = 5.2;
  const COLOSSUS_FIREBALL_HIT_RADIUS = 4.2;
  const COLOSSUS_FIREBALL_WALL_RADIUS = 3.6;
  const COLOSSUS_POOL_SIZE = 7;
  const COLOSSUS_POOL_DURATION = 10;
  const ROOT_SUMMON_INTERVAL = 15;
  const ROOT_BULLET_INTERVAL = 5;
  const PHARAOH_BULLET_INTERVAL = 6;
  const PHARAOH_SHIELD_HP = 3;
  const PHARAOH_SHIELD_RESPAWN = 20;
  const SKILL_HUD_REVEAL_SECONDS = 6.5;
  const NORMAL_PELLET_COUNT = 10;
  const BOSS_PELLET_BONUS = 6;
  const ENERGY_PELLET_CHANCE = 0.15;
  const TWO_STAR_DAMAGE_LIMIT = 20;
  const THREE_STAR_TIME_LIMIT = 180;
  const DAMAGE_SCORE_PENALTY = 25;

  // 小怪数值按类型读取；速度单位为格/秒。
  const ENEMY_STATS = {
    spore: {
      hp: 1, speed: 0.9, contactDamage: 1, contactCooldown: 1.25,
      contactRadius: 0.72, retreatSpeedMul: 0.4,
    },
    vine: {
      hp: 1, speed: 1.8, contactDamage: 2, contactCooldown: 1.1,
      contactRadius: 0.76, retreatSpeedMul: 0.42,
    },
    trap: {
      hp: 1, speed: 1.05, contactDamage: 2, contactCooldown: 1.35,
      contactRadius: 0.78, retreatSpeedMul: 0.36,
      shootCooldown: 4, shootRange: 24,
    },
    scarab: {
      hp: 2, speed: 1.6, contactDamage: 1, contactCooldown: 1.15,
      contactRadius: 0.7, retreatSpeedMul: 0.4,
    },
    mummy: {
      hp: 1, speed: 1.2, contactDamage: 2, contactCooldown: 1.3,
      contactRadius: 0.74, retreatSpeedMul: 0.38,
      eyeGlowCooldown: 5, eyeInvulnDuration: 2,
    },
    anubis: {
      hp: 1, speed: 1.35, contactDamage: 2, contactCooldown: 1.2,
      contactRadius: 0.76, retreatSpeedMul: 0.4,
      shootCooldown: 5.5, shootRange: 24, projectileCount: 2, projectileSpread: 0.16,
      staffGlow: true, pelletAbsorbHalfSize: 2,
    },
    magmaSlime: {
      hp: 1, contactDamage: 2, contactCooldown: 1.4, contactRadius: 0.8,
      jumpDistance: 5, jumpInterval: 3, jumpDuration: 0.55,
    },
    obsidianBeetle: {
      hp: 2, speed: 3.15, contactDamage: 2, contactCooldown: 1.15,
      contactRadius: 0.72, retreatSpeedMul: 0.45, trailInterval: 0.6,
    },
    emberWisp: {
      hp: 1, speed: 0.36, contactDamage: 0, contactCooldown: 1,
      contactRadius: 0.7, retreatSpeedMul: 0.4,
      shootCooldown: 3.6, revealDelay: 0.35, hideHalfSize: 4,
    },
    // 第四章小怪的机制与最终数值后续单独补齐；此处只提供关卡主体所需的占位数值。
    iceSlug: {
      hp: 1, speed: 0.78, contactDamage: 1, contactCooldown: 1.3,
      contactRadius: 0.74, retreatSpeedMul: 0.4,
    },
    frostWolf: {
      hp: 1, speed: 2.05, contactDamage: 2, contactCooldown: 1.15,
      contactRadius: 0.76, retreatSpeedMul: 0.46,
    },
    frostWisp: {
      hp: 1, speed: 0.42, contactDamage: 1, contactCooldown: 1.25,
      contactRadius: 0.7, retreatSpeedMul: 0.4,
    },
  };

  // 每个区域 7 个普通关 + 第 8 关 Boss；composition 表示三种小怪的具体数量。
  const ROOMS = [
    { theme: 'green', kind: 'clear', composition: { spore: 8 }, name: '腐殖温室 · 前厅' },
    { theme: 'green', kind: 'clear', composition: { spore: 5, vine: 3 }, name: '腐殖温室 · 根礼拜堂' },
    { theme: 'green', kind: 'clear', composition: { vine: 8 }, name: '腐殖温室 · 根之圣所' },
    { theme: 'green', kind: 'clear', composition: { spore: 5, trap: 3 }, name: '腐殖温室 · 腐生苗床' },
    { theme: 'green', kind: 'clear', composition: { spore: 3, vine: 2, trap: 3 }, name: '腐殖温室 · 根脉交叉' },
    { theme: 'green', kind: 'clear', composition: { vine: 5, trap: 3 }, name: '腐殖温室 · 捕食花圃' },
    { theme: 'green', kind: 'clear', composition: { trap: 8 }, name: '腐殖温室 · 圣所深处' },
    { theme: 'green', kind: 'boss', boss: 'rootcoil', name: '枯树 · ROOTCOIL' },

    { theme: 'temple', kind: 'clear', composition: { scarab: 8 }, name: '沙海神庙 · 柱厅' },
    { theme: 'temple', kind: 'clear', composition: { scarab: 5, mummy: 3 }, name: '沙海神庙 · 供奉廊' },
    { theme: 'temple', kind: 'clear', composition: { mummy: 8 }, name: '沙海神庙 · 内殿' },
    { theme: 'temple', kind: 'clear', composition: { scarab: 5, anubis: 3 }, name: '沙海神庙 · 圣甲虫墓道' },
    { theme: 'temple', kind: 'clear', composition: { scarab: 3, mummy: 2, anubis: 3 }, name: '沙海神庙 · 王陵中庭' },
    { theme: 'temple', kind: 'clear', composition: { mummy: 5, anubis: 3 }, name: '沙海神庙 · 守墓长廊' },
    { theme: 'temple', kind: 'clear', composition: { anubis: 8 }, name: '沙海神庙 · 黄金王座' },
    { theme: 'temple', kind: 'boss', boss: 'pharaoh', name: '黄金法老 · PHARAOH' },

    { theme: 'volcano', kind: 'clear', composition: { magmaSlime: 8 }, name: '熔火地脉 · 裂谷' },
    { theme: 'volcano', kind: 'clear', composition: { magmaSlime: 5, obsidianBeetle: 3 }, name: '熔火地脉 · 焦岩长廊' },
    { theme: 'volcano', kind: 'clear', composition: { obsidianBeetle: 8 }, name: '熔火地脉 · 余烬祭坛' },
    { theme: 'volcano', kind: 'clear', composition: { magmaSlime: 5, emberWisp: 3 }, name: '熔火地脉 · 熔渣坡道' },
    { theme: 'volcano', kind: 'clear', composition: { magmaSlime: 3, obsidianBeetle: 2, emberWisp: 3 }, name: '熔火地脉 · 炽脉交汇' },
    { theme: 'volcano', kind: 'clear', composition: { obsidianBeetle: 5, emberWisp: 3 }, name: '熔火地脉 · 熔炉深处' },
    { theme: 'volcano', kind: 'clear', composition: { emberWisp: 8 }, name: '熔火地脉 · 火山核心' },
    { theme: 'volcano', kind: 'boss', boss: 'magma_colossus', name: '熔岩巨像 · MAGMA COLOSSUS' },

    { theme: 'frozen', kind: 'clear', composition: { iceSlug: 8 }, name: '永冻冰原 · 霜原边缘' },
    { theme: 'frozen', kind: 'clear', composition: { iceSlug: 5, frostWolf: 3 }, name: '永冻冰原 · 裂冰走廊' },
    { theme: 'frozen', kind: 'clear', composition: { frostWolf: 8 }, name: '永冻冰原 · 狼嚎冻谷' },
    { theme: 'frozen', kind: 'clear', composition: { iceSlug: 5, frostWisp: 3 }, name: '永冻冰原 · 寒晶蛞蝓穴' },
    { theme: 'frozen', kind: 'clear', composition: { iceSlug: 3, frostWolf: 2, frostWisp: 3 }, name: '永冻冰原 · 雾灵回廊' },
    { theme: 'frozen', kind: 'clear', composition: { frostWolf: 5, frostWisp: 3 }, name: '永冻冰原 · 霜骨荒径' },
    { theme: 'frozen', kind: 'clear', composition: { frostWisp: 8 }, name: '永冻冰原 · 冰封王座前庭' },
    { theme: 'frozen', kind: 'boss', boss: 'frost_dragon', name: '凛冬冰龙 · FROST DRAGON' },
  ];
  const ROOM_COUNT = ROOMS.length;

  // ---------- 渲染基础 ----------
  const stage = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050906);
  scene.fog = new THREE.Fog(0x06110b, 52, 105);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
  camera.up.set(0, 0, -1);
  camera.position.set(0, 80, 0);
  camera.lookAt(0, 0, 0);

  const hemi = new THREE.HemisphereLight(0x9cebd2, 0x07100b, 0.82);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd99b, 1.05);
  sun.position.set(20, 40, 14);
  scene.add(sun);

  // ---------- 坐标 ----------
  const cellX = (i) => i - HALF;
  const cellZ = (j) => j - HALF;

  // ---------- 地板 ----------
  const floorGeo = new THREE.BoxGeometry(0.96, 0.12, 0.96);
  const matA = new THREE.MeshStandardMaterial({ color: 0x12231a, roughness: 0.96 });
  const matB = new THREE.MeshStandardMaterial({ color: 0x1a3024, roughness: 0.96 });
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

  const lavaUnderlay = new THREE.Mesh(
    new THREE.PlaneGeometry(N + 2, N + 2),
    new THREE.MeshBasicMaterial({
      color: 0xb43b08,
      transparent: true,
      opacity: 0.9,
      fog: false,
    })
  );
  lavaUnderlay.rotation.x = -Math.PI / 2;
  lavaUnderlay.position.y = -0.13;
  lavaUnderlay.visible = false;
  scene.add(lavaUnderlay);

  // ---------- 外墙 ----------
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x352d20, roughness: 0.88 });
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
    const roomWallMat = new THREE.MeshStandardMaterial({ color: 0x352d20, roughness: 0.88 });
    const roomFloorMat = new THREE.MeshBasicMaterial({ color: 0x14251b, fog: false });
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
    new THREE.MeshStandardMaterial({ color: 0x352d20, roughness: 0.88 })
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
  const dynamicIce = new Map();
  const STUMP_COUNT = 8;

  const inBounds = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  const isObstacle = (i, j) => obstacles.has(`${i},${j}`) || dynamicIce.has(`${i},${j}`);

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
    const headGrad = g.createRadialGradient(
      cx - w * 0.36, cy - h * 0.4, S * 0.025,
      cx, cy, h * 1.18
    );
    headGrad.addColorStop(0, '#b9ffe8');
    headGrad.addColorStop(0.34, '#64e6b9');
    headGrad.addColorStop(1, '#17775d');
    g.fillStyle = headGrad;
    g.fill();
    g.lineWidth = S * 0.038;
    g.strokeStyle = INK;
    g.stroke();
    g.save();
    g.beginPath();
    g.ellipse(cx, cy, w * 0.94, h * 0.9, 0, 0, Math.PI * 2);
    g.clip();
    g.strokeStyle = 'rgba(5, 75, 57, .42)';
    g.lineWidth = Math.max(1, S * 0.009);
    for (let row = -3; row <= 3; row++) {
      for (let col = -2; col <= 2; col++) {
        g.beginPath();
        g.arc(cx + col * S * 0.065 + (row % 2) * S * 0.032, cy + row * S * 0.062, S * 0.036, 0, Math.PI);
        g.stroke();
      }
    }
    g.restore();
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
      g.beginPath();
      g.arc(cx + w * dx, cy - h * 0.405, S * 0.017, 0, Math.PI * 2);
      g.fillStyle = INK;
      g.fill();
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

  function drawMagmaSlime(g, S) {
    const cx = S * 0.5, cy = S * 0.53;
    g.clearRect(0, 0, S, S);
    const glow = g.createRadialGradient(cx, cy, S * 0.05, cx, cy, S * 0.44);
    glow.addColorStop(0, '#ffe3a6');
    glow.addColorStop(0.45, '#f28a4d');
    glow.addColorStop(1, 'rgba(119,35,11,.08)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(cx, cy, S * 0.43, 0, Math.PI * 2);
    g.fill();

    g.beginPath();
    g.moveTo(S * 0.16, S * 0.57);
    g.bezierCurveTo(S * 0.12, S * 0.18, S * 0.88, S * 0.16, S * 0.85, S * 0.59);
    g.bezierCurveTo(S * 0.82, S * 0.84, S * 0.68, S * 0.79, S * 0.63, S * 0.9);
    g.bezierCurveTo(S * 0.57, S * 0.79, S * 0.48, S * 0.84, S * 0.42, S * 0.77);
    g.bezierCurveTo(S * 0.34, S * 0.84, S * 0.22, S * 0.79, S * 0.16, S * 0.57);
    g.closePath();
    g.fillStyle = '#8b4b37';
    g.fill();
    g.strokeStyle = '#ffd28a';
    g.lineWidth = S * 0.025;
    g.stroke();
    g.beginPath();
    g.ellipse(S * 0.4, S * 0.33, S * 0.16, S * 0.09, -0.28, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255, 237, 195, .32)';
    g.fill();

    g.strokeStyle = '#ffc65f';
    g.lineWidth = S * 0.018;
    g.lineCap = 'round';
    const cracks = [
      [0.25, 0.34, 0.38, 0.44, 0.33, 0.6],
      [0.76, 0.33, 0.63, 0.45, 0.72, 0.62],
      [0.5, 0.18, 0.47, 0.34, 0.55, 0.48],
      [0.22, 0.66, 0.35, 0.65, 0.42, 0.76],
    ];
    for (const c of cracks) {
      g.beginPath();
      g.moveTo(S * c[0], S * c[1]);
      g.lineTo(S * c[2], S * c[3]);
      g.lineTo(S * c[4], S * c[5]);
      g.stroke();
    }
    for (const dx of [-0.12, 0.12]) {
      g.beginPath();
      g.ellipse(cx + S * dx, cy - S * 0.02, S * 0.047, S * 0.06, 0, 0, Math.PI * 2);
      g.fillStyle = '#fff3b0';
      g.fill();
      g.shadowColor = '#ffc15a';
      g.shadowBlur = S * 0.08;
      g.fill();
      g.shadowBlur = 0;
    }
  }

  function drawObsidianBeetle(g, S) {
    const cx = S / 2, cy = S * 0.54;
    g.clearRect(0, 0, S, S);
    g.strokeStyle = '#160b08';
    g.lineWidth = S * 0.035;
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let k = -1; k <= 1; k++) {
        g.beginPath();
        g.moveTo(cx + side * S * 0.24, cy + k * S * 0.1);
        g.lineTo(cx + side * S * 0.43, cy + (k - 0.15) * S * 0.18);
        g.stroke();
      }
    }
    const body = g.createRadialGradient(cx - S * 0.1, cy - S * 0.18, S * 0.02, cx, cy, S * 0.37);
    body.addColorStop(0, '#514038');
    body.addColorStop(0.45, '#171313');
    body.addColorStop(1, '#070707');
    g.beginPath();
    g.ellipse(cx, cy, S * 0.29, S * 0.37, 0, 0, Math.PI * 2);
    g.fillStyle = body;
    g.fill();
    g.strokeStyle = '#050505';
    g.lineWidth = S * 0.038;
    g.stroke();
    g.beginPath();
    g.moveTo(cx, S * 0.18);
    g.lineTo(cx, S * 0.7);
    g.strokeStyle = '#ff5b0b';
    g.lineWidth = S * 0.025;
    g.stroke();
    g.beginPath();
    g.moveTo(cx - S * 0.21, S * 0.32);
    g.lineTo(cx + S * 0.18, S * 0.55);
    g.moveTo(cx + S * 0.21, S * 0.32);
    g.lineTo(cx - S * 0.18, S * 0.55);
    g.strokeStyle = 'rgba(255,105,18,.72)';
    g.lineWidth = S * 0.014;
    g.stroke();
    for (const dx of [-0.09, 0.09]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.8, S * 0.035, 0, Math.PI * 2);
      g.fillStyle = '#ffbc3b';
      g.fill();
    }
  }

  function drawEmberWisp(g, S) {
    const cx = S / 2, cy = S * 0.57;
    g.clearRect(0, 0, S, S);
    const aura = g.createRadialGradient(cx, cy, S * 0.04, cx, cy, S * 0.43);
    aura.addColorStop(0, 'rgba(157,231,255,.82)');
    aura.addColorStop(0.48, 'rgba(63,146,216,.4)');
    aura.addColorStop(1, 'rgba(14,34,68,0)');
    g.fillStyle = aura;
    g.beginPath();
    g.arc(cx, cy, S * 0.43, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(cx - S * 0.23, S * 0.72);
    g.bezierCurveTo(S * 0.23, S * 0.88, S * 0.18, S * 0.28, cx, S * 0.16);
    g.bezierCurveTo(S * 0.8, S * 0.29, S * 0.77, S * 0.87, cx + S * 0.23, S * 0.72);
    g.closePath();
    g.fillStyle = '#14232f';
    g.fill();
    g.strokeStyle = '#72d4ff';
    g.lineWidth = S * 0.018;
    g.stroke();
    g.beginPath();
    g.moveTo(cx - S * 0.17, S * 0.44);
    g.bezierCurveTo(cx - S * 0.08, S * 0.6, cx + S * 0.09, S * 0.34, cx + S * 0.16, S * 0.55);
    g.strokeStyle = '#63c8ff';
    g.lineWidth = S * 0.06;
    g.stroke();
    for (const dx of [-0.09, 0.09]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.52, S * 0.035, 0, Math.PI * 2);
      g.fillStyle = '#c8f5ff';
      g.fill();
      g.shadowColor = '#58c8ff';
      g.shadowBlur = S * 0.06;
      g.fill();
      g.shadowBlur = 0;
    }
    g.strokeStyle = 'rgba(103,145,174,.7)';
    g.lineWidth = S * 0.02;
    g.beginPath();
    g.moveTo(cx, S * 0.2);
    g.bezierCurveTo(cx + S * 0.05, S * 0.06, cx - S * 0.12, S * 0.02, cx - S * 0.03, -S * 0.04);
    g.stroke();
  }

  function drawMagmaColossus(g, S) {
    const cx = S / 2, cy = S * 0.53;
    g.clearRect(0, 0, S, S);
    const glow = g.createRadialGradient(cx, cy, S * 0.05, cx, cy, S * 0.48);
    glow.addColorStop(0, 'rgba(255,132,31,.66)');
    glow.addColorStop(0.55, 'rgba(125,30,7,.25)');
    glow.addColorStop(1, 'rgba(20,4,2,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(cx, cy, S * 0.48, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#070707';
    g.lineWidth = S * 0.055;
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + side * S * 0.18, S * 0.35);
      g.lineTo(cx + side * S * 0.4, S * 0.52);
      g.lineTo(cx + side * S * 0.33, S * 0.74);
      g.stroke();
    }
    g.beginPath();
    g.ellipse(cx, cy, S * 0.24, S * 0.32, 0, 0, Math.PI * 2);
    g.fillStyle = '#1a1210';
    g.fill();
    g.strokeStyle = '#060606';
    g.lineWidth = S * 0.045;
    g.stroke();
    g.strokeStyle = '#ff5b0b';
    g.lineWidth = S * 0.022;
    g.beginPath();
    g.moveTo(cx, S * 0.23);
    g.lineTo(cx - S * 0.04, S * 0.5);
    g.lineTo(cx + S * 0.02, S * 0.69);
    g.moveTo(cx - S * 0.16, S * 0.38);
    g.lineTo(cx - S * 0.02, S * 0.5);
    g.lineTo(cx + S * 0.15, S * 0.72);
    g.stroke();
    g.beginPath();
    g.ellipse(cx, S * 0.58, S * 0.09, S * 0.12, 0, 0, Math.PI * 2);
    g.fillStyle = '#ff8e1e';
    g.fill();
    g.shadowColor = '#ff5c0c';
    g.shadowBlur = S * 0.1;
    g.fill();
    g.shadowBlur = 0;
    for (const dx of [-0.085, 0.085]) {
      g.beginPath();
      g.arc(cx + S * dx, S * 0.29, S * 0.032, 0, Math.PI * 2);
      g.fillStyle = '#ffd65a';
      g.fill();
    }
    g.beginPath();
    g.moveTo(cx - S * 0.13, S * 0.2);
    g.quadraticCurveTo(cx, S * 0.02, cx + S * 0.13, S * 0.2);
    g.fillStyle = '#ff7b17';
    g.fill();
  }

  const headTex = spriteTexture(256, drawSnakeHead);
  const imageTextureLoader = typeof THREE.TextureLoader === 'function'
    ? new THREE.TextureLoader()
    : null;
  const loadCharacterTexture = (file, fallback) => (
    imageTextureLoader
      ? imageTextureLoader.load(`assets/${file}?v=20261122-frozen2`)
      : fallback
  );
  const loadPixelTexture = (file, fallback) => {
    const texture = imageTextureLoader
      ? imageTextureLoader.load(`assets/${file}?v=20261118-colossus-attacks`)
      : fallback;
    if (texture && imageTextureLoader) {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
    }
    return texture;
  };
  const TEX = {
    spore: loadCharacterTexture('spore.png', spriteTexture(192, drawSpore)),
    vine: loadCharacterTexture('vine.png', spriteTexture(192, drawVine)),
    trap: loadCharacterTexture('trap.png', spriteTexture(192, drawTrap)),
    scarab: loadCharacterTexture('scarab.png', spriteTexture(192, drawScarab)),
    scarabBroken: loadCharacterTexture(
      'scarab-broken.png',
      spriteTexture(192, (g, S) => drawScarab(g, S, true))
    ),
    mummy: loadCharacterTexture('mummy.png', spriteTexture(192, drawMummy)),
    anubis: loadCharacterTexture('anubis.png', spriteTexture(192, drawAnubis)),
    magmaSlime: loadCharacterTexture('magma-slime.png', spriteTexture(192, drawMagmaSlime)),
    obsidianBeetle: loadCharacterTexture('obsidian-beetle.png', spriteTexture(192, drawObsidianBeetle)),
    emberWisp: loadCharacterTexture('ember-wisp.png', spriteTexture(192, drawEmberWisp)),
    iceSlug: loadCharacterTexture('ice-slug.png', null),
    frostWolf: loadCharacterTexture('frost-wolf.png', null),
    frostWisp: loadCharacterTexture('frost-wisp.png', null),
  };
  const ENEMY_MATS = {};
  for (const key of Object.keys(TEX)) {
    ENEMY_MATS[key] = TEX[key]
      ? new THREE.MeshBasicMaterial({
        map: TEX[key],
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
      : new THREE.MeshBasicMaterial({ color: 0x8a7b86 });
  }
  const magmaColossusTex = loadCharacterTexture(
    'magma-colossus.png',
    spriteTexture(512, drawMagmaColossus)
  );
  const BOSS_TEX = {
    rootcoil: loadCharacterTexture('rootcoil.png', spriteTexture(512, drawBoss)),
    pharaoh: loadCharacterTexture('pharaoh.png', spriteTexture(512, drawPharaoh)),
    magma_colossus: magmaColossusTex,
    frost_dragon: loadCharacterTexture('frost-dragon-idle.png', null),
  };
  const FROST_DRAGON_ATTACK_TEX = loadCharacterTexture('frost-dragon-attack.png', null);
  const DRAGON_BREATH_TEX = loadCharacterTexture('dragon-breath.png', null);

  // ---------- 障碍外观：温室用树桩，神庙用石柱（每处占 2×2 = 4 格） ----------
  const OBSTACLE_PLANES = 16;
  const stumpPlanes = [];
  const STUMP_TEX = spriteTexture(256, drawStump);
  const COLUMN_TEX = spriteTexture(256, drawColumn);
  const LAVA_PIT_TEX = typeof THREE.TextureLoader === 'function'
    ? new THREE.TextureLoader().load('assets/lava-pit.png')
    : null;
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

  // 第四章冰障：每个实例严格占 1×1 格，由计时器动态追加。
  const iceBlockMeshes = [];
  const ICE_BLOCK_TEX = loadCharacterTexture('ice-block.png', null);
  {
    const geo = new THREE.PlaneGeometry(1.02, 1.02);
    for (let k = 0; k < ICE_MAX_ACTIVE; k++) {
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          map: ICE_BLOCK_TEX || null,
          color: ICE_BLOCK_TEX ? 0xffffff : 0x8bdcff,
          transparent: true,
          opacity: 0.98,
          depthWrite: false,
          fog: false,
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.31;
      mesh.visible = false;
      mesh.renderOrder = 2;
      scene.add(mesh);
      iceBlockMeshes.push(mesh);
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
      // Keep the opening corridor readable before the player takes control.
      if (level === 0 && i < 23 && Math.abs(j - START_ROOM.doorJ) < 5) return false;
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

  /** 火山：2x2 熔岩坑，避开出生点、传送门和 Boss 中心 */
  function layoutVolcano() {
    const seeds = [];
    const fits = (i, j) => {
      if (i < 4 || j < 4 || i > N - 6 || j > N - 6) return false;
      if (Math.abs(i - 22) < 6 && j < 9) return false;
      if (Math.abs(i - 22) < 7 && j > 32) return false;
      for (const anchor of COLOSSUS_LANDING_CELLS) {
        if (Math.abs(i - anchor.i) < 3 && Math.abs(j - anchor.j) < 3) return false;
      }
      for (const [si, sj] of seeds) {
        if (Math.abs(si - i) < 8 && Math.abs(sj - j) < 8) return false;
      }
      return true;
    };
    let attempts = 0;
    while (seeds.length < 9 && attempts++ < 600) {
      const i = 4 + randInt(N - 11);
      const j = 4 + randInt(N - 11);
      if (!fits(i, j)) continue;
      seeds.push([i, j]);
    }
    placeObstacles(seeds, LAVA_PIT_TEX);
  }

  /** 第四章：不铺设固定障碍，冰晶由独立计时器生成。 */
  function layoutFrozen() {
    placeObstacles([], null);
    clearIceObstacles();
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

  const shieldPos = new Float32Array(MAX_PTS * 2 * 3);
  const shieldGeo = new THREE.BufferGeometry();
  shieldGeo.setAttribute('position', new THREE.BufferAttribute(shieldPos, 3));
  shieldGeo.setAttribute('normal', new THREE.BufferAttribute(ribbonNrm.slice(), 3));
  shieldGeo.setIndex(ribIdx.slice());
  shieldGeo.setDrawRange(0, 0);
  const shieldRibbon = new THREE.Mesh(shieldGeo, new THREE.MeshBasicMaterial({
    color: 0x9ddcff,
    transparent: true,
    opacity: 0.27,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  }));
  shieldRibbon.frustumCulled = false;
  shieldRibbon.visible = false;
  scene.add(shieldRibbon);

  const shieldHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.18, 40),
    new THREE.MeshBasicMaterial({
      color: 0xb8e9ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    })
  );
  shieldHalo.rotation.x = -Math.PI / 2;
  shieldHalo.scale.set(1.28, 0.8, 1);
  const shieldHaloRig = new THREE.Group();
  shieldHaloRig.add(shieldHalo);
  shieldHaloRig.visible = false;
  scene.add(shieldHaloRig);

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
      ? new THREE.MeshBasicMaterial({
        map: headTex,
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
      : new THREE.MeshBasicMaterial({ color: 0x4ecb9b })
  );
  headPlane.rotation.x = -Math.PI / 2;
  headPivot.add(headPlane);
  headPivot.position.y = 0.56;
  scene.add(headPivot);

  // ---------- 豆子 ----------
  const pelletGeo = new THREE.IcosahedronGeometry(0.28, 1);
  const pelletMat = new THREE.MeshStandardMaterial({
    color: 0xffd66b, emissive: 0xd28a12, emissiveIntensity: 1.65, roughness: 0.28,
  });
  const energyPelletMat = new THREE.MeshStandardMaterial({
    color: 0xff7a1a, emissive: 0xff4d00, emissiveIntensity: 2.1, roughness: 0.25,
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
  const enemyGeo = new THREE.PlaneGeometry(2.2, 2.2);
  const enemyPool = [];
  for (let i = 0; i < 24; i++) {
    const mesh = new THREE.Mesh(enemyGeo, ENEMY_MATS.spore);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    enemyPool.push(mesh);
  }

  // 木乃伊双眼发光与阿努比斯法杖光效，均跟随对应小怪移动。
  const mummyEyeGeo = new THREE.CircleGeometry(0.15, 18);
  const mummyEyes = [];
  const anubisStaffGlowGeo = new THREE.CircleGeometry(0.34, 24);
  const anubisStaffCoreGeo = new THREE.CircleGeometry(0.1, 16);
  const anubisStaffs = [];
  for (let i = 0; i < enemyPool.length; i++) {
    const eyePair = [-0.24, 0.24].map((x) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd84a,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        fog: false,
      });
      const eye = new THREE.Mesh(mummyEyeGeo, material);
      eye.position.set(x, 0.5, 0.07);
      eye.visible = false;
      enemyPool[i].add(eye);
      return eye;
    });
    mummyEyes.push(eyePair);

    const staffGlow = new THREE.Mesh(
      anubisStaffGlowGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffb42d,
        transparent: true,
        opacity: 0.66,
        depthWrite: false,
        fog: false,
      })
    );
    staffGlow.position.set(-0.58, 0.26, 0.08);
    staffGlow.visible = false;
    enemyPool[i].add(staffGlow);
    const staffCore = new THREE.Mesh(
      anubisStaffCoreGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfff0a0,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        fog: false,
      })
    );
    staffCore.position.set(-0.58, 0.26, 0.1);
    staffCore.visible = false;
    enemyPool[i].add(staffCore);
    anubisStaffs.push({ glow: staffGlow, core: staffCore });
  }

  // ---------- 子弹 ----------
  const bulletPool = [];
  for (let i = 0; i < 40; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(PLAYER_BULLET_RADIUS, 8, 6),
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

  const ghostBulletPool = [];
  for (let i = 0; i < 80; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(GHOST_BULLET_RADIUS, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0x9bdfff,
        emissive: 0x349fe8,
        emissiveIntensity: 1.8,
      })
    );
    mesh.visible = false;
    scene.add(mesh);
    ghostBulletPool.push(mesh);
  }

  const hazardPool = [];
  for (let i = 0; i < 60; i++) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.58, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff5a12,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.09;
    mesh.visible = false;
    scene.add(mesh);
    hazardPool.push(mesh);
  }

  // ---------- Boss 核心奖励 ----------
  const rewardOrbGroup = new THREE.Group();
  const rewardShellMat = new THREE.MeshStandardMaterial({
    color: 0x68e7b8,
    emissive: 0x68e7b8,
    emissiveIntensity: 1.05,
    transparent: true,
    opacity: 0.72,
    roughness: 0.24,
    depthWrite: false,
  });
  const rewardShell = new THREE.Mesh(new THREE.SphereGeometry(1.0, 28, 20), rewardShellMat);
  rewardShell.position.y = 1.0;
  rewardOrbGroup.add(rewardShell);

  const rewardCoreMat = new THREE.MeshStandardMaterial({
    color: 0xcaffea,
    emissive: 0x28b685,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
  const rewardCore = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), rewardCoreMat);
  rewardCore.position.y = 0.72;
  rewardOrbGroup.add(rewardCore);

  const rewardRingMat = new THREE.MeshBasicMaterial({
    color: 0x8ef7ca,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const rewardRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.035, 8, 48), rewardRingMat);
  rewardRing.rotation.x = Math.PI / 2;
  rewardRing.position.y = 0.24;
  rewardOrbGroup.add(rewardRing);
  rewardOrbGroup.visible = false;
  scene.add(rewardOrbGroup);

  const fireBurstPool = [];
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 1.28, 36),
      new THREE.MeshBasicMaterial({
        color: 0xff5a2e,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.3;
    mesh.visible = false;
    scene.add(mesh);
    fireBurstPool.push(mesh);
  }

  // Green core restores the original large energy wave.
  const energyOrbPool = [];
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0x9dffe0, transparent: true, opacity: 0.92, fog: false })
    );
    mesh.visible = false;
    scene.add(mesh);
    energyOrbPool.push(mesh);
  }

  const energyBoomPool = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 1.0, 40),
      new THREE.MeshBasicMaterial({
        color: 0xa6ffe0,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.5;
    mesh.visible = false;
    scene.add(mesh);
    energyBoomPool.push(mesh);
  }

  const bossMesh = new THREE.Group();
  let bossPlaneMat = null;
  let bossPoseTexture = null;
  {
    bossPlaneMat = new THREE.MeshBasicMaterial({
      map: BOSS_TEX.rootcoil || null,
      color: BOSS_TEX.rootcoil ? 0xffffff : 0x6b4a2f,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), bossPlaneMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.62;
    bossMesh.add(plane);
  }
  bossMesh.visible = false;
  scene.add(bossMesh);

  const pharaohShieldRig = new THREE.Group();
  const pharaohShieldDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.35, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffd268,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })
  );
  pharaohShieldDisc.rotation.x = -Math.PI / 2;
  pharaohShieldDisc.position.y = 0.18;
  pharaohShieldRig.add(pharaohShieldDisc);
  const pharaohShieldRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.35, 0.105, 8, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffe39a,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      fog: false,
    })
  );
  pharaohShieldRing.rotation.x = Math.PI / 2;
  pharaohShieldRing.position.y = 0.3;
  pharaohShieldRig.add(pharaohShieldRing);
  pharaohShieldRig.visible = false;
  scene.add(pharaohShieldRig);

  const rootSummonRig = new THREE.Group();
  const rootEyeGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff3b25,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    fog: false,
  });
  for (const x of [-0.24, 0.24]) {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.11, 18), rootEyeGlowMat);
    eye.rotation.x = -Math.PI / 2;
    eye.position.set(x, 0.72, -0.16);
    rootSummonRig.add(eye);
  }
  const rootSummonRing = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.95, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff4428,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    })
  );
  rootSummonRing.rotation.x = -Math.PI / 2;
  rootSummonRing.position.y = 0.25;
  rootSummonRig.add(rootSummonRing);
  rootSummonRig.visible = false;
  scene.add(rootSummonRig);

  // 凛冬冰龙龙息：贴图从左端窄口向右端展开，几何平移后以 Boss 嘴部为原点。
  const bossBreathRig = new THREE.Group();
  const bossBreathGeo = new THREE.PlaneGeometry(DRAGON_BREATH_RANGE, DRAGON_BREATH_RANGE * 0.56);
  bossBreathGeo.translate(DRAGON_BREATH_RANGE / 2, 0, 0);
  const bossBreathMat = new THREE.MeshBasicMaterial({
    map: DRAGON_BREATH_TEX || null,
    color: DRAGON_BREATH_TEX ? 0xffffff : 0x8de9ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const bossBreathMesh = new THREE.Mesh(bossBreathGeo, bossBreathMat);
  bossBreathMesh.rotation.x = -Math.PI / 2;
  bossBreathMesh.position.y = 0.28;
  bossBreathMesh.renderOrder = 4;
  bossBreathRig.add(bossBreathMesh);
  bossBreathRig.visible = false;
  scene.add(bossBreathRig);

  const playerFrostRig = new THREE.Group();
  const playerFrostGeo = new THREE.PlaneGeometry(11.5, 5.2);
  playerFrostGeo.translate(5.75, 0, 0);
  const playerFrostMesh = new THREE.Mesh(
    playerFrostGeo,
    new THREE.MeshBasicMaterial({
      map: DRAGON_BREATH_TEX || null,
      color: DRAGON_BREATH_TEX ? 0x9beaff : 0x8de9ff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })
  );
  playerFrostMesh.rotation.x = -Math.PI / 2;
  playerFrostMesh.position.y = 0.32;
  playerFrostMesh.renderOrder = 4;
  playerFrostRig.add(playerFrostMesh);
  playerFrostRig.visible = false;
  scene.add(playerFrostRig);

  const colossusShadow = new THREE.Mesh(
    new THREE.CircleGeometry(6.45, 48),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    })
  );
  colossusShadow.rotation.x = -Math.PI / 2;
  colossusShadow.position.y = 0.16;
  colossusShadow.visible = false;
  scene.add(colossusShadow);

  const colossusImpactRing = new THREE.Mesh(
    new THREE.RingGeometry(4.65, 6.75, 48),
    new THREE.MeshBasicMaterial({
      color: 0xff6a22,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    })
  );
  colossusImpactRing.rotation.x = -Math.PI / 2;
  colossusImpactRing.position.y = 0.18;
  colossusImpactRing.visible = false;
  scene.add(colossusImpactRing);

  const COLOSSUS_FIREBALL_TEX = loadPixelTexture('colossus-fireball.png', null);
  const COLOSSUS_POOL_TEX = loadPixelTexture('colossus-lava-pool.png', null);
  const colossusFireballPool = [];
  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(COLOSSUS_FIREBALL_SIZE, COLOSSUS_FIREBALL_SIZE),
      new THREE.MeshBasicMaterial({
        map: COLOSSUS_FIREBALL_TEX || null,
        color: COLOSSUS_FIREBALL_TEX ? 0xffffff : 0xff6b1a,
        transparent: true,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.48;
    mesh.visible = false;
    scene.add(mesh);
    colossusFireballPool.push(mesh);
  }

  const colossusPoolPool = [];
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(COLOSSUS_POOL_SIZE, COLOSSUS_POOL_SIZE),
      new THREE.MeshBasicMaterial({
        map: COLOSSUS_POOL_TEX || null,
        color: COLOSSUS_POOL_TEX ? 0xffffff : 0xff5b12,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.11;
    mesh.visible = false;
    scene.add(mesh);
    colossusPoolPool.push(mesh);
  }

  // ---------- 传送门：项目方提供的像素环 ----------
  const doorGroup = new THREE.Group();
  const PORTAL_TEX = loadPixelTexture('portal.png', spriteTexture(256, drawPortal));
  const doorPad = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
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

  // 过关后从地图底部出生传送门钻出
  const spawnDoorGroup = new THREE.Group();
  const spawnDoorPad = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({
      map: PORTAL_TEX || null,
      color: PORTAL_TEX ? 0xffffff : 0x6ee7b7,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  spawnDoorPad.rotation.x = -Math.PI / 2;
  spawnDoorPad.position.y = 0.12;
  spawnDoorGroup.add(spawnDoorPad);
  spawnDoorGroup.position.set(cellX(SPAWN_DOOR_CELL.i), 0, cellZ(SPAWN_DOOR_CELL.j));
  spawnDoorGroup.visible = false;
  scene.add(spawnDoorGroup);

  // ---------- Boss 核心奖励 ----------
  const SKILL_REWARDS = {
    rootcoil: { id: 'green', color: 0x68e7b8, core: 0xcaffea, emissive: 0x28b685 },
    pharaoh: { id: 'yellow', color: 0xf0c66c, core: 0xfff0b8, emissive: 0xc28d24 },
    magma_colossus: { id: 'red', color: 0xff6542, core: 0xffd0a0, emissive: 0xd93a12 },
    frost_dragon: { id: 'ice', color: 0x8de9ff, core: 0xe0fbff, emissive: 0x3fa6d9 },
  };

  // ---------- 状态 ----------
  const state = {
    level: 0,
    phase: 'clear',
    cells: [],
    dir: { i: 0, j: -1 },
    progress: 1,
    invuln: 0,
    score: 0,
    damageTaken: 0,
    kills: 0,
    eaten: 0,
    over: false,
    paused: false,
    shootCd: 0,
    bullets: [],
    enemyBullets: [],
    pods: [],
    ghostBullets: [],
    hazards: [],
    lavaBalls: [],
    lavaPools: [],
    skillOrb: null,
    fireBursts: [],
    orbs: [],
    booms: [],
    energyCd: 0,
    shieldTimer: 0,
    shieldCooldown: 0,
    shieldFlash: 0,
    frostCooldown: 0,
    frostEffectTimer: 0,
    iceSpawnTimer: ICE_SPAWN_INTERVAL,
    roomActive: false,
    roomTimer: 0,
    spawnEmerging: false,
    spawnPending: 0,
    spawnPortalClosing: false,
    spawnPortalOpacity: 0,
    enemies: [],
    pellets: [],
    boss: null,
    prevTail: null,
    hitFlash: 0,
    doorOpen: false,
    pelletsOff: false,
    time: 0,
    levelTime: 0,
    timerDisplayedSecond: -1,
    roomEnemyTypes: [],
    shotDamage: 6,
    shootCdMul: 1,
    spawnGrace: 0,
    slowTimer: 0,
    clearedNotified: new Set(),
  };

  let viewMode = 'full';
  const camTarget = new THREE.Vector3();
  const held = new Set();

  const el = {
    level: document.getElementById('level'),
    len: document.getElementById('len'),
    score: document.getElementById('score'),
    kills: document.getElementById('kills'),
    levelTime: document.getElementById('levelTime'),
    hp: document.getElementById('hpfill'),
    objective: document.getElementById('objective'),
    bossbar: document.getElementById('bossbar'),
    bfill: document.getElementById('bfill'),
    bname: document.getElementById('bname'),
    bshield: document.getElementById('bshield'),
    mode: document.getElementById('mode'),
    skillHud: document.getElementById('skillHud'),
    eSkillHud: document.getElementById('eSkillHud'),
    eSkillName: document.getElementById('eSkillName'),
    eSkillDesc: document.getElementById('eSkillDesc'),
    eSkillState: document.getElementById('eSkillState'),
    qSkillHud: document.getElementById('qSkillHud'),
    qSkillName: document.getElementById('qSkillName'),
    qSkillDesc: document.getElementById('qSkillDesc'),
    qSkillState: document.getElementById('qSkillState'),
    toast: document.getElementById('toast'),
    toasttext: document.getElementById('toasttext'),
    toastbig: document.getElementById('toastbig'),
    levelIntro: document.getElementById('levelIntro'),
    levelIntroKicker: document.getElementById('levelIntroKicker'),
    levelIntroTitle: document.getElementById('levelIntroTitle'),
    levelIntroMeta: document.getElementById('levelIntroMeta'),
    overlay: document.getElementById('overlay'),
    overlayContinue: document.getElementById('btnOverlayContinue'),
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
  let levelIntroTimer = 0;

  // ---------- 工具 ----------
  const randInt = (n) => Math.floor(Math.random() * n);

  function toast(text, big) {
    el.toasttext.textContent = text || '';
    el.toastbig.textContent = big || '';
    el.toast.style.display = 'block';
    toastTimer = 2.2;
  }

  function showLevelIntro(kicker, title, meta) {
    if (!el.levelIntro) return;
    el.levelIntroKicker.textContent = kicker || '';
    el.levelIntroTitle.textContent = title || '';
    el.levelIntroMeta.textContent = meta || '';
    el.levelIntro.classList.add('show');
    if (levelIntroTimer) window.clearTimeout(levelIntroTimer);
    levelIntroTimer = window.setTimeout(() => el.levelIntro.classList.remove('show'), 3200);
  }

  function evaluateLevelStars(bodyLength, elapsed, damageTaken = state.damageTaken) {
    const damageBonus = damageTaken < TWO_STAR_DAMAGE_LIMIT;
    const timeBonus = elapsed < THREE_STAR_TIME_LIMIT;
    const stars = damageBonus && timeBonus ? 3 : (damageBonus ? 2 : 1);
    return { stars, damageBonus, timeBonus };
  }

  function notifyLevelCleared(levelIndex) {
    if (!state.clearedNotified || state.clearedNotified.has(levelIndex)) return;
    state.clearedNotified.add(levelIndex);
    const bodyLength = state.cells.length;
    const elapsed = state.levelTime;
    const damageTaken = state.damageTaken;
    const evaluation = evaluateLevelStars(bodyLength, elapsed, damageTaken);
    if (typeof window.onDevourLevelCleared === 'function') {
      window.onDevourLevelCleared({
        level: levelIndex,
        stars: evaluation.stars,
        bodyLength,
        elapsed,
        damageTaken,
        damageBonus: evaluation.damageBonus,
        timeBonus: evaluation.timeBonus,
      });
    }
    return { stars: evaluation.stars, bodyLength, elapsed, damageTaken };
  }

  function formatLevelTime(sec) {
    const total = Math.max(0, Math.floor(sec));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function showResultRating(stars, elapsed) {
    const safeStars = Math.max(0, Math.min(3, Math.floor(stars)));
    el.ovscore.textContent = `${'★'.repeat(safeStars)}${'☆'.repeat(3 - safeStars)}`;
    if (el.ovscore.setAttribute) el.ovscore.setAttribute('aria-label', `${safeStars} 星`);
    el.ovscore.classList.add('rating-stars');
    el.ovtime.textContent = `用时 ${formatLevelTime(elapsed)}`;
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
    state.pellets.push({
      i: c.i,
      j: c.j,
      phase: Math.random() * Math.PI * 2,
      energy: Math.random() < ENERGY_PELLET_CHANCE,
    });
  }

  function clearIceObstacles() {
    dynamicIce.clear();
    iceBlockMeshes.forEach((mesh) => {
      mesh.visible = false;
      mesh.scale.setScalar(1);
    });
  }

  function spawnIceObstacle(forcedCell = null) {
    if (dynamicIce.size >= ICE_MAX_ACTIVE) return false;
    const mesh = iceBlockMeshes.find((item) => !item.visible);
    if (!mesh) return false;
    const head = state.cells[0] || { i: HALF, j: HALF };
    let cell = forcedCell;
    if (!cell) {
      for (let tries = 0; tries < 500; tries++) {
        const i = 3 + randInt(N - 6);
        const j = 3 + randInt(N - 6);
        if (isObstacle(i, j)) continue;
        if (Math.abs(i - head.i) + Math.abs(j - head.j) < 4) continue;
        if (Math.abs(i - DOOR_CELL.i) < 4 && j < 5) continue;
        if (Math.abs(i - SPAWN_DOOR_CELL.i) < 4 && j > N - 6) continue;
        if (state.cells.some((c) => Math.abs(c.i - i) + Math.abs(c.j - j) < 2)) continue;
        if (state.pellets.some((p) => p.i === i && p.j === j)) continue;
        if (state.enemies.some((e) => e.alive && Math.abs(e.i - i) + Math.abs(e.j - j) < 2)) continue;
        if (state.boss && state.boss.alive && Math.abs(i - BOSS_CELL.i) < 6 && Math.abs(j - BOSS_CELL.j) < 6) continue;
        cell = { i, j };
        break;
      }
    }
    if (!cell || isObstacle(cell.i, cell.j)) return false;
    const key = `${cell.i},${cell.j}`;
    dynamicIce.set(key, { i: cell.i, j: cell.j, mesh, age: 0 });
    mesh.visible = true;
    mesh.position.set(cellX(cell.i), 0.31, cellZ(cell.j));
    mesh.rotation.z = (Math.random() - 0.5) * 0.08;
    mesh.scale.setScalar(0.12);
    mesh.material.opacity = 1;
    return true;
  }

  function breakIceObstacle(i, j) {
    const key = `${i},${j}`;
    const ice = dynamicIce.get(key);
    if (!ice) return false;
    ice.mesh.visible = false;
    dynamicIce.delete(key);
    return true;
  }

  function updateIceObstacles(dt) {
    for (const ice of dynamicIce.values()) {
      ice.age += dt;
      const grow = Math.min(1, ice.age / 0.28);
      const pulse = 1 + Math.sin(state.time * 3.4 + ice.i + ice.j) * 0.025;
      ice.mesh.scale.setScalar((0.12 + grow * 0.88) * pulse);
    }
  }

  function updateIceSpawner(dt) {
    if (ROOMS[state.level]?.theme !== 'frozen') return;
    if (state.phase !== 'clear' && state.phase !== 'boss') return;
    if (state.doorOpen) return;
    state.iceSpawnTimer -= dt;
    if (state.iceSpawnTimer > 0) return;
    state.iceSpawnTimer += ICE_SPAWN_INTERVAL;
    if (spawnIceObstacle()) {
      toast('寒潮凝晶', '单格冰障出现 · 可用烈焰弹击碎');
    }
  }

  function spawnEnemy(distFromHead = 10, isRespawn = false, forcedType = null) {
    const h = state.cells[0] || { i: HALF, j: HALF };
    const slot = state.enemies.find((e) => !e.alive);
    if (!slot) return;
    const spawnType = forcedType || (isRespawn ? chooseRespawnEnemyType() : (slot.type || 'spore'));
    const spawnStats = enemyStats(spawnType);
    for (let tries = 0; tries < 300; tries++) {
      const i = randInt(N), j = randInt(N);
      if (isObstacle(i, j)) continue;
      if (Math.abs(i - h.i) + Math.abs(j - h.j) < distFromHead) continue;
      if (state.enemies.some((e) => e.alive && e.i === i && e.j === j)) continue;
      Object.assign(slot, {
        alive: true, type: spawnType, i, j, x: cellX(i), z: cellZ(j), cool: 0, bob: Math.random() * 6,
        shootTimer: 0.8 + Math.random() * 1.4,
        jumpTimer: spawnStats.jumpInterval || 0,
        jumpElapsed: 0,
        jumpFrom: null,
        jumpTo: null,
        trailTimer: 0.2,
        hidden: false,
        revealTimer: 0,
        hp: spawnStats.hp,
        speedMul: 1,
        eyeTimer: spawnStats.eyeGlowCooldown || 0,
        invulnTimer: 0,
        staffPulse: 0,
        frozenTimer: 0,
        frozenTimer: 0,
      });
      // 复活时恢复原色/原贴图（甲虫被打灰后）
      const idx = state.enemies.indexOf(slot);
      if (idx >= 0 && enemyPool[idx]) {
        enemyPool[idx].material.map = TEX[slot.type] || null;
        enemyPool[idx].material.color.setHex(0xffffff);
        enemyPool[idx].material.needsUpdate = true;
      }
      if (isRespawn && slot.type === 'obsidianBeetle') {
        spawnLavaHazard(cellX(i), cellZ(j));
      }
      return slot;
    }
  }

  function campaignPosition(levelIndex) {
    const safe = Math.max(0, Math.min(ROOM_COUNT - 1, levelIndex));
    const region = Math.floor(safe / 8);
    const node = (safe % 8) + 1;
    return { region, node };
  }

  function roomEnemyTypes(room) {
    if (room.composition) {
      return Object.entries(room.composition).flatMap(([type, count]) => (
        Array.from({ length: count }, () => type)
      ));
    }
    const types = room.types || ['spore'];
    return Array.from({ length: room.enemies || 0 }, (_, index) => types[index % types.length]);
  }

  function enemyStats(type) {
    return ENEMY_STATS[type] || ENEMY_STATS.spore;
  }

  function chooseRespawnEnemyType() {
    const types = state.roomEnemyTypes;
    if (!types || types.length === 0) return 'spore';
    return types[randInt(types.length)];
  }

  function updateHud() {
    const len = state.cells.length;
    const position = campaignPosition(state.level);
    el.level.textContent = `${position.region + 1}-${position.node} / 8`;
    el.len.textContent = String(len);
    el.score.textContent = String(state.score);
    el.kills.textContent = String(state.kills);
    el.hp.style.width = `${Math.max(0, Math.min(100, (len / 24) * 100))}%`;

    if (state.phase === 'boss' && state.boss && state.boss.alive) {
      el.bossbar.style.display = 'block';
      el.bfill.style.width = `${Math.max(0, (state.boss.hp / state.boss.max) * 100)}%`;
      const showShield = state.boss.kind === 'pharaoh';
      el.bshield.hidden = !showShield;
      if (showShield) {
        el.bshield.textContent = state.boss.shieldActive
          ? `金盾 ${state.boss.shieldHp} / ${PHARAOH_SHIELD_HP}`
          : `金盾重筑 ${Math.max(0, Math.ceil(state.boss.shieldRespawnTimer))}s`;
      }
    } else {
      el.bossbar.style.display = 'none';
      el.bshield.hidden = true;
    }

    let obj = '';
    if (state.phase === 'clear') {
      const left = state.enemies.filter((e) => e.alive).length;
      obj = left > 0 ? `清光敌人（剩余 ${left}）` : '门已打开 → 进入传送门';
    } else if (state.phase === 'boss') {
      obj = '击败 Boss';
    } else if (state.phase === 'pick') {
      obj = '吞噬发光核心，获得技能';
    } else if (state.phase === 'exit') {
      obj = '进入传送门，结束本局';
    }
    el.objective.textContent = obj;
    updateSkillHud();
  }

  let lastSkillHudSignature = '';
  let skillHudRevealTimer = 0;
  function activeSkillId(slot) {
    return window.DevourSkills?.getEquipped?.(slot) || null;
  }

  function updateSkillHud() {
    if (!el.skillHud) return;
    const eSkill = activeSkillId('e');
    const qSkill = activeSkillId('q');
    const shieldText = state.shieldTimer > 0
      ? `${state.shieldTimer.toFixed(1)}s`
      : (state.shieldCooldown > 0 ? `${state.shieldCooldown.toFixed(1)}s` : '就绪');
    const signature = `${eSkill}|${qSkill}|${shieldText}|${state.shieldTimer > 0}|${state.frostCooldown.toFixed(1)}|${state.energyCd.toFixed(1)}`;
    const showSkillHud = Boolean(eSkill || qSkill) && skillHudRevealTimer > 0;
    el.skillHud.hidden = !showSkillHud;
    el.skillHud.classList.toggle('is-fading', showSkillHud && skillHudRevealTimer <= 0.45);
    if (signature === lastSkillHudSignature) return;
    lastSkillHudSignature = signature;

    el.eSkillHud.hidden = !eSkill;
    el.qSkillHud.hidden = !qSkill;

    if (eSkill) {
      const red = eSkill === 'red';
      const ice = eSkill === 'ice';
      const green = eSkill === 'green';
      el.eSkillName.textContent = ice ? 'E · 寒冰吐息' : (red ? 'E · 赤核烈焰' : 'E · 翠核能量波');
      el.eSkillDesc.textContent = ice
        ? '消耗 2 格 · 冻结前方大片敌人'
        : (red ? '消耗 2 格 · 伤害 2 · 2×2 火焰' : '消耗 3 格 · 3×3 能量爆发');
      el.eSkillState.textContent = ice && state.frostCooldown > 0
        ? `${state.frostCooldown.toFixed(1)}s`
        : (green && state.energyCd > 0
          ? `${state.energyCd.toFixed(1)}s`
          : (state.cells.length > (green ? 4 : (red || ice ? 3 : 2)) ? '就绪' : '身体不足'));
      if (el.eSkillHud.style?.setProperty) {
        el.eSkillHud.style.setProperty('--skill-color', ice ? '#8de9ff' : (red ? '#ff6542' : '#68e7b8'));
      }
    }

    if (qSkill) {
      el.qSkillName.textContent = 'Q · 金核壁垒';
      el.qSkillDesc.textContent = '护盾 2 秒 · 冷却 5 秒';
      el.qSkillState.textContent = shieldText;
      el.qSkillHud.classList.toggle('is-cooling', state.shieldCooldown > 0 || state.shieldTimer > 0);
    }
  }

  function revealSkillHud(duration = SKILL_HUD_REVEAL_SECONDS) {
    skillHudRevealTimer = duration;
    lastSkillHudSignature = '';
    updateSkillHud();
  }

  // ---------- 关卡 ----------
  const THEMES = {
    green: { fog: 0x06110b, a: 0x12231a, b: 0x1a3024, hemi: 0x9cebd2, wall: 0x352d20, ea: 0x000000, eb: 0x000000 },
    temple: { fog: 0x1b1206, a: 0x3b2a17, b: 0x4a351e, hemi: 0xf0cf91, wall: 0x4a3b28, ea: 0x0a0501, eb: 0x0c0702 },
    volcano: { fog: 0x160705, a: 0x12100f, b: 0x1a1512, hemi: 0xff9a58, wall: 0x221814, ea: 0x4a1605, eb: 0x621d06 },
    frozen: { fog: 0x07172a, a: 0x416f8b, b: 0x5786a0, hemi: 0xc9f4ff, wall: 0x84adbf, ea: 0x0b3d57, eb: 0x0d4a66 },
  };

  function startLevel(idx) {
    const room = ROOMS[idx] || ROOMS[0];
    state.level = idx;
    state.levelTime = 0;
    state.damageTaken = 0;
    state.timerDisplayedSecond = -1;
    state.phase = room.kind === 'boss' ? 'boss' : 'clear';
    state.doorOpen = false;
    state.boss = null;
    bossMesh.visible = false;
    pharaohShieldRig.visible = false;
    rootSummonRig.visible = false;
    if (room.theme === 'temple') layoutTemple(idx);
    else if (room.theme === 'volcano') layoutVolcano(idx);
    else if (room.theme === 'frozen') layoutFrozen(idx);
    else layoutStumps(idx);

    state.enemies.forEach((e) => { e.alive = false; });
    state.bullets.forEach((b) => { b.mesh.visible = false; });
    state.bullets.length = 0;
    state.enemyBullets.forEach((b) => { b.mesh.visible = false; });
    state.enemyBullets.length = 0;
    (state.pods || []).forEach((b) => { b.mesh.visible = false; });
    state.pods = [];
    (state.ghostBullets || []).forEach((b) => { b.mesh.visible = false; });
    state.ghostBullets = [];
    (state.hazards || []).forEach((h) => { h.mesh.visible = false; });
    state.hazards = [];
    (state.lavaBalls || []).forEach((b) => { b.mesh.visible = false; });
    state.lavaBalls = [];
    (state.lavaPools || []).forEach((p) => { p.mesh.visible = false; });
    state.lavaPools = [];
    state.pellets.length = 0;
    state.fireBursts.forEach((burst) => { burst.mesh.visible = false; });
    state.fireBursts.length = 0;
    state.orbs.forEach((orb) => { orb.mesh.visible = false; });
    state.orbs.length = 0;
    state.booms.forEach((boom) => { boom.mesh.visible = false; });
    state.booms.length = 0;
    state.energyCd = 0;
    state.skillOrb = null;
    rewardOrbGroup.visible = false;
    state.shieldTimer = 0;
    state.shieldCooldown = 0;
    state.shieldFlash = 0;
    state.frostCooldown = 0;
    state.frostEffectTimer = 0;
    state.iceSpawnTimer = ICE_SPAWN_INTERVAL;
    shieldRibbon.visible = false;
    shieldHaloRig.visible = false;
    bossBreathRig.visible = false;
    bossBreathMat.opacity = 0;
    playerFrostRig.visible = false;

    // 温室关卡特性保留：第二关小怪更快，第三关会远程

    // 第一关：从左侧 4×4 出生小房间钻出来；后续关卡从底部传送门逐节钻出
    state.roomActive = false;
    state.roomTimer = 0;
    state.spawnEmerging = false;
    state.spawnPending = 0;
    state.spawnPortalClosing = false;
    state.spawnPortalOpacity = 0;
    spawnDoorGroup.visible = false;
    spawnDoorPad.material.opacity = 0;
    state.spawnGrace = idx === 0 ? 2.2 : 0;
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
      const keep = START_LEN;
      state.cells.length = 0;
      state.cells.push({ i: SPAWN_DOOR_CELL.i, j: SPAWN_DOOR_CELL.j });
      state.dir = { i: 0, j: -1 };
      state.spawnEmerging = true;
      state.spawnPending = keep - 1;
      state.spawnPortalOpacity = 0.9;
      spawnDoorPad.material.opacity = 0.9;
      spawnDoorGroup.visible = true;
      state.spawnGrace = Math.min(2.2, keep * STEP + 0.25);
      startRoom.visible = false;
    }
    state.progress = 1;
    state.prevTail = null;
    state.invuln = 1.0;
    state.shootCd = 0;
    state.slowTimer = 0;
    state.pelletsOff = false; // 新关卡重新开始刷豆

    const initialPellets = NORMAL_PELLET_COUNT + (room.kind === 'boss' ? BOSS_PELLET_BONUS : 0);
    for (let k = 0; k < initialPellets; k++) spawnPellet();

    const tint = THEMES[room.theme] || THEMES.green;
    scene.fog.color.setHex(tint.fog);
    scene.background.setHex(tint.fog);
    matA.color.setHex(tint.a);
    matB.color.setHex(tint.b);
    matA.emissive.setHex(tint.ea);
    matB.emissive.setHex(tint.eb);
    matA.emissiveIntensity = room.theme === 'volcano' ? 0.72 : (room.theme === 'frozen' ? 0.22 : 0.16);
    matB.emissiveIntensity = room.theme === 'volcano' ? 0.72 : (room.theme === 'frozen' ? 0.22 : 0.16);
    wallMat.color.setHex(tint.wall);
    hemi.color.setHex(tint.hemi);
    lavaUnderlay.visible = room.theme === 'volcano';
    if (document.body && document.body.dataset) document.body.dataset.gameTheme = room.theme;

    // 敌人外观 / 类型按关卡轮换
    const roomTypes = roomEnemyTypes(room);
    const types = roomTypes.length ? roomTypes : ['spore'];
    state.roomEnemyTypes = [...new Set(types)];
    for (let k = 0; k < enemyPool.length; k++) {
      const type = types[k % types.length];
      enemyPool[k].material = (ENEMY_MATS[type] || ENEMY_MATS.spore).clone();
      enemyPool[k].material.color.setHex(0xffffff);
      enemyPool[k].scale.setScalar(type === 'emberWisp' ? WISP_RENDER_SCALE : (type === 'frostWisp' ? 1.28 : 1));
      state.enemies[k].type = type;
      state.enemies[k].hp = enemyStats(type).hp;
      state.enemies[k].speedMul = 1;
      state.enemies[k].eyeTimer = enemyStats(type).eyeGlowCooldown || 0;
      state.enemies[k].invulnTimer = 0;
      state.enemies[k].staffPulse = 0;
      state.enemies[k].frozenTimer = 0;
    }

    if (room.kind === 'clear') {
      const safeDistance = idx === 0 ? 14 : 9;
      for (let k = 0; k < types.length; k++) spawnEnemy(safeDistance);
      const position = campaignPosition(idx);
      showLevelIntro(
        `REGION ${position.region + 1} · LEVEL ${String(position.node).padStart(2, '0')} / 08`,
        room.name,
        `敌人 ${types.length} · 清除后开启传送门`
      );
    } else {
      spawnBoss(room.boss);
      showLevelIntro('BOSS RITE', room.name, idx === ROOM_COUNT - 1 ? '击败冰龙 · 完成远征' : '击败首领 · 进入下一层');
    }
    updateHud();
    revealSkillHud();
  }

  function spawnBoss(kind = 'rootcoil') {
    const isPharaoh = kind === 'pharaoh';
    const isColossus = kind === 'magma_colossus';
    const isDragon = kind === 'frost_dragon';
    const isRootcoil = !isPharaoh && !isColossus && !isDragon;
    const hp = isColossus ? 480 : (isDragon ? 440 : (isPharaoh ? 380 : BOSS_HP));
    const start = { x: cellX(BOSS_CELL.i), z: cellZ(BOSS_CELL.j) };
    state.boss = {
      alive: true,
      kind,
      hp,
      max: hp,
      renderScale: isColossus ? COLOSSUS_RENDER_SCALE : (isDragon ? 1.55 : (isPharaoh ? 1.425 : 2)),
      bulletHitRadius: isRootcoil ? 4.6 : (isDragon ? 3.2 : (isPharaoh ? 3.45 : 2.3)),
      orbHitRadius: isRootcoil ? 5.2 : (isDragon ? 3.5 : (isPharaoh ? 3.9 : 2.6)),
      contactRadius: isRootcoil ? 4.8 : (isDragon ? 3.25 : (isPharaoh ? 3.75 : 2.5)),
      crushRadius: isColossus ? COLOSSUS_CRUSH_RADIUS : 0,
      jumpDuration: isColossus ? COLOSSUS_JUMP_TIME : 0,
      x: start.x,
      z: start.z,
      shootTimer: isPharaoh ? PHARAOH_BULLET_INTERVAL : (isDragon ? 99 : (isRootcoil ? ROOT_BULLET_INTERVAL : 3)),
      jumpTimer: isColossus ? COLOSSUS_JUMP_COOLDOWN : 0,
      jumpElapsed: 0,
      jumpFrom: null,
      jumpTo: null,
      jumpState: isColossus ? 'idle' : 'none',
      shadowWarning: 0,
      recoverTimer: 0,
      jumpHidden: false,
      fireballTimer: isColossus ? 3 : 0,
      cool: 0,
      breathTimer: isDragon ? 2.6 : 0,
      breathState: isDragon ? 'idle' : 'none',
      breathElapsed: 0,
      breathAngle: 0,
      breathHit: false,
      summonTimer: isRootcoil ? ROOT_SUMMON_INTERVAL : 0,
      summonFlash: 0,
      shieldActive: isPharaoh,
      shieldHp: isPharaoh ? PHARAOH_SHIELD_HP : 0,
      shieldRespawnTimer: 0,
      shieldFlash: 0,
      shieldHudSecond: -1,
    };
    bossPoseTexture = (kind === 'frost_dragon' ? BOSS_TEX.frost_dragon : null) || BOSS_TEX[kind] || null;
    bossPlaneMat.map = (BOSS_TEX[kind] || BOSS_TEX.rootcoil) || null;
    bossPlaneMat.color.setHex(bossPlaneMat.map ? 0xffffff : 0x6b4a2f);
    bossPlaneMat.needsUpdate = true;
    bossMesh.visible = true;
    bossMesh.position.set(state.boss.x, 0, state.boss.z);
    bossMesh.scale.setScalar(state.boss.renderScale);
    bossMesh.rotation.z = 0;
    bossBreathRig.visible = false;
    bossBreathMat.opacity = 0;
    pharaohShieldRig.visible = false;
    rootSummonRig.visible = false;
    colossusShadow.visible = false;
    colossusImpactRing.visible = false;
    el.bname.textContent = isDragon
      ? '凛冬冰龙 · FROST DRAGON'
      : (isColossus
        ? '熔岩巨像 · MAGMA COLOSSUS'
        : (isPharaoh ? '黄金法老 · PHARAOH' : '枯树 · ROOTCOIL'));
  }

  function summonGreenhouseMinions() {
    const types = ['spore', 'vine', 'trap'];
    let summoned = 0;
    for (let k = 0; k < 2; k++) {
      if (spawnEnemy(9, false, types[randInt(types.length)])) summoned += 1;
    }
    if (summoned > 0) toast('腐根召唤', `红光唤醒 ${summoned} 只温室小怪`);
  }

  function updateRootcoilSummon(b, dt) {
    b.summonTimer -= dt;
    if (b.summonTimer <= 0) {
      b.summonTimer = ROOT_SUMMON_INTERVAL;
      b.summonFlash = 0.85;
      summonGreenhouseMinions();
    }
    b.summonFlash = Math.max(0, b.summonFlash - dt);
    rootSummonRig.visible = b.summonFlash > 0;
    rootSummonRig.position.set(b.x, 0, b.z);
    rootSummonRig.scale.setScalar(b.renderScale);
    if (rootSummonRig.visible) {
      const pulse = 1 + Math.sin(state.time * 18) * 0.16;
      rootEyeGlowMat.opacity = 0.55 + Math.min(1, b.summonFlash * 2) * 0.4;
      rootSummonRing.scale.setScalar(pulse * 1.5);
      rootSummonRing.material.opacity = b.summonFlash * 0.62;
    }
  }

  function damagePharaohShield(instantBreak = false) {
    const b = state.boss;
    if (!b || !b.alive || b.kind !== 'pharaoh' || !b.shieldActive) return false;
    b.shieldFlash = 0.22;
    b.shieldHp = instantBreak ? 0 : Math.max(0, b.shieldHp - 1);
    if (b.shieldHp <= 0) {
      b.shieldActive = false;
      b.shieldRespawnTimer = PHARAOH_SHIELD_RESPAWN;
      b.shieldHudSecond = -1;
      pharaohShieldRig.visible = false;
      toast(instantBreak ? '能量波击碎黄金护盾' : '黄金护盾破裂', '20 秒后重新生成');
    }
    updateHud();
    return true;
  }

  function updatePharaohShield(b, dt) {
    b.shieldFlash = Math.max(0, b.shieldFlash - dt);
    if (!b.shieldActive) {
      b.shieldRespawnTimer = Math.max(0, b.shieldRespawnTimer - dt);
      const second = Math.ceil(b.shieldRespawnTimer);
      if (second !== b.shieldHudSecond) {
        b.shieldHudSecond = second;
        updateHud();
      }
      if (b.shieldRespawnTimer <= 0) {
        b.shieldActive = true;
        b.shieldHp = PHARAOH_SHIELD_HP;
        b.shieldHudSecond = -1;
        toast('黄金护盾重塑', '连续 3 次射击或 1 次能量波可击破');
        updateHud();
      }
    }

    pharaohShieldRig.visible = b.shieldActive;
    pharaohShieldRig.position.set(b.x, 0, b.z);
    if (b.shieldActive) {
      const pulse = 1 + Math.sin(state.time * 3.4) * 0.035;
      pharaohShieldRig.scale.setScalar(pulse);
      pharaohShieldDisc.material.opacity = 0.08 + b.shieldFlash * 1.4 +
        (1 - b.shieldHp / PHARAOH_SHIELD_HP) * 0.04;
      pharaohShieldRing.material.opacity = 0.62 + b.shieldFlash * 1.5;
    }
  }

  function bossDie() {
    const bossKind = state.boss?.kind || 'rootcoil';
    state.boss.alive = false;
    bossMesh.visible = false;
    pharaohShieldRig.visible = false;
    rootSummonRig.visible = false;
    bossBreathRig.visible = false;
    bossBreathMat.opacity = 0;
    colossusShadow.visible = false;
    colossusImpactRing.visible = false;
    state.phase = 'pick';
    // Boss 战结束也停止刷豆，场上豆子清空
    state.pelletsOff = true;
    state.pellets.length = 0;
    state.pods.forEach((p) => { p.mesh.visible = false; });
    state.pods.length = 0;
    // Boss 死后残留弹幕立刻清空
    state.enemyBullets.forEach((b) => { b.mesh.visible = false; });
    state.enemyBullets.length = 0;
    state.lavaBalls.forEach((b) => { b.mesh.visible = false; });
    state.lavaBalls.length = 0;
    state.lavaPools.forEach((p) => { p.mesh.visible = false; });
    state.lavaPools.length = 0;
    state.enemies.forEach((enemy) => { enemy.alive = false; });
    enemyPool.forEach((mesh) => { mesh.visible = false; });
    spawnSkillOrb(bossKind);
    updateHud();
    toast('Boss 倒下', '吞噬场地中央的发光核心，获得技能');
  }

  function spawnSkillOrb(bossKind) {
    const reward = SKILL_REWARDS[bossKind] || SKILL_REWARDS.rootcoil;
    const x = cellX(BOSS_CELL.i);
    const z = cellZ(BOSS_CELL.j);
    rewardShellMat.color.setHex(reward.color);
    rewardShellMat.emissive.setHex(reward.emissive);
    rewardRingMat.color.setHex(reward.color);
    rewardCoreMat.color.setHex(reward.core);
    rewardCoreMat.emissive.setHex(reward.emissive);
    rewardOrbGroup.position.set(x, 0, z);
    rewardOrbGroup.visible = true;
    rewardShell.scale.setScalar(1);
    rewardRing.scale.setScalar(1);
    state.skillOrb = { id: reward.id, bossKind, x, z, phase: 0, delay: 0.55 };
  }

  function consumeSkillOrb() {
    if (!state.skillOrb) return false;
    const skillId = state.skillOrb.id;
    const skill = window.DevourSkills?.getSkill?.(skillId);
    const firstUnlock = window.DevourSkills?.unlock?.(skillId) ?? false;
    state.skillOrb = null;
    rewardOrbGroup.visible = false;
    clearCombatResidue();
    state.phase = 'exit';
    state.doorOpen = true;
    updateHud();
    toast(
      firstUnlock ? `吞噬核心：${skill?.name || '未知技能'}` : `核心已吸收：${skill?.name || '技能'}`,
      '技能不会增加体长，可在设置 → 技能中更换装备'
    );
    return true;
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

  function damage(n, source = 'generic') {
    if (state.over || state.invuln > 0) return;
    if (state.shieldTimer > 0 && (source === 'contact' || source === 'projectile')) {
      state.shieldFlash = 0.16;
      return;
    }
    state.damageTaken += 1;
    state.score = Math.max(0, state.score - DAMAGE_SCORE_PENALTY);
    state.prevTail = null;
    state.hitFlash = 0.18;
    for (let k = 0; k < n && state.cells.length > 1; k++) state.cells.pop();
    state.invuln = INVULN;
    updateHud();
    if (state.cells.length <= 1) {
      gameOver('体长归零 —— 蛇不能没有身体。');
      return;
    }
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
      const pellet = state.pellets.splice(pi, 1)[0];
      state.score += 10;
      state.eaten += 1;
      state.prevTail = null; // 生长：尾巴不动
      if (pellet.energy) {
        growBy(2);
        toast('能量豆', '体长 +3');
      }
      spawnPellet();
      updateHud();
    } else if (state.spawnEmerging && state.spawnPending > 0) {
      // 蛇身逐节从底部传送门钻出，暂不收尾
      state.spawnPending -= 1;
      state.prevTail = null;
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
    // 出洞时默认向上；禁止反向钻回传送门，但保留横向转向以支持超长蛇
    if (state.spawnEmerging && d.j > 0) return;
    const reverse = d.i === -state.dir.i && d.j === -state.dir.j;
    if (reverse && state.cells.length > 2) return;
    state.dir = d;
  }

  function angleDistance(a, b) {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }

  function activateFrostBreath() {
    if (state.over || state.paused || state.frostCooldown > 0) return;
    if (activeSkillId('e') !== 'ice') return;
    if (state.cells.length <= FROST_SKILL_COST + 1) {
      toast('寒冰吐息无法启动', `至少需要 ${FROST_SKILL_COST + 2} 格身体`);
      return;
    }

    for (let k = 0; k < FROST_SKILL_COST; k++) state.cells.pop();
    state.prevTail = null;
    state.frostCooldown = FROST_SKILL_COOLDOWN;
    state.frostEffectTimer = 0.92;

    const head = headPosition(_tmpA).clone();
    const angle = Math.atan2(state.dir.j, state.dir.i);
    playerFrostRig.position.set(head.x, 0, head.z);
    playerFrostRig.rotation.y = Math.atan2(-state.dir.j, state.dir.i);
    playerFrostRig.visible = true;
    playerFrostMesh.material.opacity = 0.82;

    let frozen = 0;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - head.x;
      const dz = enemy.z - head.z;
      const distance = Math.hypot(dx, dz);
      if (distance > FROST_SKILL_RANGE || distance < 0.001) continue;
      if (angleDistance(Math.atan2(dz, dx), angle) > FROST_SKILL_HALF_ANGLE) continue;
      enemy.frozenTimer = Math.max(enemy.frozenTimer || 0, FROST_SKILL_DURATION);
      frozen += 1;
    }
    updateHud();
    toast('寒冰吐息', frozen > 0 ? `冻结 ${frozen} 只敌人 · ${FROST_SKILL_DURATION} 秒` : '寒流席卷前方');
  }

  function shoot(source = 'space') {
    if (state.over || state.paused) return;
    if (source === 'e' && activeSkillId('e') === 'ice') {
      activateFrostBreath();
      return;
    }
    if (source === 'e' && activeSkillId('e') === 'green') {
      fireEnergy();
      return;
    }
    if (state.shootCd > 0) return;
    const eSkill = source === 'e' ? activeSkillId('e') : null;
    if (source === 'e' && !eSkill) {
      toast('未安装 E 技能', '击败 Boss 后吞噬核心，并在设置中安装');
      return;
    }
    const isFire = eSkill === 'red';
    const bodyCost = isFire ? FIRE_BULLET_COST : 1;
    if (state.cells.length <= bodyCost + 1) return;
    state.shootCd = SHOOT_COOLDOWN * state.shootCdMul;
    for (let k = 0; k < bodyCost; k++) state.cells.pop();
    state.prevTail = null;
    const from = headPosition();
    const d = state.dir;
    const mesh = bulletPool.find((m) => !m.visible) || bulletPool[0];
    mesh.visible = true;
    mesh.position.copy(from);
    mesh.scale.setScalar(isFire ? FIRE_BULLET_SCALE : 1);
    mesh.material.color.setHex(isFire ? 0xffa070 : 0x9ff5d8);
    mesh.material.emissive.setHex(isFire ? 0xff2f0b : 0x2ee6a8);
    mesh.material.emissiveIntensity = isFire ? 2.4 : 1.6;
    state.bullets.push({
      mesh, x: from.x, z: from.z,
      vx: d.i * BULLET_SPEED, vz: d.j * BULLET_SPEED, life: 1.8,
      fire: isFire,
      enemyDamage: isFire ? FIRE_BULLET_DAMAGE : 1,
      bossDamage: isFire ? state.shotDamage * 2 : state.shotDamage,
    });
    updateHud();
  }

  function activateShield() {
    if (state.over || state.paused) return;
    if (activeSkillId('q') !== 'yellow') {
      toast('未安装 Q 技能', '击败法老后吞噬金色核心，并在设置中安装');
      return;
    }
    if (state.shieldTimer > 0 || state.shieldCooldown > 0) return;
    if (state.cells.length <= 2) {
      toast('无法启动金核壁垒', '至少需要 3 格身体');
      return;
    }
    state.prevTail = null;
    state.cells.pop();
    state.shieldTimer = SHIELD_DURATION;
    state.shieldCooldown = SHIELD_COOLDOWN;
    updateHud();
    toast('金核壁垒', '消耗 1 格身体 · 持续 2 秒');
  }

  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('settings-open')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'spacebar') { e.preventDefault(); shoot(); return; }
    if (k === 'r') { resetGame(state.level); return; }
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
      el.overlayContinue.hidden = !state.paused;
      if (state.paused) showHelp();
      return;
    }
    if (k === 'e') { e.preventDefault(); shoot('e'); return; }
    if (k === 'q') { e.preventDefault(); activateShield(); return; }
    if (DIRS[k]) { e.preventDefault(); held.add(k); applyDir(directionFromHeld()); }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    held.delete(k);
    const d = directionFromHeld();
    if (d) applyDir(d);
  });

  window.addEventListener('blur', () => held.clear());
  document.addEventListener('devour:skills-changed', () => {
    lastSkillHudSignature = '';
    revealSkillHud();
  });

  // ---------- 更新 ----------
  function updateSnake(dt) {
    const slowMul = state.slowTimer > 0 ? 0.55 : 1;
    state.progress += (dt / STEP) * slowMul;
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
    const shieldActive = state.shieldTimer > 0;
    shieldRibbon.visible = shieldActive;
    shieldHaloRig.visible = shieldActive;
    if (shieldActive) {
      shieldRibbon.material.opacity = 0.2 + Math.sin(state.time * 9) * 0.05 + state.shieldFlash;
      shieldHaloRig.position.set(pos.x, 0.64, pos.z);
      shieldHaloRig.rotation.y = Math.atan2(-dj, di);
      const pulse = 1 + Math.sin(state.time * 8) * 0.05;
      shieldHalo.scale.set(1.28 * pulse, 0.8 * pulse, 1);
      shieldHalo.material.opacity = 0.42 + state.shieldFlash;
    }
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
      shieldGeo.setDrawRange(0, 0);
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

      const sw = 0.72 * (0.55 + 0.45 * tailFade);
      shieldPos[base] = _p0.x + nx * sw;
      shieldPos[base + 1] = y + 0.09;
      shieldPos[base + 2] = _p0.z + nz * sw;
      shieldPos[base + 3] = _p0.x - nx * sw;
      shieldPos[base + 4] = y + 0.09;
      shieldPos[base + 5] = _p0.z - nz * sw;

      // 深浅相间的横纹
      const band = Math.floor(s / 1.5) % 2;
      const r = band ? 0.06 : 0.13;
      const g = band ? 0.68 : 0.94;
      const b = band ? 0.54 : 0.78;
      ribbonCol[base] = r; ribbonCol[base + 1] = g; ribbonCol[base + 2] = b;
      ribbonCol[base + 3] = r; ribbonCol[base + 4] = g; ribbonCol[base + 5] = b;

      prevX = _p0.x; prevZ = _p0.z;
    }

    ribbonGeo.attributes.position.needsUpdate = true;
    ribbonGeo.attributes.color.needsUpdate = true;
    outlineGeo.attributes.position.needsUpdate = true;
    shieldGeo.attributes.position.needsUpdate = true;
    ribbonGeo.setDrawRange(0, (count - 1) * 6);
    outlineGeo.setDrawRange(0, (count - 1) * 6);
    shieldGeo.setDrawRange(0, (count - 1) * 6);

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
      mesh.material = p.energy ? energyPelletMat : pelletMat;
      mesh.scale.setScalar(p.energy ? 1.25 + Math.sin(state.time * 4 + p.phase) * 0.08 : 1);
      mesh.position.set(cellX(p.i), 0.28 + Math.sin(state.time * 3 + p.phase) * 0.07, cellZ(p.j));
      mesh.rotation.y += 0.02;
    }
  }

  function chooseSlimeJump(e, hp, stats) {
    const dx = hp.x - e.x;
    const dz = hp.z - e.z;
    const len = Math.hypot(dx, dz) || 1;
    const base = Math.atan2(dz, dx);
    const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
    for (const off of angles) {
      const a = base + off;
      const tx = Math.max(-HALF + 0.5, Math.min(HALF - 0.5, e.x + Math.cos(a) * stats.jumpDistance));
      const tz = Math.max(-HALF + 0.5, Math.min(HALF - 0.5, e.z + Math.sin(a) * stats.jumpDistance));
      if (!isObstacle(Math.round(tx + HALF), Math.round(tz + HALF))) {
        return { x: tx, z: tz };
      }
    }
    return { x: e.x, z: e.z };
  }

  function updateMagmaSlime(e, mesh, hp, dt) {
    const stats = enemyStats(e.type);
    if (e.jumpTimer === undefined) e.jumpTimer = stats.jumpInterval;
    if (e.jumpElapsed > 0) {
      e.jumpElapsed += dt;
      const t = Math.min(1, e.jumpElapsed / stats.jumpDuration);
      const ease = t * t * (3 - 2 * t);
      e.x = e.jumpFrom.x + (e.jumpTo.x - e.jumpFrom.x) * ease;
      e.z = e.jumpFrom.z + (e.jumpTo.z - e.jumpFrom.z) * ease;
      e.i = Math.round(e.x + HALF);
      e.j = Math.round(e.z + HALF);
      mesh.position.set(e.x, 0.5 + Math.sin(Math.PI * t) * 1.15, e.z);
      mesh.scale.setScalar(1 + Math.sin(Math.PI * t) * 0.18);
      if (t >= 1) {
        e.jumpElapsed = 0;
        e.jumpTimer = stats.jumpInterval;
        mesh.scale.setScalar(1);
      }
    } else {
      e.jumpTimer -= dt;
      mesh.position.set(e.x, 0.5 + Math.sin(state.time * 3 + e.bob) * 0.04, e.z);
      mesh.scale.setScalar(1 + Math.max(0, 0.09 - e.jumpTimer * 0.02));
      if (e.jumpTimer <= 0) {
        e.jumpFrom = { x: e.x, z: e.z };
        e.jumpTo = chooseSlimeJump(e, hp, stats);
        e.jumpElapsed = 0.0001;
      }
    }
  }

  function updateObsidianBeetle(e, mesh, nx, nz, dt) {
    const stats = enemyStats(e.type);
    e.trailTimer = (e.trailTimer === undefined ? 0.2 : e.trailTimer) - dt;
    if (e.trailTimer <= 0) {
      spawnLavaHazard(e.x, e.z);
      e.trailTimer = stats.trailInterval;
    }
    mesh.position.set(nx, 0.5 + Math.sin(state.time * 7 + e.bob) * 0.035, nz);
    mesh.rotation.z = Math.sin(state.time * 5 + e.bob) * 0.1;
  }

  function updateEmberWisp(e, mesh, hp, dt) {
    const stats = enemyStats(e.type);
    const dx = hp.x - e.x;
    const dz = hp.z - e.z;
    const inRange = Math.abs(dx) <= stats.hideHalfSize && Math.abs(dz) <= stats.hideHalfSize;
    if (e.hidden) {
      mesh.visible = false;
      if (!inRange) {
        e.revealTimer = (e.revealTimer || 0) + dt;
        if (e.revealTimer >= stats.revealDelay) {
          e.hidden = false;
          e.revealTimer = 0;
        }
      } else {
        e.revealTimer = 0;
      }
      return;
    }
    if (inRange) {
      e.hidden = true;
      e.revealTimer = 0;
      mesh.visible = false;
      return;
    }

    const len = Math.hypot(dx, dz) || 1;
    const speed = stats.speed;
    let nx = e.x + (dx / len) * speed * dt;
    let nz = e.z + (dz / len) * speed * dt;
    const ci = Math.round(nx + HALF);
    const cj = Math.round(nz + HALF);
    if (!inBounds(ci, cj) || isObstacle(ci, cj)) {
      nx = e.x;
      nz = e.z;
    }
    e.x = nx;
    e.z = nz;
    e.i = Math.round(nx + HALF);
    e.j = Math.round(nz + HALF);
    mesh.visible = true;
    mesh.position.set(nx, 0.58 + Math.sin(state.time * 2.4 + e.bob) * 0.11, nz);
    mesh.rotation.z = Math.sin(state.time * 2 + e.bob) * 0.12;
    mesh.scale.setScalar(WISP_RENDER_SCALE + Math.sin(state.time * 3 + e.bob) * 0.05);

    if (e.shootTimer === undefined) e.shootTimer = stats.shootCooldown;
    e.shootTimer -= dt;
    if (e.shootTimer <= 0) {
      e.shootTimer = stats.shootCooldown;
      spawnGhostBullet(nx, nz, hp.x, hp.z);
    }
  }

  function updateMummyAbility(e, dt) {
    const stats = enemyStats(e.type);
    if (e.eyeTimer === undefined) e.eyeTimer = stats.eyeGlowCooldown;
    if (e.invulnTimer > 0) {
      e.invulnTimer = Math.max(0, e.invulnTimer - dt);
      if (e.invulnTimer === 0) e.eyeTimer = stats.eyeGlowCooldown;
    } else {
      e.eyeTimer -= dt;
      if (e.eyeTimer <= 0) {
        e.invulnTimer = stats.eyeInvulnDuration;
        e.eyeTimer = stats.eyeGlowCooldown;
      }
    }
  }

  function updateEnemyAbilityVisuals(e, mesh, index, dt) {
    const eyes = mummyEyes[index];
    const eyesActive = e.type === 'mummy' && e.invulnTimer > 0;
    for (const eye of eyes) {
      eye.visible = eyesActive;
      if (eyesActive) {
        const pulse = 1 + Math.sin(state.time * 10 + index) * 0.16;
        eye.scale.setScalar(pulse);
        eye.material.opacity = 0.72 + Math.sin(state.time * 14 + index) * 0.2;
      }
    }

    const staff = anubisStaffs[index];
    const staffActive = e.type === 'anubis';
    staff.glow.visible = staffActive;
    staff.core.visible = staffActive;
    e.staffPulse = Math.max(0, (e.staffPulse || 0) - dt);
    if (staffActive) {
      const pulse = 1 + Math.sin(state.time * 6 + index) * 0.12 + (e.staffPulse > 0 ? 0.32 : 0);
      staff.glow.scale.setScalar(pulse);
      staff.core.scale.setScalar(1 + Math.sin(state.time * 9 + index) * 0.08);
      staff.glow.material.opacity = 0.46 + Math.sin(state.time * 5 + index) * 0.16 +
        (e.staffPulse > 0 ? 0.16 : 0);
      staff.core.material.opacity = 0.88;
    }
  }

  function absorbPelletsNearAnubis(e) {
    const stats = enemyStats(e.type);
    const half = stats.pelletAbsorbHalfSize;
    if (!half) return;
    let absorbed = 0;
    for (let k = state.pellets.length - 1; k >= 0; k--) {
      const pellet = state.pellets[k];
      if (Math.abs(pellet.i - e.i) <= half && Math.abs(pellet.j - e.j) <= half) {
        state.pellets.splice(k, 1);
        absorbed += 1;
      }
    }
    if (absorbed > 0) e.staffPulse = 0.45;
  }

  function isEnemyInvulnerable(e) {
    return e.type === 'mummy' && e.invulnTimer > 0;
  }

  function updateEnemies(dt) {
    const hp = headPosition(_tmpA).clone();
    const spawnLocked = state.spawnGrace > 0;
    if (spawnLocked) state.spawnGrace = Math.max(0, state.spawnGrace - dt);
    for (let k = 0; k < enemyPool.length; k++) {
      const mesh = enemyPool[k];
      const e = state.enemies[k];
      if (!e || !e.alive) { mesh.visible = false; continue; }
      mesh.visible = true;
      if (e.frozenTimer > 0) {
        e.frozenTimer = Math.max(0, e.frozenTimer - dt);
        mesh.material.color.setHex(0xa9eeff);
        mesh.position.set(e.x, 0.5 + Math.sin(state.time * 2.4 + e.bob) * 0.025, e.z);
        mesh.rotation.z = Math.sin(state.time * 1.8 + e.bob) * 0.035;
        continue;
      }
      mesh.material.color.setHex(0xffffff);
      if (spawnLocked) {
        mesh.position.set(e.x, 0.5 + Math.sin(state.time * 4 + e.bob) * 0.04, e.z);
        mesh.rotation.z = Math.sin(state.time * 2 + e.bob) * 0.08;
        continue;
      }

      if (e.type === 'mummy') updateMummyAbility(e, dt);
      updateEnemyAbilityVisuals(e, mesh, k, dt);

      const dx = hp.x - e.x;
      const dz = hp.z - e.z;
      const len = Math.hypot(dx, dz) || 1;
      if (e.cool > 0) e.cool -= dt;
      if (e.type === 'emberWisp') {
        updateEmberWisp(e, mesh, hp, dt);
        continue;
      }
      if (e.type === 'magmaSlime') {
        const stats = enemyStats(e.type);
        updateMagmaSlime(e, mesh, hp, dt);
        if (bodyDistanceSq(e.x, e.z) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
          e.cool = stats.contactCooldown;
          damage(stats.contactDamage, 'contact');
          if (state.over) return;
        }
        continue;
      }

      const stats = enemyStats(e.type);
      const speed = stats.speed * (e.speedMul === undefined ? 1 : e.speedMul) *
        (e.cool > 0 ? stats.retreatSpeedMul : 1);
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
      if (e.type === 'anubis') absorbPelletsNearAnubis(e);

      if (e.type === 'obsidianBeetle') {
        updateObsidianBeetle(e, mesh, nx, nz, dt);
      } else {
        mesh.position.set(nx, 0.5 + Math.sin(state.time * 4 + e.bob) * 0.04, nz);
        mesh.rotation.z = Math.sin(state.time * 2 + e.bob) * 0.08;
      }

      if (bodyDistanceSq(nx, nz) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
        e.cool = stats.contactCooldown;
        e.x -= (dx / len) * 2.2;
        e.z -= (dz / len) * 2.2;
        damage(stats.contactDamage, 'contact');
        if (state.over) return;
        if (e.type === 'vine' && state.shieldTimer <= 0) {
          const alreadySlowed = state.slowTimer > 0;
          state.slowTimer = Math.max(state.slowTimer, 3);
          if (!alreadySlowed) toast('被藤蔓缠绕', '移动速度降低 3 秒');
        }
      }

      if (stats.shootCooldown) {
        if (e.shootTimer === undefined) e.shootTimer = 1 + Math.random() * 1.5;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = stats.shootCooldown;
          const dist = Math.hypot(hp.x - nx, hp.z - nz);
          if (dist < stats.shootRange) {
            const projectileCount = stats.projectileCount || 1;
            if (projectileCount === 1) {
              spawnPod(nx, nz, hp.x, hp.z);
            } else {
              const base = Math.atan2(hp.z - nz, hp.x - nx);
              const spread = stats.projectileSpread || 0.16;
              for (let shot = 0; shot < projectileCount; shot++) {
                const a = base + (shot - (projectileCount - 1) / 2) * spread;
                spawnPod(nx, nz, nx + Math.cos(a) * dist, nz + Math.sin(a) * dist, 0.75);
              }
            }
          }
        }
      }
    }
  }

  function randomColossusLanding(excludeX, excludeZ) {
    for (let tries = 0; tries < 80; tries++) {
      const i = 7 + randInt(N - 14);
      const j = 7 + randInt(N - 14);
      let blocked = false;
      for (let di = -6; di <= 6 && !blocked; di++) {
        for (let dj = -6; dj <= 6; dj++) {
          if (isObstacle(i + di, j + dj)) {
            blocked = true;
            break;
          }
        }
      }
      if (blocked) continue;
      const x = cellX(i);
      const z = cellZ(j);
      if (excludeX !== undefined && Math.hypot(x - excludeX, z - excludeZ) < 8) continue;
      return { x, z };
    }
    return { x: 0, z: 0 };
  }

  function chooseColossusLanding(b) {
    return randomColossusLanding(b.x, b.z);
  }

  function fireColossusLandingRings(b) {
    const rings = [
      { radius: 7.2, count: 16, speed: 4.8, offset: 0 },
      { radius: 8.7, count: 16, speed: 6.0, offset: Math.PI / 16 },
      { radius: 10.2, count: 16, speed: 7.2, offset: 0 },
    ];
    for (const ring of rings) {
      for (let k = 0; k < ring.count; k++) {
        const angle = (k / ring.count) * Math.PI * 2 + ring.offset;
        spawnBossBullet(
          b.x + Math.cos(angle) * ring.radius,
          b.z + Math.sin(angle) * ring.radius,
          Math.cos(angle) * ring.speed,
          Math.sin(angle) * ring.speed,
          6
        );
      }
    }
  }

  function spawnColossusFireball(b) {
    const mesh = colossusFireballPool.find((m) => !m.visible);
    if (!mesh) return;
    const target = headPosition(_tmpA);
    const dx = target.x - b.x;
    const dz = target.z - b.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = dx / len;
    const nz = dz / len;
    const x = b.x + nx * 4;
    const z = b.z + nz * 4;
    mesh.visible = true;
    mesh.position.set(x, 0.48, z);
    state.lavaBalls.push({
      mesh,
      x,
      z,
      vx: nx * COLOSSUS_FIREBALL_SPEED,
      vz: nz * COLOSSUS_FIREBALL_SPEED,
      size: COLOSSUS_FIREBALL_SIZE,
      hitRadius: COLOSSUS_FIREBALL_HIT_RADIUS,
      hit: false,
    });
  }

  function spawnColossusLavaPool(x, z) {
    const mesh = colossusPoolPool.find((m) => !m.visible);
    if (!mesh) return;
    const margin = COLOSSUS_POOL_SIZE / 2;
    x = Math.max(-HALF + margin, Math.min(HALF - margin, x));
    z = Math.max(-HALF + margin, Math.min(HALF - margin, z));
    mesh.visible = true;
    mesh.material.opacity = 0.92;
    mesh.position.set(x, 0.11, z);
    mesh.scale.setScalar(1);
    state.lavaPools.push({
      mesh,
      x,
      z,
      size: COLOSSUS_POOL_SIZE,
      life: COLOSSUS_POOL_DURATION,
      hit: false,
    });
  }

  function bodyTouchesColossusPool(pool) {
    const half = COLOSSUS_POOL_SIZE / 2;
    for (const cell of state.cells) {
      if (Math.abs(cellX(cell.i) - pool.x) <= half && Math.abs(cellZ(cell.j) - pool.z) <= half) {
        return true;
      }
    }
    return false;
  }

  function updateColossusFireballs(dt) {
    for (let k = state.lavaBalls.length - 1; k >= 0; k--) {
      const b = state.lavaBalls[k];
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, 0.48, b.z);
      b.mesh.rotation.z += dt * 2.6;

      if (!b.hit && state.invuln <= 0 &&
        bodyDistanceSq(b.x, b.z) < b.hitRadius * b.hitRadius) {
        b.hit = true;
        const shielded = state.shieldTimer > 0;
        damage(3, 'projectile');
        if (!shielded) toast('熔岩火球命中', '体长 -3');
      }

      const leadX = b.x + (b.vx > 0 ? COLOSSUS_FIREBALL_WALL_RADIUS : (b.vx < 0 ? -COLOSSUS_FIREBALL_WALL_RADIUS : 0));
      const leadZ = b.z + (b.vz > 0 ? COLOSSUS_FIREBALL_WALL_RADIUS : (b.vz < 0 ? -COLOSSUS_FIREBALL_WALL_RADIUS : 0));
      const ci = Math.round(leadX + HALF);
      const cj = Math.round(leadZ + HALF);
      const hitWall = !inBounds(ci, cj) || isObstacle(ci, cj);
      if (hitWall) {
        spawnColossusLavaPool(b.x, b.z);
        b.mesh.visible = false;
        state.lavaBalls.splice(k, 1);
      }
    }
  }

  function updateColossusLavaPools(dt) {
    for (let k = state.lavaPools.length - 1; k >= 0; k--) {
      const pool = state.lavaPools[k];
      pool.life -= dt;
      pool.mesh.material.opacity = pool.life < 2 ? Math.max(0, pool.life / 2) * 0.92 : 0.92;
      pool.mesh.scale.setScalar(1 + Math.sin(state.time * 4 + k) * 0.025);

      if (!pool.hit && state.invuln <= 0 && bodyTouchesColossusPool(pool)) {
        pool.hit = true;
        state.slowTimer = Math.max(state.slowTimer, 3);
        damage(1, 'hazard');
        toast('踩入岩浆池', '体长 -1 · 移动速度降低 3 秒');
      }
      if (pool.life <= 0) {
        pool.mesh.visible = false;
        state.lavaPools.splice(k, 1);
      }
    }
  }

  function setFrostDragonPose(attacking) {
    const texture = attacking
      ? (FROST_DRAGON_ATTACK_TEX || BOSS_TEX.frost_dragon)
      : (BOSS_TEX.frost_dragon || bossPoseTexture);
    if (!texture || bossPlaneMat.map === texture) return;
    bossPlaneMat.map = texture;
    bossPlaneMat.color.setHex(0xffffff);
    bossPlaneMat.needsUpdate = true;
    bossPoseTexture = texture;
  }

  function bodyTouchesDragonBreath(b) {
    const dirX = Math.cos(b.breathAngle);
    const dirZ = Math.sin(b.breathAngle);
    for (const cell of state.cells) {
      const dx = cellX(cell.i) - b.x;
      const dz = cellZ(cell.j) - b.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.001 || distance > DRAGON_BREATH_RANGE) continue;
      const dot = (dx * dirX + dz * dirZ) / distance;
      if (Math.acos(Math.max(-1, Math.min(1, dot))) <= DRAGON_BREATH_HALF_ANGLE) return true;
    }
    return false;
  }

  function updateFrostDragon(b, dt, hp) {
    const baseScale = b.renderScale || 1.55;
    const dx = hp.x - b.x;
    const dz = hp.z - b.z;
    const targetAngle = Math.atan2(dz, dx);

    if (b.breathState === 'idle') {
      const distance = Math.hypot(dx, dz) || 1;
      if (distance > 7) {
        b.x += (dx / distance) * 0.42 * dt;
        b.z += (dz / distance) * 0.42 * dt;
      }
      b.x = Math.max(-HALF + 3, Math.min(HALF - 3, b.x));
      b.z = Math.max(-HALF + 3, Math.min(HALF - 3, b.z));
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = Math.sin(state.time * 1.5) * 0.025;
      bossMesh.scale.setScalar(baseScale + Math.sin(state.time * 2.1) * 0.03);
      bossBreathRig.visible = false;
      bossBreathMat.opacity = 0;
      setFrostDragonPose(false);

      if (b.cool > 0) b.cool -= dt;
      if (bodyDistanceSq(b.x, b.z) < b.contactRadius * b.contactRadius && b.cool <= 0) {
        b.cool = 1.6;
        damage(2, 'contact');
        if (state.over) return;
      }

      b.breathTimer -= dt;
      if (b.breathTimer <= 0) {
        b.breathState = 'telegraph';
        b.breathElapsed = 0;
        b.breathAngle = targetAngle;
        b.breathHit = false;
        setFrostDragonPose(true);
      }
      return;
    }

    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.z = Math.sin(state.time * 8) * 0.018;
    bossMesh.scale.setScalar(baseScale + Math.sin(state.time * 7) * 0.012);
    setFrostDragonPose(true);

    b.breathElapsed += dt;
    if (b.breathState === 'telegraph') {
      b.breathAngle = Math.atan2(dz, dx);
    }
    const dirX = Math.cos(b.breathAngle);
    const dirZ = Math.sin(b.breathAngle);
    bossBreathRig.position.set(b.x + dirX * 1.45, 0, b.z + dirZ * 1.45);
    bossBreathRig.rotation.y = Math.atan2(-dirZ, dirX);
    bossBreathRig.visible = true;

    if (b.breathState === 'telegraph') {
      const progress = Math.min(1, b.breathElapsed / DRAGON_BREATH_TELEGRAPH);
      bossBreathMat.opacity = 0.18 + progress * 0.24;
      if (b.breathElapsed >= DRAGON_BREATH_TELEGRAPH) {
        b.breathState = 'active';
        b.breathElapsed = 0;
        bossBreathMat.opacity = 0.92;
      }
      return;
    }

    bossBreathMat.opacity = 0.84 + Math.sin(state.time * 19) * 0.1;
    if (!b.breathHit && bodyTouchesDragonBreath(b)) {
      b.breathHit = true;
      const shielded = state.shieldTimer > 0;
      damage(2, 'projectile');
      if (!shielded) toast('凛冬龙息命中', '体长 -2');
      if (state.over) return;
    }
    if (b.breathElapsed >= DRAGON_BREATH_ACTIVE) {
      b.breathState = 'idle';
      b.breathElapsed = 0;
      b.breathTimer = DRAGON_BREATH_COOLDOWN;
      bossBreathRig.visible = false;
      bossBreathMat.opacity = 0;
      setFrostDragonPose(false);
    }
  }

  function updateMagmaColossus(b, dt) {
    if (b.jumpState !== 'airborne' && bodyDistanceSq(b.x, b.z) < COLOSSUS_CRUSH_RADIUS * COLOSSUS_CRUSH_RADIUS) {
      gameOver('被熔岩巨像踩碎');
      return;
    }

    if (b.recoverTimer > 0) {
      b.recoverTimer = Math.max(0, b.recoverTimer - dt);
      const p = 1 - b.recoverTimer / 0.45;
      bossMesh.scale.setScalar(COLOSSUS_RENDER_SCALE + Math.cos(Math.PI * p) * 0.42);
      colossusImpactRing.visible = true;
      colossusImpactRing.scale.setScalar(0.7 + p * 1.5);
      colossusImpactRing.material.opacity = 0.85 * (1 - p);
      if (b.recoverTimer === 0) {
        bossMesh.scale.setScalar(COLOSSUS_RENDER_SCALE);
        colossusImpactRing.visible = false;
        b.jumpState = 'idle';
      }
    }

    if (b.jumpState === 'airborne') {
      b.jumpElapsed += dt;
      const t = Math.min(1, b.jumpElapsed / COLOSSUS_JUMP_TIME);
      b.shadowWarning = Math.max(0, COLOSSUS_JUMP_TIME - b.jumpElapsed);
      b.x = b.jumpFrom.x;
      b.z = b.jumpFrom.z;
      const takeoff = Math.min(1, t / 0.12);
      bossMesh.visible = takeoff < 1;
      b.jumpHidden = takeoff >= 1;
      if (!b.jumpHidden) {
        bossMesh.position.set(b.x, Math.sin(takeoff * Math.PI * 0.5) * 2.8, b.z);
        bossMesh.rotation.z = takeoff * 0.08;
        bossMesh.scale.setScalar(COLOSSUS_RENDER_SCALE + takeoff * 0.225);
      }

      colossusShadow.visible = true;
      colossusShadow.position.set(b.jumpTo.x, 0.16, b.jumpTo.z);
      colossusShadow.material.opacity = 0.22 + t * 0.58 + Math.sin(state.time * 8) * 0.05;
      colossusShadow.scale.setScalar(0.78 + t * 0.22);

      if (t >= 1) {
        b.x = b.jumpTo.x;
        b.z = b.jumpTo.z;
        b.jumpElapsed = 0;
        b.jumpTimer = COLOSSUS_JUMP_COOLDOWN;
        b.jumpState = 'landed';
        b.shadowWarning = 0;
        b.recoverTimer = 0.45;
        b.jumpHidden = false;
        bossMesh.visible = true;
        bossMesh.position.set(b.x, 0, b.z);
        bossMesh.rotation.z = 0;
        bossMesh.scale.setScalar(COLOSSUS_RENDER_SCALE * 1.175);
        colossusShadow.visible = false;
        colossusImpactRing.visible = true;
        colossusImpactRing.position.set(b.x, 0.18, b.z);
        colossusImpactRing.scale.setScalar(0.7);
        colossusImpactRing.material.opacity = 0.85;
        fireColossusLandingRings(b);
        if (bodyDistanceSq(b.x, b.z) < COLOSSUS_CRUSH_RADIUS * COLOSSUS_CRUSH_RADIUS) {
          gameOver('被熔岩巨像砸中');
        }
      }
      return;
    }

    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.visible = true;
    bossMesh.rotation.z = 0;
    if (b.recoverTimer <= 0) {
      bossMesh.scale.setScalar(COLOSSUS_RENDER_SCALE + Math.sin(state.time * 2.2) * 0.0375);
    }
    b.jumpTimer -= dt;
    if (b.jumpTimer <= 0) {
      b.jumpFrom = { x: b.x, z: b.z };
      b.jumpTo = chooseColossusLanding(b);
      b.jumpElapsed = 0.0001;
      b.jumpState = 'airborne';
      b.jumpHidden = false;
      b.shadowWarning = COLOSSUS_JUMP_TIME;
      colossusShadow.visible = true;
      colossusShadow.position.set(b.jumpTo.x, 0.16, b.jumpTo.z);
      colossusShadow.material.opacity = 0.22;
      colossusShadow.scale.setScalar(0.78);
    }

    b.fireballTimer -= dt;
    if (b.fireballTimer <= 0) {
      b.fireballTimer = 3;
      spawnColossusFireball(b);
    }
  }

  function updateBoss(dt) {
    const b = state.boss;
    if (!b || !b.alive) return;
    const hp = headPosition(_tmpA).clone();
    if (b.kind === 'frost_dragon') {
      updateFrostDragon(b, dt, hp);
      return;
    }
    if (b.kind === 'magma_colossus') {
      updateMagmaColossus(b, dt);
      return;
    }
    const dx = hp.x - b.x;
    const dz = hp.z - b.z;
    const len = Math.hypot(dx, dz) || 1;
    b.x += (dx / len) * BOSS_SPEED * dt;
    b.z += (dz / len) * BOSS_SPEED * dt;
    b.x = Math.max(-HALF + 2, Math.min(HALF - 2, b.x));
    b.z = Math.max(-HALF + 2, Math.min(HALF - 2, b.z));
    if (b.kind === 'rootcoil') updateRootcoilSummon(b, dt);
    if (b.kind === 'pharaoh') updatePharaohShield(b, dt);

    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.z = Math.sin(state.time * 1.2) * 0.04;
    const baseScale = b.renderScale || 1;
    bossMesh.scale.setScalar(baseScale + Math.sin(state.time * 2.6) * 0.03 * baseScale);

    if (b.cool > 0) b.cool -= dt;
    if (bodyDistanceSq(b.x, b.z) < b.contactRadius * b.contactRadius && b.cool <= 0) {
      b.cool = 1.6;
      damage(2, 'contact');
      if (state.over) return;
    }

    b.shootTimer -= dt;
    if (b.shootTimer <= 0) {
      const isPharaoh = b.kind === 'pharaoh';
      if (isPharaoh) {
        // 三面扇形爆发：三个方向各三圈，子弹数从外圈到内圈递减
        b.shootTimer = PHARAOH_BULLET_INTERVAL;
        const base = Math.atan2(hp.z - b.z, hp.x - b.x);
        const fans = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
        const rings = [
          { r: 3.8, n: 10, spd: 4.4 }, // 外圈最多、最慢
          { r: 2.4, n: 6, spd: 5.4 },
          { r: 1.2, n: 3, spd: 6.4 },  // 内圈最少、最快
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
        b.shootTimer = ROOT_BULLET_INTERVAL;
        const count = 10;
        const spd = 6;
        for (let k = 0; k < count; k++) {
          const ang = (k / count) * Math.PI * 2 + state.time;
          spawnBossBullet(b.x, b.z, Math.cos(ang) * spd, Math.sin(ang) * spd);
        }
      }
    }
  }

  function spawnBossBullet(x, z, vx, vz, life = 4) {
    const mesh = bossBulletPool.find((m) => !m.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.position.set(x, 0.5, z);
    state.enemyBullets.push({ mesh, x, z, vx, vz, life });
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
        damage(1, 'projectile');
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
        damage(1, 'projectile');
      }
      if (dead) {
        b.mesh.visible = false;
        state.pods.splice(k, 1);
      }
    }
  }

  function spawnLavaHazard(x, z) {
    const mesh = hazardPool.find((m) => !m.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.material.opacity = 0.76;
    mesh.scale.setScalar(1);
    mesh.position.set(x, 0.09, z);
    state.hazards.push({ mesh, x, z, life: 3.5, hit: false });
  }

  function updateHazards(dt) {
    for (let k = state.hazards.length - 1; k >= 0; k--) {
      const h = state.hazards[k];
      h.life -= dt;
      h.mesh.material.opacity = Math.max(0, Math.min(0.8, h.life * 0.3));
      h.mesh.scale.setScalar(1 + Math.sin(state.time * 5 + k) * 0.08);
      if (!h.hit && bodyDistanceSq(h.x, h.z) < 0.62 * 0.62) {
        h.hit = true;
        state.slowTimer = Math.max(state.slowTimer, 2);
        damage(1, 'hazard');
        toast('岩浆灼伤', '体长 -1 · 移动速度降低 2 秒');
        if (state.over) return;
      }
      if (h.life <= 0) {
        h.mesh.visible = false;
        state.hazards.splice(k, 1);
      }
    }
  }

  function spawnGhostBullet(x, z, tx, tz) {
    const mesh = ghostBulletPool.find((m) => !m.visible);
    if (!mesh) return;
    const dx = tx - x;
    const dz = tz - z;
    const len = Math.hypot(dx, dz) || 1;
    mesh.visible = true;
    mesh.position.set(x, 0.55, z);
    state.ghostBullets.push({
      mesh,
      x,
      z,
      vx: (dx / len) * GHOST_BULLET_SPEED,
      vz: (dz / len) * GHOST_BULLET_SPEED,
    });
  }

  function updateGhostBullets(dt) {
    for (let k = state.ghostBullets.length - 1; k >= 0; k--) {
      const b = state.ghostBullets[k];
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, 0.55, b.z);
      const ci = Math.round(b.x + HALF);
      const cj = Math.round(b.z + HALF);
      let dead = !inBounds(ci, cj) || isObstacle(ci, cj);
      if (!dead && bodyDistanceSq(b.x, b.z) < GHOST_BULLET_HIT_RADIUS * GHOST_BULLET_HIT_RADIUS) {
        damage(1, 'projectile');
      }
      if (dead) {
        b.mesh.visible = false;
        state.ghostBullets.splice(k, 1);
      }
    }
  }

  function fireEnergy() {
    if (state.over || state.paused) return;
    if (state.cells.length <= 4) {
      toast('体长不足', '超过 4 节才能释放能量波（消耗 3 节）');
      return;
    }
    if (state.energyCd > 0) return;
    const mesh = energyOrbPool.find((item) => !item.visible);
    if (!mesh) return;

    state.energyCd = ENERGY_BALL_COOLDOWN;
    for (let k = 0; k < ENERGY_BALL_COST; k++) state.cells.pop();
    state.prevTail = null;
    updateHud();

    const from = headPosition();
    const d = state.dir;
    mesh.visible = true;
    mesh.position.set(from.x, 0.6, from.z);
    state.orbs.push({
      mesh,
      x: from.x,
      z: from.z,
      vx: d.i * 9,
      vz: d.j * 9,
      life: 2.6,
    });
    toast('翠核能量波', '消耗 3 节 · 命中后 3×3 范围清场');
  }

  function explodeEnergyAt(x, z) {
    const ci = Math.round(x + HALF);
    const cj = Math.round(z + HALF);
    for (const enemy of state.enemies) {
      if (!enemy.alive || isEnemyInvulnerable(enemy)) continue;
      if (Math.abs(enemy.i - ci) <= 1 && Math.abs(enemy.j - cj) <= 1) {
        enemy.alive = false;
        state.kills += 1;
        state.score += 30;
      }
    }

    const mesh = energyBoomPool.find((item) => !item.visible) || energyBoomPool[0];
    mesh.visible = true;
    mesh.position.set(x, 0.52, z);
    mesh.scale.setScalar(0.6);
    mesh.material.opacity = 0.95;
    state.booms.push({ mesh, t: 0 });
    updateHud();
  }

  function updateEnergyOrbs(dt) {
    state.energyCd = Math.max(0, state.energyCd - dt);
    for (let k = state.orbs.length - 1; k >= 0; k--) {
      const orb = state.orbs[k];
      orb.life -= dt;
      orb.x += orb.vx * dt;
      orb.z += orb.vz * dt;
      orb.mesh.position.set(orb.x, 0.6, orb.z);
      orb.mesh.rotation.y += dt * 3;

      const ci = Math.round(orb.x + HALF);
      const cj = Math.round(orb.z + HALF);
      let boom = orb.life <= 0 || Math.abs(orb.x) > HALF + 1 || Math.abs(orb.z) > HALF + 1 ||
        !inBounds(ci, cj) || isObstacle(ci, cj);

      if (!boom) {
        for (const enemy of state.enemies) {
          if (!enemy.alive) continue;
          if (Math.hypot(enemy.x - orb.x, enemy.z - orb.z) < 1.15) {
            boom = true;
            orb.boomX = enemy.x;
            orb.boomZ = enemy.z;
            break;
          }
        }
      }

      if (!boom && state.boss && state.boss.alive &&
        Math.hypot(state.boss.x - orb.x, state.boss.z - orb.z) < state.boss.orbHitRadius) {
        boom = true;
        orb.boomX = state.boss.x;
        orb.boomZ = state.boss.z;
        if (!damagePharaohShield(true)) {
          state.boss.hp -= ENERGY_BALL_DAMAGE;
          updateHud();
          if (state.boss.hp <= 0) bossDie();
        }
      }

      if (boom) {
        orb.mesh.visible = false;
        state.orbs.splice(k, 1);
        explodeEnergyAt(
          orb.boomX !== undefined ? orb.boomX : orb.x,
          orb.boomZ !== undefined ? orb.boomZ : orb.z
        );
      }
    }
  }

  function updateEnergyBooms(dt) {
    for (let k = state.booms.length - 1; k >= 0; k--) {
      const boom = state.booms[k];
      boom.t += dt;
      const progress = Math.min(1, boom.t / 0.45);
      boom.mesh.scale.setScalar(0.6 + progress * 2.2);
      boom.mesh.material.opacity = 0.95 * (1 - progress);
      if (progress >= 1) {
        boom.mesh.visible = false;
        state.booms.splice(k, 1);
      }
    }
  }

  function spawnFireBurst(x, z) {
    const mesh = fireBurstPool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.position.set(x, 0.3, z);
    mesh.scale.setScalar(0.72);
    mesh.material.opacity = 0.9;
    state.fireBursts.push({ mesh, t: 0 });
  }

  function damageEnemiesInFireAoe(x, z, damageAmount) {
    let hitCount = 0;
    const areaCenterX = Math.floor(x) + 0.5;
    const areaCenterZ = Math.floor(z) + 0.5;
    for (let e = 0; e < state.enemies.length; e++) {
      const en = state.enemies[e];
      if (!en.alive || isEnemyInvulnerable(en)) continue;
      if (Math.abs(en.x - areaCenterX) > 0.51 || Math.abs(en.z - areaCenterZ) > 0.51) continue;
      en.hp -= damageAmount;
      hitCount += 1;
      if (en.hp <= 0) {
        en.alive = false;
        state.kills += 1;
        state.score += 25;
        growBy(2);
      } else if (en.type === 'scarab' && enemyPool[e]) {
        enemyPool[e].material.map = TEX.scarabBroken || enemyPool[e].material.map;
        enemyPool[e].material.needsUpdate = true;
      }
    }
    if (hitCount > 0) updateHud();
    return hitCount;
  }

  function updateFireBursts(dt) {
    for (let k = state.fireBursts.length - 1; k >= 0; k--) {
      const burst = state.fireBursts[k];
      burst.t += dt;
      const progress = Math.min(1, burst.t / 0.34);
      burst.mesh.scale.setScalar(0.72 + progress * 0.8);
      burst.mesh.material.opacity = 0.9 * (1 - progress);
      if (progress >= 1) {
        burst.mesh.visible = false;
        state.fireBursts.splice(k, 1);
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
      let burstSpawned = false;
      if (b.fire && dynamicIce.has(`${ci},${cj}`)) {
        breakIceObstacle(ci, cj);
        spawnFireBurst(b.x, b.z);
        burstSpawned = true;
      }
      let dead = b.life <= 0 || !inBounds(ci, cj) || isObstacle(ci, cj);

      // 命中小怪
      if (!dead && (state.phase === 'clear' || state.phase === 'boss')) {
        for (let e = 0; e < state.enemies.length; e++) {
          const en = state.enemies[e];
          if (!en.alive) continue;
          if (Math.hypot(en.x - b.x, en.z - b.z) < ENEMY_HIT_RADIUS) {
            if (b.fire) {
              damageEnemiesInFireAoe(b.x, b.z, b.enemyDamage);
              spawnFireBurst(b.x, b.z);
              burstSpawned = true;
              dead = true;
              break;
            }
            if (isEnemyInvulnerable(en)) {
              dead = true;
              break;
            }
            en.hp -= b.enemyDamage;
            if (en.hp > 0) {
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
        if (Math.hypot(state.boss.x - b.x, state.boss.z - b.z) < state.boss.bulletHitRadius) {
          const shieldBlocked = damagePharaohShield(false);
          if (!shieldBlocked) {
            state.boss.hp -= b.bossDamage;
            state.score += 10;
            updateHud();
          }
          dead = true;
          if (b.fire) {
            spawnFireBurst(b.x, b.z);
            burstSpawned = true;
          }
          if (!shieldBlocked && state.boss.hp <= 0) bossDie();
        }
      }

      if (dead) {
        if (b.fire && !burstSpawned) spawnFireBurst(b.x, b.z);
        b.mesh.visible = false;
        state.bullets.splice(k, 1);
      }
    }
  }

  function updateSkillOrb(dt) {
    if (!state.skillOrb || !rewardOrbGroup.visible) return;
    const orb = state.skillOrb;
    orb.phase += dt;
    orb.delay = Math.max(0, orb.delay - dt);
    rewardShell.position.y = 1 + Math.sin(state.time * 1.8) * 0.06;
    rewardShell.scale.setScalar(1 + Math.sin(state.time * 2.4) * 0.035);
    rewardCore.position.y = 0.72 + Math.sin(state.time * 3.1) * 0.1;
    rewardCore.rotation.y += dt * 2.2;
    rewardRing.rotation.z += dt * 0.9;
    rewardRing.scale.setScalar(1 + Math.sin(state.time * 2.1) * 0.05);

    if (state.phase !== 'pick' || orb.delay > 0) return;
    headPosition(_tmpA);
    if (Math.hypot(_tmpA.x - orb.x, _tmpA.z - orb.z) < 0.62) {
      consumeSkillOrb();
    }
  }

  function updateDoor(dt) {
    const target = state.doorOpen ? 0.86 : 0.0;
    doorPad.material.opacity += (target - doorPad.material.opacity) * Math.min(1, dt * 6);
    doorPad.visible = doorPad.material.opacity > 0.02;
    doorGroup.rotation.y += dt * 0.4;

    if (state.spawnEmerging) {
      const tail = state.cells[state.cells.length - 1];
      if (tail && tail.j < SPAWN_DOOR_CELL.j) {
        state.spawnEmerging = false;
        state.spawnPortalClosing = true;
      }
    }
    spawnDoorGroup.rotation.y += dt * 0.45;
    if (state.spawnPortalClosing) {
      state.spawnPortalOpacity = Math.max(0, state.spawnPortalOpacity - dt * 3.2);
      spawnDoorPad.material.opacity = state.spawnPortalOpacity;
      if (state.spawnPortalOpacity <= 0.01) {
        state.spawnPortalOpacity = 0;
        spawnDoorPad.material.opacity = 0;
        spawnDoorGroup.visible = false;
        state.spawnPortalClosing = false;
      }
    }
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
      const award = notifyLevelCleared(state.level);
      if (award) {
        toast(`关卡完成 · ${'★'.repeat(award.stars)}`, `受伤 ${award.damageTaken} 次 · 用时 ${formatLevelTime(award.elapsed)}`);
      }
      startLevel(Math.min(state.level + 1, ROOM_COUNT - 1));
    } else if (state.phase === 'exit') {
      const award = notifyLevelCleared(state.level);
      if (award) {
        toast(`关卡完成 · ${'★'.repeat(award.stars)}`, `受伤 ${award.damageTaken} 次 · 用时 ${formatLevelTime(award.elapsed)}`);
      }
      if (state.level + 1 < ROOM_COUNT) startLevel(state.level + 1);
      else victory();
    }
  }

  function clearCombatResidue() {
    const projectileLists = [
      state.bullets,
      state.enemyBullets,
      state.pods,
      state.ghostBullets,
      state.hazards,
      state.lavaBalls,
      state.lavaPools,
      state.orbs,
      state.booms,
      state.fireBursts,
    ];
    projectileLists.forEach((list) => {
      list.forEach((entry) => {
        const mesh = entry && entry.mesh ? entry.mesh : entry;
        if (mesh) mesh.visible = false;
      });
      list.length = 0;
    });
    clearIceObstacles();
    state.iceSpawnTimer = ICE_SPAWN_INTERVAL;
    state.slowTimer = 0;
    state.hitFlash = 0;
  }

  function checkClear() {
    if (state.phase !== 'clear' || state.doorOpen) return;
    if (state.enemies.some((e) => e.alive)) return;
    clearCombatResidue();
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
  function resetGame(startLevelIndex = DEBUG_START_LEVEL) {
    state.cells.length = 0;
    for (let k = 0; k < START_LEN; k++) state.cells.push({ i: 22, j: 34 + k });
    state.dir = { i: 0, j: -1 };
    state.progress = 1;
    state.prevTail = null;
    state.invuln = 1;
    state.score = 0;
    state.damageTaken = 0;
    state.kills = 0;
    state.eaten = 0;
    state.over = false;
    state.paused = false;
    state.shootCd = 0;
    state.shieldTimer = 0;
    state.shieldCooldown = 0;
    state.shieldFlash = 0;
    state.fireBursts.forEach((burst) => { burst.mesh.visible = false; });
    state.fireBursts.length = 0;
    state.orbs.forEach((orb) => { orb.mesh.visible = false; });
    state.orbs.length = 0;
    state.booms.forEach((boom) => { boom.mesh.visible = false; });
    state.booms.length = 0;
    state.energyCd = 0;
    state.slowTimer = 0;
    state.clearedNotified.clear();
    state.roomActive = false;
    state.roomTimer = 0;
    state.spawnEmerging = false;
    state.spawnPending = 0;
    state.spawnPortalClosing = false;
    state.spawnPortalOpacity = 0;
    if (startRoom) startRoom.visible = false;
    if (spawnDoorGroup) spawnDoorGroup.visible = false;
    if (doorPlug) doorPlug.visible = false;
    pharaohShieldRig.visible = false;
    rootSummonRig.visible = false;
    bossBreathRig.visible = false;
    playerFrostRig.visible = false;
    state.time = 0;
    state.shotDamage = 6;
    state.shootCdMul = 1;
    state.enemies = Array.from({ length: 24 }, () => ({ alive: false, i: 0, j: 0, x: 0, z: 0, cool: 0, bob: 0 }));

    el.overlay.classList.remove('show');
    const safeStartLevel = Math.max(0, Math.min(ROOM_COUNT - 1, Number(startLevelIndex) || 0));
    startLevel(safeStartLevel);
  }

  function formatDuration(sec) {
    const total = Math.max(0, Math.floor(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}分${String(s).padStart(2, '0')}秒`;
  }

  function saveBest() {
    try {
      const key = 'devour-best-v2';
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
    showResultRating(0, state.levelTime);
    const position = campaignPosition(state.level);
    el.ovdetail.textContent = `抵达 ${position.region + 1}-${position.node} · 受伤 ${state.damageTaken} 次 · 击杀 ${state.kills} · 吃豆 ${state.eaten}`;
    el.overlayContinue.hidden = true;
    el.overlay.classList.add('show');
  }

  function victory() {
    state.over = true;
    saveBest();
    el.ovtitle.textContent = '通关';
    el.ovsub.textContent = '你吞掉了枯树、黄金法老、熔岩巨像与凛冬冰龙，四片疆域都成了你的巢。';
    const rating = evaluateLevelStars(state.cells.length, state.levelTime);
    showResultRating(rating.stars, state.levelTime);
    el.ovdetail.textContent = `体长 ${state.cells.length} · 受伤 ${state.damageTaken} 次 · 击杀 ${state.kills} · 吃豆 ${state.eaten}`;
    el.overlayContinue.hidden = true;
    el.overlay.classList.add('show');
  }

  // ---------- 主循环 ----------
  const clock = new THREE.Clock();

  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    state.time += dt;
    if (lavaUnderlay.visible) {
      lavaUnderlay.material.opacity = 0.78 + Math.sin(state.time * 2.4) * 0.1;
    }

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) el.toast.style.display = 'none';
    }

    if (!state.paused && !state.over) {
      state.levelTime += dt;
      const timerSecond = Math.floor(state.levelTime);
      if (timerSecond !== state.timerDisplayedSecond && el.levelTime) {
        state.timerDisplayedSecond = timerSecond;
        el.levelTime.textContent = formatLevelTime(state.levelTime);
      }
      state.shootCd = Math.max(0, state.shootCd - dt);
      state.invuln = Math.max(0, state.invuln - dt);
      state.slowTimer = Math.max(0, state.slowTimer - dt);
      state.shieldTimer = Math.max(0, state.shieldTimer - dt);
      state.shieldCooldown = Math.max(0, state.shieldCooldown - dt);
      state.shieldFlash = Math.max(0, state.shieldFlash - dt);
      state.frostCooldown = Math.max(0, state.frostCooldown - dt);
      state.frostEffectTimer = Math.max(0, state.frostEffectTimer - dt);
      skillHudRevealTimer = Math.max(0, skillHudRevealTimer - dt);
      playerFrostRig.visible = state.frostEffectTimer > 0;
      if (playerFrostRig.visible) {
        playerFrostMesh.material.opacity = Math.min(0.82, state.frostEffectTimer * 1.4);
      }
      updateSkillHud();

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
        updateGhostBullets(dt);
        updateHazards(dt);
      }
      if (state.phase === 'boss') {
        updateBoss(dt);
        updateEnemies(dt);
        updatePods(dt);
        updateBossBullets(dt);
        updateColossusFireballs(dt);
        updateColossusLavaPools(dt);
      }

      updateBullets(dt);
      updateEnergyOrbs(dt);
      updateEnergyBooms(dt);
      updateFireBursts(dt);
      updateIceObstacles(dt);
      updateIceSpawner(dt);
      updatePellets();
      updateSkillOrb(dt);
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
  window.__devourApi = {
    startLevel,
    bossDie,
    consumeSkillOrb,
    spawnSkillOrb,
    shoot,
    activateShield,
    activateFrostBreath,
    damage,
    checkClear,
    clearCombatResidue,
    damageEnemiesInFireAoe,
    resetGame,
    spawnPellet,
    isObstacle,
    evaluateLevelStars,
    getEnemyStats: (type) => ({ ...enemyStats(type) }),
    chooseRespawnEnemyType,
    clearObstacles: () => obstacles.clear(),
    spawnIceObstacle,
    breakIceObstacle,
    getIceObstacles: () => [...dynamicIce.values()].map(({ i, j }) => ({ i, j })),
  };
  window.startDevour = (levelIndex = DEBUG_START_LEVEL) => {
    resetGame(levelIndex);
    showHelp();
    clock.getDelta(); // 清掉暂停期间累积的 delta
    state.paused = false;
  };
  renderer.setAnimationLoop(tick);
})();
