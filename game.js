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
  const TELEPORT_SKILL_COST = 2;
  const TELEPORT_SKILL_COOLDOWN = 8;
  const TELEPORT_MIN_HOLE_DISTANCE = 9;
  const TELEPORT_HOLE_EFFECT_TIME = 1.6;
  const SPEED_BOOST_MULT = 1.5;
  const SPEED_BOOST_DURATION = 2;
  const SPEED_BOOST_COOLDOWN = 3;
  const SHIELD_HALO_SCALE_X = 0.94;
  const SHIELD_HALO_SCALE_Y = 0.72;
  const MAX_ENEMIES = 48;
  const ICE_SLUG_MAX_ACTIVE = 16;
  const FIRE_BULLET_COST = 2;
  const FIRE_BULLET_DAMAGE = 2;
  const FIRE_BULLET_IMAGE_WIDTH = 3.0;
  const FIRE_BULLET_IMAGE_HEIGHT = 1.55;
  const FIRE_BULLET_TRAIL_INTERVAL = 0.055;
  const FIRE_BULLET_TRAIL_LIFE = 0.34;
  const ENERGY_BALL_COST = 3;
  const ENERGY_BALL_COOLDOWN = 3;
  const ENERGY_BALL_DAMAGE = 45;
  const GHOST_BULLET_RADIUS = 0.56;
  // 原命中半径 0.62，攻击整体放大为两倍
  const GHOST_BULLET_HIT_RADIUS = 1.24;
  const GHOST_BULLET_SPEED = 2;
  const ICE_SPAWN_INTERVAL = 15;
  const ICE_PILLARS_PER_WAVE = 5;
  const ICE_MAX_PILLARS = 80;
  const WOLF_POUNCE_RANGE = 7;
  const WOLF_POUNCE_HIT_RADIUS = 1.35;
  const WOLF_CHARGE_TIME = 0.42;
  const WOLF_POUNCE_TIME = 0.18;
  const WOLF_STUN_TIME = 0.62;
  const WOLF_CHASER_COUNT = 2;
  const WOLF_WANDER_SPEED_MUL = 0.68;
  const WOLF_WANDER_DETECTION_RANGE = 4;
  const WOLF_RENDER_SCALE = 1.82;
  const THIN_ICE_SLOW_TIME = 2.5;
  const DRAGON_BREATH_TELEGRAPH = 0.85;
  const DRAGON_BREATH_ACTIVE = 1.15;
  const DRAGON_BREATH_COOLDOWN = 6.2;
  const DRAGON_BREATH_RANGE = 23.2;
  const DRAGON_BREATH_HALF_ANGLE = Math.PI * 0.12;
  const DRAGON_ATTACK_INTERVAL = 3.5;
  const DRAGON_MIRROR_HP_RATIO = 0.75;
  const DRAGON_LASER_TELEGRAPH = 0.9;
  const DRAGON_LASER_ACTIVE = 8;
  const DRAGON_LASER_SPIN_SPEED = Math.PI * 0.26;
  const DRAGON_LASER_RANGE = 23.2;
  const DRAGON_LASER_HIT_WIDTH = 1.52;
  const DRAGON_LASER_HIT_COOLDOWN = 0.9;
  const DRAGON_SLAM_TELEGRAPH = 1.15;
  const DRAGON_SLAM_ACTIVE = 0.65;
  const DRAGON_SLAM_BULLET_COUNT = 72;
  const DRAGON_SLAM_BULLET_POOL_SIZE = 160;
  const DRAGON_FROST_SCAR_LIFE = 5;
  const WISP_FOG_TIME = 7;
  const WISP_SOLID_TIME = 3;
  const WISP_CAST_WARNING = 0.85;
  const WISP_FOG_LIFE = 5;
  const WISP_ORB_RADIUS = 0.46;
  const WISP_ORB_SPEED = 2.65;
  const WISP_ORB_TURN_RATE = 1.35;
  const WISP_ORB_LIFE = 9;
  const WISP_DISSOLVE_TIME = 0.62;
  const FROST_SKILL_COST = 1;
  const FROST_SKILL_COOLDOWN = 5;
  const FROST_SKILL_SLOW_DURATION = 3;
  const FROST_SKILL_RANGE = 8;
  const FROST_SKILL_HALF_ANGLE = Math.atan(0.28);
  const FROST_SKILL_SLOW_MULT = 0.5;
  const FROST_SKILL_DAMAGE = 2;
  const STORM_LIGHTNING_INTERVAL = 5;
  const STORM_LIGHTNING_WARNING = 1;
  const STORM_LIGHTNING_IMPACT_TIME = 0.42;
  const STORM_LIGHTNING_DAMAGE = 1;
  const STORM_OBSTACLE_COUNT = 8;
  const STORM_EAGLE_HP = 470;
  const STORM_EAGLE_FEATHER_COUNT = 27;
  const STORM_EAGLE_FEATHER_SPAN = Math.PI * 0.66;
  const STORM_EAGLE_FEATHER_SPEED = 8.8;
  const STORM_EAGLE_FEATHER_LIFE = 8;
  const STORM_EAGLE_FEATHER_RADIUS = 0.56;
  const STORM_EAGLE_FEATHER_INTERVAL = 6.2;
  const STORM_EAGLE_FEATHER_WARNING = 0.75;
  const STORM_EAGLE_FEATHER_POSE_TIME = 0.65;
  const STORM_EAGLE_DASH_MIN_DISTANCE = 13;
  const STORM_EAGLE_DASH_WINDUP = 0.3;
  const STORM_EAGLE_DASH_TIME = 0.48;
  const STORM_EAGLE_DASH_COOLDOWN = 6;
  const STORM_EAGLE_RAM_DAMAGE = 1;
  const STORM_TORNADO_INTERVAL = 9;
  const STORM_TORNADO_FIRST_CAST = 5;
  const STORM_TORNADO_WARNING = 1.05;
  const STORM_TORNADO_LIFE = 6;
  const STORM_TORNADO_COUNT = 3;
  const STORM_TORNADO_FOOTPRINT = 7;
  const STORM_TORNADO_SIZE = 5.6;
  const STORM_TORNADO_HIT_COOLDOWN = 1.2;
  const STORM_TORNADO_SLOW_TIME = 3;
  const STORM_BOLT_SPEED = 4.6;
  const STORM_DIVE_RANGE = 10;
  const STORM_DIVE_TELEGRAPH = 0.82;
  const STORM_DIVE_TIME = 0.34;
  const STORM_DIVE_RECOVER = 0.7;
  const ABYSS_OBSTACLE_COUNT = 8;
  const ABYSS_LORD_HP = 520;
  const ABYSS_LEVEL_BASE = 40;
  const ABYSS_LORD_TRIGGER_RANGE = 12;
  const ABYSS_LORD_THRUST_WINDUP = 0.35;
  const ABYSS_LORD_THRUST_TIME = 0.34;
  const ABYSS_LORD_THRUST_INTERVAL = 6;
  const ABYSS_LORD_THRUST_DAMAGE = 3;
  const ABYSS_LORD_THRUST_HIT_RADIUS = 2.2;
  const ABYSS_LORD_SHOT_INTERVAL = 3;
  const ABYSS_LORD_SHOT_COUNT = 5;
  const ABYSS_LORD_SHOT_SPREAD = 0.14;
  const ABYSS_LORD_BULLET_SPEED = 5.4;
  const ABYSS_LORD_BULLET_SIZE = 3;
  const ABYSS_LORD_BULLET_VISUAL_SIZE = 5.6;
  const ABYSS_LORD_BULLET_HEAD_OFFSET = 1.45;
  const ABYSS_LORD_BULLET_HIT_RADIUS = 1.5;
  const ABYSS_LORD_BULLET_DAMAGE = 1;
  const ABYSS_LORD_AFTERIMAGE_LIFE = 6;
  const ABYSS_LORD_AFTERIMAGE_SIZE = 3;
  const ABYSS_LORD_AFTERIMAGE_SLOW_TIME = 3;
  const ABYSS_LORD_TELEPORT_FRAMES = 11;
  const ABYSS_LORD_TELEPORT_DURATION = 0.99;
  const ABYSS_LORD_TELEPORT_INTERVAL = 8;
  const BLACK_GORGE_LEVEL_BASE = 48;
  const BLACK_GORGE_OBSTACLE_COUNT = 8;
  const BLACK_CURSE_ATTENDANT_HP = 290;
  const BLOOD_SLAVE_HP = 360;
  const BLACK_MIST_SERVANT_HP = 430;
  const BLACK_WIZARD_HP = 760;
  const BLACK_CURSE_BOSS_CELL = { i: 22, j: 4 };
  const BLACK_CURSE_BULLET_INTERVAL = 8;
  const BLACK_CURSE_BULLET_COUNT = 27;
  const BLACK_CURSE_BULLET_SPEED = 2.35;
  const BLACK_CURSE_BULLET_HIT_RADIUS = 0.9;
  const BLACK_CURSE_BULLET_TURN_RATE = 1.15;
  const BLACK_CURSE_RUNE_INTERVAL = 7;
  const BLACK_CURSE_RUNE_WARNING = 2;
  const BLACK_CURSE_RUNE_ACTIVE = 0.55;
  const BLACK_CURSE_RUNE_SIZE = 8;
  const BLACK_CURSE_RUNE_DAMAGE = 3;
  const BLACK_CURSE_LOCK_TIME = 8;
  const BLOOD_SLAVE_FILM_DURATION = 5;
  const BLOOD_SLAVE_FILM_COOLDOWN = 10;
  const BLOOD_SLAVE_FILM_HEAL = 1;
  const BLOOD_SLAVE_CLAW_RANGE = 12;
  const BLOOD_SLAVE_CLAW_WINDUP = 0.38;
  const BLOOD_SLAVE_CLAW_DASH_TIME = 0.2;
  const BLOOD_SLAVE_CLAW_RECOVER = 0.55;
  const BLOOD_SLAVE_CLAW_COOLDOWN = 4;
  const BLOOD_SLAVE_CLAW_DAMAGE = 3;
  const BLOOD_SLAVE_CLAW_HIT_RADIUS = 4.2;
  const BLOOD_SLAVE_POOL_COOLDOWN = 9;
  const BLOOD_SLAVE_POOL_COUNT = 4;
  const BLOOD_SLAVE_POOL_LIFE = 6;
  const BLOOD_SLAVE_POOL_RADIUS = 3;
  const BLOOD_SLAVE_POOL_MIN_BOSS_DISTANCE = 8;
  const BLOOD_SLAVE_POOL_MIN_SPACING = 6.5;
  const BLOOD_SLAVE_POOL_DAMAGE = 1;
  const BLOOD_SLAVE_RAGE_TIME = 5;
  const BLOOD_SLAVE_RAGE_MULT = 2;
  const BLACK_RUNE_WARNING = 0.9;
  const BLACK_RUNE_ACTIVE = 0.48;
  const BLACK_MIST_TIME = 1.2;
  const BLACK_MIST_SOLID_TIME = 3.8;
  const BLACK_MIST_TELEPORT_INTERVAL = 5;
  const BLACK_MIST_CLONE_SPLIT_INTERVAL = 10;
  const BLACK_MIST_CLONE_COUNT = 2;
  const BLACK_MIST_CLONE_BREAK_HITS = 3;
  const BLACK_MIST_CLONE_HIT_RADIUS = 3.0;
  const BLACK_MIST_BULLET_HIT_RADIUS = 0.78;
  const BLACK_MIST_BULLET_SPEED = 4.2;
  const BLACK_MIST_BULLET_BURST_SPEED = 4.7;
  const BLACK_MIST_BULLET_POOL_SIZE = 160;
  const BLACK_WIZARD_RENDER_SCALE = 2.6;
  const BLACK_WIZARD_SKILL_RENDER_SCALE = 2.45;
  const BLACK_WIZARD_ENRAGE_RATIO = 0.5;
  const BLACK_WIZARD_CURSE_FIELD_INTERVAL = 8;
  const BLACK_WIZARD_CURSE_FIELD_SIZE = 10;
  const BLACK_WIZARD_CURSE_FIELD_WARNING = 1;
  const BLACK_WIZARD_CURSE_FIELD_LIFE = 6;
  const BLACK_WIZARD_CURSE_FIELD_DAMAGE = 1;
  const BLACK_WIZARD_ARROW_INTERVAL = 6;
  const BLACK_WIZARD_ARROW_COUNT = 3;
  const BLACK_WIZARD_ARROW_SPEED = 16.5;
  const BLACK_WIZARD_ARROW_LENGTH = 5;
  const BLACK_WIZARD_ARROW_WIDTH = 2;
  const BLACK_WIZARD_ARROW_DAMAGE = 2;
  const BLACK_WIZARD_ARROW_SLOW_TIME = 1.8;
  const BLACK_WIZARD_MAX_CURSE = 3;
  const BLACK_WIZARD_CURSE_DECAY_TIME = 5;
  const BLACK_WIZARD_SUMMON_INTERVAL = 15;
  const BLACK_WIZARD_SUMMON_HP = 5;
  const BLACK_WIZARD_SUMMON_LIFE = 15;
  const BLACK_WIZARD_CAST_POSE_TIME = 0.8;
  // 默认从第一关开始；开发时可用 ?level=11 显式进入指定房间。
  let DEBUG_START_LEVEL = 0;
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
    // 第四章小怪的机制与最终数值后续单独补齐；蛞蝓会周期性分裂。
    iceSlug: {
      hp: 2, speed: 0.234, contactDamage: 1, contactCooldown: 1.3,
      contactRadius: 0.592, retreatSpeedMul: 0.4, splitInterval: 10,
    },
    frostWolf: {
      hp: 3, speed: 2.05, contactDamage: 2, contactCooldown: 0.9,
      contactRadius: 1.62, retreatSpeedMul: 0.46,
    },
    frostWisp: {
      hp: 1, speed: 0.42, contactDamage: 1, contactCooldown: 1.25,
      contactRadius: 0.7, retreatSpeedMul: 0.4,
    },
    stormSkimmer: {
      hp: 1, speed: 2.45, contactDamage: 1, contactCooldown: 1.15,
      contactRadius: 0.62, retreatSpeedMul: 0.48,
      dashInterval: 2.6, dashDuration: 0.38, dashSpeedMul: 2.35,
    },
    stormMoth: {
      hp: 2, speed: 1.18, contactDamage: 1, contactCooldown: 1.3,
      contactRadius: 0.68, retreatSpeedMul: 0.42,
      shootCooldown: 3.2, shootRange: 18, preferredRange: 5.2,
    },
    stormFalcon: {
      hp: 3, speed: 1.55, contactDamage: 2, contactCooldown: 1.25,
      contactRadius: 0.82, retreatSpeedMul: 0.4,
    },
    // 第六章先接入场景与基础追踪；横扫、冲刺和魂弹等专属机制后续补充。
    abyssTentacle: {
      hp: 3, speed: 0.72, contactDamage: 2, contactCooldown: 1.4,
      contactRadius: 1.02, retreatSpeedMul: 0.34,
    },
    voidTick: {
      hp: 1, speed: 2.25, contactDamage: 1, contactCooldown: 1.1,
      contactRadius: 0.72, retreatSpeedMul: 0.48,
    },
    soulWraith: {
      hp: 2, speed: 1.08, contactDamage: 1, contactCooldown: 1.3,
      contactRadius: 0.78, retreatSpeedMul: 0.4,
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

    { theme: 'storm', kind: 'clear', composition: { stormSkimmer: 8 }, name: '风暴空域 · 浮云边陲' },
    { theme: 'storm', kind: 'clear', composition: { stormSkimmer: 5, stormMoth: 3 }, name: '风暴空域 · 雷羽回廊' },
    { theme: 'storm', kind: 'clear', composition: { stormMoth: 8 }, name: '风暴空域 · 裂空风谷' },
    { theme: 'storm', kind: 'clear', composition: { stormSkimmer: 5, stormFalcon: 3 }, name: '风暴空域 · 隼影高台' },
    { theme: 'storm', kind: 'clear', composition: { stormSkimmer: 3, stormMoth: 2, stormFalcon: 3 }, name: '风暴空域 · 旋云交汇' },
    { theme: 'storm', kind: 'clear', composition: { stormMoth: 5, stormFalcon: 3 }, name: '风暴空域 · 暴风核心' },
    { theme: 'storm', kind: 'clear', composition: { stormFalcon: 8 }, name: '风暴空域 · 王座前庭' },
    { theme: 'storm', kind: 'boss', boss: 'storm_eagle', name: '风暴巨鹰 · STORM EAGLE' },

    { theme: 'abyss', kind: 'clear', composition: { abyssTentacle: 8 }, name: '深渊裂隙 · 裂隙外缘' },
    { theme: 'abyss', kind: 'clear', composition: { abyssTentacle: 5, voidTick: 3 }, name: '深渊裂隙 · 无声礁廊' },
    { theme: 'abyss', kind: 'clear', composition: { voidTick: 8 }, name: '深渊裂隙 · 蜱巢裂口' },
    { theme: 'abyss', kind: 'clear', composition: { abyssTentacle: 5, soulWraith: 3 }, name: '深渊裂隙 · 噬魂深井' },
    { theme: 'abyss', kind: 'clear', composition: { abyssTentacle: 3, voidTick: 2, soulWraith: 3 }, name: '深渊裂隙 · 三叉裂隙' },
    { theme: 'abyss', kind: 'clear', composition: { voidTick: 5, soulWraith: 3 }, name: '深渊裂隙 · 噬光坑道' },
    { theme: 'abyss', kind: 'clear', composition: { soulWraith: 8 }, name: '深渊裂隙 · 影主前庭' },
    { theme: 'abyss', kind: 'boss', boss: 'abyss_lord', name: '深渊影主 · ABYSSAL SHADE' },
    { theme: 'blackgorge', kind: 'boss', boss: 'black_curse_servant', name: '黑咒侍从 · BLACK CURSE ATTENDANT' },
    { theme: 'blackgorge', kind: 'boss', boss: 'blood_slave', name: '畸变血奴 · MUTATED BLOOD SLAVE' },
    { theme: 'blackgorge', kind: 'boss', boss: 'black_mist_servant', name: '黑雾魔侍 · BLACK MIST SERVANT' },
    { theme: 'blackgorge', kind: 'boss', boss: 'black_wizard', name: '黑巫师 · THE BLACK WIZARD' },
  ];
  const ROOM_COUNT = ROOMS.length;
  DEBUG_START_LEVEL = (() => {
    try {
      const value = Number(new URLSearchParams(window.location.search).get('level'));
      return Number.isInteger(value) ? Math.max(0, Math.min(ROOM_COUNT - 1, value)) : 0;
    } catch (err) {
      return 0;
    }
  })();

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
  const FROZEN_OBSTACLE_COUNT = 8;

  const inBounds = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
  const mirrorBlocksCell = (i, j) => Boolean(
    state.mirrorPillars && state.mirrorPillars.some((pillar) => (
      pillar.alive && pillar.cells.some((cell) => cell.i === i && cell.j === j)
    ))
  );
  const isObstacle = (i, j) => (
    obstacles.has(`${i},${j}`) || dynamicIce.has(`${i},${j}`) || mirrorBlocksCell(i, j)
  );

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
      ? imageTextureLoader.load(`assets/${file}?v=20261124-frozenpillars1`)
      : fallback
  );
  const loadIceEffectTexture = (file) => {
    if (!imageTextureLoader) return null;
    const texture = imageTextureLoader.load(`assets/${file}?v=20261124-frostbatch1`);
    texture.colorSpace = THREE.SRGBColorSpace || 'srgb';
    if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    }
    return texture;
  };
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
  const FIRE_BULLET_TEX = imageTextureLoader
    ? imageTextureLoader.load('assets/fireball-bullet.png?v=20261124-fireball-image1')
    : null;
  const WOLF_CLAW_TEX = loadIceEffectTexture('wolf-claw-vfx.png');
  const FROST_MIST_TEX = loadIceEffectTexture('frost-mist-vfx.png');
  const WOLF_FROST_TILE_TEX = loadIceEffectTexture('wolf-frost-tile.png');
  const FROST_BREATH_CONE_TEX = loadIceEffectTexture('frost-breath-cone.png');
  if (FROST_BREATH_CONE_TEX) {
    FROST_BREATH_CONE_TEX.generateMipmaps = false;
    FROST_BREATH_CONE_TEX.minFilter = THREE.LinearFilter;
    FROST_BREATH_CONE_TEX.magFilter = THREE.LinearFilter;
  }
  const PURPLE_BLACK_HOLE_TEX = loadIceEffectTexture('purple-black-hole.png');
  if (PURPLE_BLACK_HOLE_TEX) {
    PURPLE_BLACK_HOLE_TEX.generateMipmaps = false;
    PURPLE_BLACK_HOLE_TEX.minFilter = THREE.LinearFilter;
    PURPLE_BLACK_HOLE_TEX.magFilter = THREE.LinearFilter;
  }
  if (FIRE_BULLET_TEX) {
    FIRE_BULLET_TEX.colorSpace = THREE.SRGBColorSpace || 'srgb';
    if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
      FIRE_BULLET_TEX.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    }
  }
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
    stormSkimmer: loadCharacterTexture('storm-skimmer.png', null),
    stormMoth: loadCharacterTexture('storm-moth.png', null),
    stormFalcon: loadCharacterTexture('storm-falcon.png', null),
    abyssTentacle: loadCharacterTexture('abyss-tentacle.png', null),
    voidTick: loadCharacterTexture('abyss-tick.png', null),
    soulWraith: loadCharacterTexture('abyss-wraith.png', null),
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
  const STORM_EAGLE_DIVE_TEX = loadIceEffectTexture('storm-eagle-dive.png');
  const STORM_EAGLE_FLAP_TEX = loadIceEffectTexture('storm-eagle-flap.png');
  const ABYSS_LORD_THRUST_TEX = loadIceEffectTexture('abyss-lord-thrust.png');
  const ABYSS_BULLET_TEX = loadIceEffectTexture('abyss-bullet.png');
  const ABYSS_BULLET_AFTERIMAGE_TEX = loadIceEffectTexture('abyss-bullet-afterimage.png');
  const ABYSS_LORD_VANISH_TEX = loadIceEffectTexture('abyss-lord-vanish.png');
  const ABYSS_LORD_EMERGE_TEX = loadIceEffectTexture('abyss-lord-emerge.png');
  if (ABYSS_LORD_VANISH_TEX) {
    ABYSS_LORD_VANISH_TEX.wrapS = THREE.ClampToEdgeWrapping;
    ABYSS_LORD_VANISH_TEX.repeat.set(1 / ABYSS_LORD_TELEPORT_FRAMES, 1);
    ABYSS_LORD_VANISH_TEX.offset.set(0, 0);
  }
  if (ABYSS_LORD_EMERGE_TEX) {
    ABYSS_LORD_EMERGE_TEX.wrapS = THREE.ClampToEdgeWrapping;
    ABYSS_LORD_EMERGE_TEX.repeat.set(1 / ABYSS_LORD_TELEPORT_FRAMES, 1);
    ABYSS_LORD_EMERGE_TEX.offset.set(0, 0);
  }
  const BOSS_TEX = {
    rootcoil: loadCharacterTexture('rootcoil.png', spriteTexture(512, drawBoss)),
    pharaoh: loadCharacterTexture('pharaoh.png', spriteTexture(512, drawPharaoh)),
    magma_colossus: magmaColossusTex,
    frost_dragon: loadCharacterTexture('frost-dragon-idle.png', null),
    storm_eagle: loadCharacterTexture('storm-eagle.png', null),
    storm_eagle_dive: STORM_EAGLE_DIVE_TEX,
    storm_eagle_flap: STORM_EAGLE_FLAP_TEX,
    abyss_lord: loadCharacterTexture('abyss-lord.png', null),
    abyss_lord_thrust: ABYSS_LORD_THRUST_TEX,
    black_curse_servant: loadCharacterTexture('black-curse-attendant.png', null),
    blood_slave: loadCharacterTexture('blood-slave.png', null),
    black_mist_servant: loadCharacterTexture('black-mist-servant.png', null),
    black_wizard: loadCharacterTexture('black-wizard.png', null),
  };
  const FROST_DRAGON_ATTACK_TEX = loadCharacterTexture('frost-dragon-attack.png', null);
  const DRAGON_BREATH_TEX = loadCharacterTexture('dragon-breath.png', null);
  const DRAGON_BREATH_RAY_TEX = loadIceEffectTexture('dragon-breath-ray.png');
  const FROST_LASER_TEX = loadIceEffectTexture('frost-laser.png');
  const FROST_SCAR_TEX = loadIceEffectTexture('frost-scar.png');
  const MIRROR_PILLAR_TEX = loadIceEffectTexture('mirror-pillar.png');
  const FROST_SPIKES_TEX = loadIceEffectTexture('frost-spikes.png');
  const FROST_DRAGON_SLAM_TEX = [
    loadIceEffectTexture('frost-dragon-slam-raise.png'),
    loadIceEffectTexture('frost-dragon-slam-impact.png'),
  ];
  const WISP_DISSOLVE_TEX = loadIceEffectTexture('frost-wisp-dissolve.png');
  const WISP_FOG_TEX = Array.from(
    { length: 4 },
    (_, index) => loadIceEffectTexture(`frost-wisp-fog-${index + 1}.png`)
  );
  const STORM_LIGHTNING_TEX = loadIceEffectTexture('storm-lightning.png');
  const STORM_TORNADO_TEX = loadIceEffectTexture('storm-tornado.png');
  const STORM_FEATHER_TEX = loadIceEffectTexture('storm-feather.png');
  const STORM_ROCK_TEX = loadCharacterTexture('storm-rock.png', null);
  const ABYSS_ROCK_TEX = loadCharacterTexture('abyss-rock.png', null);
  const BLACK_RUNE_BLOCK_TEX = loadCharacterTexture('black-rune-block.png', null);
  const BLACK_CURSE_RUNE_TEX = loadIceEffectTexture('black-curse-rune-field.png');
  const BLACK_CURSE_BULLET_TEX = loadIceEffectTexture('black-curse-bullet.png');
  const BLOOD_SLAVE_CLAW_TEX = loadIceEffectTexture('blood-slave-claw.png');
  const BLOOD_SLAVE_POOL_TEX = loadIceEffectTexture('blood-slave-pool.png');
  const BLACK_MIST_BULLET_TEX = loadIceEffectTexture('black-mist-bullet.png');
  const BLACK_WIZARD_CURSE_MARK_TEX = loadIceEffectTexture('black-wizard-curse-mark.png');
  const BLACK_WIZARD_CURSE_FIELD_TEX = loadIceEffectTexture('black-wizard-curse-field.png');
  const BLACK_WIZARD_CAST_TEX = loadIceEffectTexture('black-wizard-cast.png');
  const BLACK_WIZARD_SUMMON_TEX = loadIceEffectTexture('black-wizard-summon.png');
  const BLACK_WIZARD_SHADOW_ARROW_TEX = loadIceEffectTexture('black-wizard-shadow-arrow.png');

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

  // 第四章动态冰柱：每个实例占纵向 1×2 格，由计时器按波次追加。
  const icePillarMeshes = [];
  const ICE_BLOCK_TEX = loadCharacterTexture('ice-block.png', null);
  const ICE_PILLAR_TEX = loadCharacterTexture('ice-pillar.png', null);
  {
    const geo = new THREE.PlaneGeometry(1.48, 2.08);
    for (let k = 0; k < ICE_MAX_PILLARS; k++) {
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          map: ICE_PILLAR_TEX || null,
          color: ICE_PILLAR_TEX ? 0xffffff : 0x8bdcff,
          transparent: true,
          opacity: 0.98,
          depthWrite: false,
          fog: false,
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.34;
      mesh.visible = false;
      mesh.renderOrder = 2;
      scene.add(mesh);
      icePillarMeshes.push(mesh);
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

  /** 第四章：8 组固定 2×2 冰川块，另有纵向 1×2 冰柱由计时器生成。 */
  function layoutFrozen(level) {
    const seeds = [];
    const fits = (i, j) => {
      if (i < 4 || j < 4 || i > N - 6 || j > N - 6) return false;
      if (Math.abs(i - 22) < 6 && j < 9) return false;
      if (Math.abs(i - 22) < 7 && j > 32) return false;
      if (Math.abs(i - 22) < 7 && Math.abs(j - 22) < 7) return false;
      if (level === 24 && i < 24 && Math.abs(j - START_ROOM.doorJ) < 5) return false;
      for (const [si, sj] of seeds) {
        if (Math.abs(si - i) < 7 && Math.abs(sj - j) < 7) return false;
      }
      return true;
    };
    let attempts = 0;
    while (seeds.length < FROZEN_OBSTACLE_COUNT && attempts++ < 600) {
      const i = 4 + randInt(N - 10);
      const j = 4 + randInt(N - 10);
      if (!fits(i, j)) continue;
      seeds.push([i, j]);
    }
    placeObstacles(seeds, ICE_BLOCK_TEX);
    clearIceObstacles();
  }

  /** 第五章：固定 8 组 2×2 风暴岩石，避开出生区、传送门与 Boss 王座。 */
  function layoutStorm(level) {
    const seeds = [];
    const fits = (i, j) => {
      if (i < 4 || j < 4 || i > N - 6 || j > N - 6) return false;
      if (Math.abs(i - 22) < 6 && j < 9) return false;
      if (Math.abs(i - 22) < 7 && j > 32) return false;
      if (Math.abs(i - 22) < 7 && Math.abs(j - 22) < 7) return false;
      if (level === 32 && i < 24 && Math.abs(j - START_ROOM.doorJ) < 5) return false;
      for (const [si, sj] of seeds) {
        if (Math.abs(si - i) < 7 && Math.abs(sj - j) < 7) return false;
      }
      return true;
    };
    let attempts = 0;
    while (seeds.length < STORM_OBSTACLE_COUNT && attempts++ < 600) {
      const i = 4 + randInt(N - 10);
      const j = 4 + randInt(N - 10);
      if (!fits(i, j)) continue;
      seeds.push([i, j]);
    }
    placeObstacles(seeds, STORM_ROCK_TEX);
    clearIceObstacles();
    clearStormArena();
  }

  const ABYSS_OBSTACLE_LAYOUTS = [
    // 6-1 裂隙外缘：两翼礁石把入口视线引向中央。
    [[7, 33], [14, 31], [28, 33], [35, 31], [10, 20], [16, 18], [29, 20], [35, 18]],
    // 6-2 无声礁廊：断续横向门洞，保留中轴追击路线。
    [[7, 28], [13, 25], [19, 31], [25, 31], [31, 26], [37, 23], [12, 14], [32, 12]],
    // 6-3 蜱巢裂口：外圈碎岩包围四处短促折返区。
    [[8, 7], [16, 9], [28, 7], [36, 10], [9, 25], [16, 29], [29, 29], [36, 24]],
    // 6-4 噬魂深井：八方围合但不封死中心的井状礁阵。
    [[10, 13], [34, 13], [10, 32], [34, 32], [22, 11], [22, 33], [14, 22], [30, 22]],
    // 6-5 三叉裂隙：三条斜向通道在中心外围分流后重新汇合。
    [[15, 13], [27, 13], [8, 21], [34, 21], [15, 30], [27, 30], [22, 7], [22, 37]],
    // 6-6 噬光坑道：上下交错的双排礁石形成连续换线。
    [[8, 17], [16, 17], [29, 17], [37, 17], [8, 28], [16, 28], [29, 28], [37, 28]],
    // 6-7 影主前庭：四角掩体与四面门柱，中央通往影主王座。
    [[11, 11], [31, 11], [11, 32], [31, 32], [22, 9], [22, 34], [7, 22], [36, 22]],
    // 6-8 深渊影主：中心 12×12 完全净空，礁石只切成四个斜向掩体。
    [[8, 8], [34, 8], [8, 34], [34, 34], [14, 14], [28, 14], [14, 28], [28, 28]],
  ];

  /** 第六章：固定 8 组 2×2 深渊礁石，入口、出口与影主中心保持净空。 */
  function layoutAbyss(level) {
    const localLevel = Math.max(0, Math.min(
      ABYSS_OBSTACLE_LAYOUTS.length - 1,
      level - ABYSS_LEVEL_BASE
    ));
    const seeds = ABYSS_OBSTACLE_LAYOUTS[localLevel]
      .slice(0, ABYSS_OBSTACLE_COUNT)
      .map(([i, j]) => [i, j]);
    placeObstacles(seeds, ABYSS_ROCK_TEX);
    clearIceObstacles();
    clearStormArena();
  }

  const BLACK_GORGE_OBSTACLE_LAYOUTS = [
    // 7-1: broken ritual ring; central duel and both doors stay open.
    [[8, 8], [35, 8], [8, 34], [35, 34], [14, 18], [29, 18], [14, 27], [29, 27]],
    // 7-2: two hunting lanes with side alcoves for the Blood Slave charge.
    [[6, 13], [37, 13], [6, 29], [37, 29], [15, 15], [28, 15], [15, 31], [28, 31]],
    // 7-3: mist gates split the arena without closing the north-south route.
    [[5, 19], [10, 19], [16, 19], [27, 19], [33, 19], [38, 19], [22, 6], [22, 35]],
    // 7-4: four corner pylons and an empty central court for the wizard's rays.
    [[6, 6], [37, 6], [6, 37], [37, 37], [14, 11], [29, 11], [14, 32], [29, 32]],
  ];

  /** Chapter 7: four fixed 2x2 rune layouts, always eight groups. */
  function layoutBlackGorge(level) {
    const localLevel = Math.max(0, Math.min(
      BLACK_GORGE_OBSTACLE_LAYOUTS.length - 1,
      level - BLACK_GORGE_LEVEL_BASE
    ));
    const seeds = BLACK_GORGE_OBSTACLE_LAYOUTS[localLevel]
      .slice(0, BLACK_GORGE_OBSTACLE_COUNT)
      .map(([i, j]) => [i, j]);
    placeObstacles(seeds, BLACK_RUNE_BLOCK_TEX);
    clearIceObstacles();
    clearStormArena();
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
  shieldHalo.scale.set(SHIELD_HALO_SCALE_X, SHIELD_HALO_SCALE_Y, 1);
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
  for (let i = 0; i < MAX_ENEMIES; i++) {
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
  const wolfEyeGeo = new THREE.CircleGeometry(0.1, 18);
  const wolfEyes = [];
  const wispEyeGeo = new THREE.CircleGeometry(0.1, 18);
  const wispEyes = [];
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

    const wolfEyePair = [-0.72, -0.45].map((x) => {
      const eye = new THREE.Mesh(
        wolfEyeGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.98,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      );
      eye.position.set(x, -0.2, 0.08);
      eye.visible = false;
      enemyPool[i].add(eye);
      return eye;
    });
    wolfEyes.push(wolfEyePair);

    const wispEyePair = [-0.46, -0.13].map((x) => {
      const eye = new THREE.Mesh(
        wispEyeGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.98,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      );
      eye.position.set(x, -0.16, 0.08);
      eye.visible = false;
      enemyPool[i].add(eye);
      return eye;
    });
    wispEyes.push(wispEyePair);
  }

  const effectPlaneGeo = new THREE.PlaneGeometry(1, 1);
  const wolfTelegraphPool = [];
  for (let i = 0; i < 8; i++) {
    const group = new THREE.Group();
    const bars = [];
    for (let barIndex = 0; barIndex < 4; barIndex++) {
      const bar = new THREE.Mesh(
        effectPlaneGeo,
        new THREE.MeshBasicMaterial({
          color: 0xb9f6ff,
          transparent: true,
          opacity: 0.52,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
        })
      );
      bar.rotation.x = -Math.PI / 2;
      bar.position.set(0, 0.18, (barIndex - 1.5) * 0.28);
      group.add(bar);
      bars.push(bar);
    }
    group.visible = false;
    group.userData.bars = bars;
    scene.add(group);
    wolfTelegraphPool.push(group);
  }

  const createAdditiveEffectPool = (count, texture, tint, opacity, geometry = effectPlaneGeo) => {
    const pool = [];
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const plane = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          map: texture || null,
          color: texture ? tint : 0x9fe9ff,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
          toneMapped: false,
        })
      );
      plane.rotation.x = -Math.PI / 2;
      group.add(plane);
      group.userData.plane = plane;
      group.visible = false;
      scene.add(group);
      pool.push(group);
    }
    return pool;
  };
  const wolfClawBurstPool = createAdditiveEffectPool(8, WOLF_CLAW_TEX, 0xd8fbff, 0.94);
  const frostMistPool = createAdditiveEffectPool(10, FROST_MIST_TEX, 0xc8f5ff, 0.72);
  const wispFogPool = createAdditiveEffectPool(48, WISP_FOG_TEX[0], 0xc1f1f8, 0.42);
  const wispDissolvePool = createAdditiveEffectPool(
    12,
    WISP_DISSOLVE_TEX,
    0xbfefff,
    0.86,
    new THREE.PlaneGeometry(3.2, 3.2)
  );
  const wispWarningPool = Array.from(
    { length: 16 },
    () => createDragonBeamRig(DRAGON_BREATH_RAY_TEX, 0.58, 0xd8fbff)
  );
  const thinIcePool = [];
  for (let i = 0; i < 64; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.14, 1.14),
      new THREE.MeshBasicMaterial({
        map: WOLF_FROST_TILE_TEX || null,
        color: WOLF_FROST_TILE_TEX ? 0xffffff : 0xcaf3ff,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.16;
    mesh.renderOrder = 2;
    mesh.visible = false;
    mesh.userData.plane = mesh;
    scene.add(mesh);
    thinIcePool.push(mesh);
  }
  const wispSpikePool = [];
  for (let i = 0; i < 24; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(WISP_ORB_RADIUS, 14, 10),
      new THREE.MeshStandardMaterial({
        color: 0xaeeeff,
        emissive: 0x34baff,
        emissiveIntensity: 2.1,
        roughness: 0.18,
        metalness: 0.06,
      })
    );
    mesh.visible = false;
    scene.add(mesh);
    wispSpikePool.push(mesh);
  }

  const stormWarningPool = [];
  for (let i = 0; i < 8; i++) {
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        color: 0xffd36a,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        fog: false,
        blending: THREE.AdditiveBlending,
      })
    );
    plane.rotation.x = -Math.PI / 2;
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2, 2)),
      new THREE.LineBasicMaterial({
        color: 0xfff1b0,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        fog: false,
      })
    );
    border.rotation.x = -Math.PI / 2;
    group.add(plane, border);
    group.userData.plane = plane;
    group.userData.border = border;
    group.visible = false;
    scene.add(group);
    stormWarningPool.push(group);
  }

  const stormLightningPool = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.25, 6.4),
      new THREE.MeshBasicMaterial({
        map: STORM_LIGHTNING_TEX || null,
        color: STORM_LIGHTNING_TEX ? 0xffffff : 0xbcefff,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.34;
    mesh.renderOrder = 6;
    mesh.visible = false;
    scene.add(mesh);
    stormLightningPool.push(mesh);
  }

  const stormTornadoPool = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(STORM_TORNADO_SIZE * 1.24, STORM_TORNADO_SIZE * 2.13),
      new THREE.MeshBasicMaterial({
        map: STORM_TORNADO_TEX || null,
        color: STORM_TORNADO_TEX ? 0xffffff : 0xaedfff,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.3;
    mesh.renderOrder = 5;
    mesh.visible = false;
    scene.add(mesh);
    stormTornadoPool.push(mesh);
  }

  const stormBoltPool = [];
  for (let i = 0; i < 32; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0xd8f7ff,
        emissive: 0x43b8ff,
        emissiveIntensity: 2.6,
        roughness: 0.2,
      })
    );
    mesh.visible = false;
    scene.add(mesh);
    stormBoltPool.push(mesh);
  }

  const stormFeatherPool = [];
  for (let i = 0; i < 192; i++) {
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.51),
      new THREE.MeshBasicMaterial({
        map: STORM_FEATHER_TEX || null,
        color: STORM_FEATHER_TEX ? 0xffffff : 0x74ddff,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
      })
    );
    plane.rotation.x = -Math.PI / 2;
    group.add(plane);
    group.userData.featherPlane = plane;
    group.visible = false;
    scene.add(group);
    stormFeatherPool.push(group);
  }

  // ---------- 子弹 ----------
  const abyssTeleportMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: null,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
      blending: THREE.NormalBlending,
    })
  );
  abyssTeleportMesh.rotation.x = -Math.PI / 2;
  abyssTeleportMesh.position.y = 0.64;
  abyssTeleportMesh.renderOrder = 6;
  abyssTeleportMesh.visible = false;
  scene.add(abyssTeleportMesh);

  const abyssBulletPool = [];
  for (let i = 0; i < 24; i++) {
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(
        ABYSS_LORD_BULLET_VISUAL_SIZE,
        ABYSS_LORD_BULLET_VISUAL_SIZE
      ),
      new THREE.MeshBasicMaterial({
        map: ABYSS_BULLET_TEX || null,
        color: ABYSS_BULLET_TEX ? 0xffffff : 0xa93cff,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
      })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.x = -ABYSS_LORD_BULLET_HEAD_OFFSET;
    group.add(plane);
    group.visible = false;
    scene.add(group);
    abyssBulletPool.push(group);
  }

  const abyssAfterimagePool = [];
  for (let i = 0; i < 32; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ABYSS_LORD_AFTERIMAGE_SIZE, ABYSS_LORD_AFTERIMAGE_SIZE),
      new THREE.MeshBasicMaterial({
        map: ABYSS_BULLET_AFTERIMAGE_TEX || null,
        color: ABYSS_BULLET_AFTERIMAGE_TEX ? 0xffffff : 0x9a35ff,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.13;
    mesh.renderOrder = 3;
    mesh.visible = false;
    scene.add(mesh);
    abyssAfterimagePool.push(mesh);
  }

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

  const fireBulletPool = [];
  for (let i = 0; i < 14; i++) {
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(FIRE_BULLET_IMAGE_WIDTH, FIRE_BULLET_IMAGE_HEIGHT),
      new THREE.MeshBasicMaterial({
        map: FIRE_BULLET_TEX || null,
        color: FIRE_BULLET_TEX ? 0xffffff : 0xff8b3d,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
      })
    );
    plane.rotation.x = -Math.PI / 2;
    // The flame head sits at the right edge of the source image.
    plane.position.x = -FIRE_BULLET_IMAGE_WIDTH * 0.34;
    group.add(plane);
    group.userData.firePlane = plane;
    group.visible = false;
    scene.add(group);
    fireBulletPool.push(group);
  }

  const fireTrailPool = [];
  for (let i = 0; i < 40; i++) {
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.6),
      new THREE.MeshBasicMaterial({
        map: FIRE_BULLET_TEX || null,
        color: 0xff8f4a,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
        toneMapped: false,
      })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.x = -0.14;
    group.add(plane);
    group.userData.trailPlane = plane;
    group.visible = false;
    scene.add(group);
    fireTrailPool.push(group);
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

  const frostSlamBulletPool = [];
  for (let i = 0; i < DRAGON_SLAM_BULLET_POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 12, 9),
      new THREE.MeshStandardMaterial({
        color: 0xbcefff,
        emissive: 0x36b9ff,
        emissiveIntensity: 2.25,
        roughness: 0.22,
      })
    );
    mesh.visible = false;
    scene.add(mesh);
    frostSlamBulletPool.push(mesh);
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

  const blackRunePool = [];
  for (let i = 0; i < 32; i++) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1.38, 4, 1),
      new THREE.MeshBasicMaterial({
        color: 0xff2e2a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.PI / 4;
    mesh.position.y = 0.14;
    mesh.visible = false;
    scene.add(mesh);
    blackRunePool.push(mesh);
  }

  const blackCurseRunePool = [];
  const blackCurseRuneGeo = new THREE.PlaneGeometry(
    BLACK_CURSE_RUNE_SIZE,
    BLACK_CURSE_RUNE_SIZE
  );
  blackCurseRuneGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(
      blackCurseRuneGeo,
      new THREE.MeshBasicMaterial({
        map: BLACK_CURSE_RUNE_TEX || null,
        color: BLACK_CURSE_RUNE_TEX ? 0xffffff : 0xff2925,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.13;
    mesh.visible = false;
    scene.add(mesh);
    blackCurseRunePool.push(mesh);
  }

  const blackCurseBulletPool = [];
  const blackCurseBulletGeo = new THREE.PlaneGeometry(6.2, 2.24);
  blackCurseBulletGeo.rotateX(-Math.PI / 2);
  blackCurseBulletGeo.translate(-2.8, 0, 0);
  for (let i = 0; i < 96; i++) {
    const mesh = new THREE.Mesh(
      blackCurseBulletGeo,
      new THREE.MeshBasicMaterial({
        map: BLACK_CURSE_BULLET_TEX || null,
        color: BLACK_CURSE_BULLET_TEX ? 0xffffff : 0xff2a24,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.42;
    mesh.visible = false;
    scene.add(mesh);
    blackCurseBulletPool.push(mesh);
  }

  const blackMistBulletPool = [];
  const blackMistBulletGeo = new THREE.PlaneGeometry(2.65, 2.7);
  blackMistBulletGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < BLACK_MIST_BULLET_POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(
      blackMistBulletGeo,
      new THREE.MeshBasicMaterial({
        map: BLACK_MIST_BULLET_TEX || null,
        color: BLACK_MIST_BULLET_TEX ? 0xffffff : 0xff2727,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.55;
    mesh.visible = false;
    scene.add(mesh);
    blackMistBulletPool.push(mesh);
  }

  const blackMistCloneMeshes = [];
  for (let i = 0; i < BLACK_MIST_CLONE_COUNT; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 5.4),
      new THREE.MeshBasicMaterial({
        map: BOSS_TEX.black_mist_servant || null,
        color: 0xffb0aa,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.62;
    mesh.scale.setScalar(2.05);
    mesh.visible = false;
    scene.add(mesh);
    blackMistCloneMeshes.push(mesh);
  }

  const blackWizardCurseFieldPool = [];
  const blackWizardCurseFieldGeo = new THREE.PlaneGeometry(
    BLACK_WIZARD_CURSE_FIELD_SIZE,
    BLACK_WIZARD_CURSE_FIELD_SIZE
  );
  blackWizardCurseFieldGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(
      blackWizardCurseFieldGeo,
      new THREE.MeshBasicMaterial({
        map: BLACK_WIZARD_CURSE_FIELD_TEX || null,
        color: BLACK_WIZARD_CURSE_FIELD_TEX ? 0xffffff : 0x8f1018,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.13;
    mesh.visible = false;
    scene.add(mesh);
    blackWizardCurseFieldPool.push(mesh);
  }
  const blackWizardFieldWarningGeo = new THREE.RingGeometry(4.62, 5, 96, 1);
  blackWizardFieldWarningGeo.rotateX(-Math.PI / 2);
  const blackWizardFieldWarningRing = new THREE.Mesh(
    blackWizardFieldWarningGeo,
    new THREE.MeshBasicMaterial({
      color: 0xff3838,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
  );
  blackWizardFieldWarningRing.position.y = 0.16;
  blackWizardFieldWarningRing.renderOrder = 3;
  blackWizardFieldWarningRing.visible = false;
  scene.add(blackWizardFieldWarningRing);

  const blackWizardArrowPool = [];
  const blackWizardArrowGeo = new THREE.PlaneGeometry(
    BLACK_WIZARD_ARROW_LENGTH,
    BLACK_WIZARD_ARROW_WIDTH
  );
  blackWizardArrowGeo.rotateX(-Math.PI / 2);
  blackWizardArrowGeo.translate(-BLACK_WIZARD_ARROW_LENGTH / 2, 0, 0);
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(
      blackWizardArrowGeo,
      new THREE.MeshBasicMaterial({
        map: BLACK_WIZARD_SHADOW_ARROW_TEX || null,
        color: BLACK_WIZARD_SHADOW_ARROW_TEX ? 0xffffff : 0x8b42ff,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.42;
    mesh.visible = false;
    scene.add(mesh);
    blackWizardArrowPool.push(mesh);
  }

  const blackWizardCurseMarks = [];
  const blackWizardCurseMarkGeo = new THREE.PlaneGeometry(0.92, 0.92);
  blackWizardCurseMarkGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < BLACK_WIZARD_MAX_CURSE; i++) {
    const mesh = new THREE.Mesh(
      blackWizardCurseMarkGeo,
      new THREE.MeshBasicMaterial({
        map: BLACK_WIZARD_CURSE_MARK_TEX || null,
        color: BLACK_WIZARD_CURSE_MARK_TEX ? 0xffffff : 0xff1d25,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.82;
    mesh.visible = false;
    scene.add(mesh);
    blackWizardCurseMarks.push(mesh);
  }

  const blackWizardSummonMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: BOSS_TEX.black_wizard || null,
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
  );
  blackWizardSummonMesh.rotation.x = -Math.PI / 2;
  blackWizardSummonMesh.position.y = 0.62;
  blackWizardSummonMesh.scale.setScalar(2.05);
  blackWizardSummonMesh.visible = false;
  scene.add(blackWizardSummonMesh);

  const blackPoolPool = [];
  for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.36, 36),
      new THREE.MeshBasicMaterial({
        color: 0x6f0508,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.1;
    mesh.visible = false;
    scene.add(mesh);
    blackPoolPool.push(mesh);
  }

  const bloodSlavePoolPool = [];
  const bloodSlavePoolGeo = new THREE.PlaneGeometry(
    BLOOD_SLAVE_POOL_RADIUS * 2,
    BLOOD_SLAVE_POOL_RADIUS * 2
  );
  bloodSlavePoolGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.Mesh(
      bloodSlavePoolGeo,
      new THREE.MeshBasicMaterial({
        map: BLOOD_SLAVE_POOL_TEX || null,
        color: BLOOD_SLAVE_POOL_TEX ? 0xffffff : 0x8f0508,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.12;
    mesh.visible = false;
    scene.add(mesh);
    bloodSlavePoolPool.push(mesh);
  }

  const bloodSlaveClawPool = [];
  const bloodSlaveClawGeo = new THREE.PlaneGeometry(10.5, 10.5);
  bloodSlaveClawGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(
      bloodSlaveClawGeo,
      new THREE.MeshBasicMaterial({
        map: BLOOD_SLAVE_CLAW_TEX || null,
        color: BLOOD_SLAVE_CLAW_TEX ? 0xffffff : 0xff1d1d,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.position.y = 0.22;
    mesh.visible = false;
    scene.add(mesh);
    bloodSlaveClawPool.push(mesh);
  }

  const bloodFilmRig = new THREE.Group();
  const bloodFilmDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.15, 64),
    new THREE.MeshBasicMaterial({
      color: 0x990006,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    })
  );
  bloodFilmDisc.rotation.x = -Math.PI / 2;
  bloodFilmDisc.position.y = 0.16;
  bloodFilmRig.add(bloodFilmDisc);
  const bloodFilmRings = [];
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.25 + i * 0.58, 0.08 - i * 0.018, 8, 64),
      new THREE.MeshBasicMaterial({
        color: i ? 0xff2b2b : 0xc00810,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        fog: false,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.3 + i * 0.04;
    bloodFilmRig.add(ring);
    bloodFilmRings.push(ring);
  }
  bloodFilmRig.visible = false;
  scene.add(bloodFilmRig);

  const bloodRageEyeRig = new THREE.Group();
  const bloodRageEyeMat = new THREE.MeshBasicMaterial({
    color: 0xff1f20,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    fog: false,
  });
  for (const x of [-0.34, 0.34]) {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), bloodRageEyeMat);
    eye.rotation.x = -Math.PI / 2;
    eye.position.set(x, 0.74, -0.18);
    bloodRageEyeRig.add(eye);
  }
  bloodRageEyeRig.visible = false;
  scene.add(bloodRageEyeRig);

  const blackBeamPool = [];
  for (let i = 0; i < 16; i++) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.translate(0.5, 0, 0);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xff312e,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.25;
    mesh.visible = false;
    scene.add(mesh);
    blackBeamPool.push(mesh);
  }

  const blackClones = [];
  for (let i = 0; i < 2; i++) {
    const material = new THREE.MeshBasicMaterial({
      map: BOSS_TEX.black_wizard || null,
      color: 0xff5b58,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.54;
    mesh.visible = false;
    scene.add(mesh);
    blackClones.push(mesh);
  }

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
  const bossBreathGeo = new THREE.PlaneGeometry(
    DRAGON_BREATH_RANGE,
    DRAGON_BREATH_RANGE * 2 * Math.tan(DRAGON_BREATH_HALF_ANGLE)
  );
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

  function createDragonBeamRig(texture, width, color) {
    const geometry = new THREE.PlaneGeometry(1, width);
    geometry.translate(0.5, 0, 0);
    const material = new THREE.MeshBasicMaterial({
      map: texture || null,
      color: texture ? color : 0x9feaff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.32;
    mesh.renderOrder = 5;
    const group = new THREE.Group();
    group.add(mesh);
    group.visible = false;
    scene.add(group);
    return group;
  }

  const frostLaserRigs = Array.from(
    { length: 4 },
    () => createDragonBeamRig(FROST_LASER_TEX, 3.05, 0xe6fbff)
  );
  const mirrorPillarMeshes = [];
  for (let i = 0; i < 2; i++) {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 3.15),
      new THREE.MeshBasicMaterial({
        map: MIRROR_PILLAR_TEX || null,
        color: MIRROR_PILLAR_TEX ? 0xffffff : 0x86e8ff,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.54;
    mesh.renderOrder = 3;
    group.add(mesh);
    group.visible = false;
    scene.add(group);
    mirrorPillarMeshes.push(group);
  }

  const frostScarPool = [];
  const mirrorRubblePool = [];
  const frostSpikePool = [];
  for (let i = 0; i < 260; i++) {
    const scar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 1.06),
      new THREE.MeshBasicMaterial({
        map: WOLF_FROST_TILE_TEX || FROST_SCAR_TEX || null,
        color: WOLF_FROST_TILE_TEX ? 0xcceeff : 0xb7e9ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    scar.rotation.x = -Math.PI / 2;
    scar.position.y = 0.12;
    scar.renderOrder = 2;
    scar.visible = false;
    scene.add(scar);
    frostScarPool.push(scar);
  }
  for (let i = 0; i < 24; i++) {
    const rubble = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.98),
      new THREE.MeshBasicMaterial({
        map: FROST_SCAR_TEX || null,
        color: 0xb8dced,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        fog: false,
      })
    );
    rubble.rotation.x = -Math.PI / 2;
    rubble.position.y = 0.105;
    rubble.renderOrder = 2;
    rubble.visible = false;
    scene.add(rubble);
    mirrorRubblePool.push(rubble);
  }
  for (let i = 0; i < 300; i++) {
    const spike = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 1.65),
      new THREE.MeshBasicMaterial({
        map: FROST_SPIKES_TEX || null,
        color: FROST_SPIKES_TEX ? 0xffffff : 0xc8f7ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      })
    );
    spike.rotation.x = -Math.PI / 2;
    spike.position.y = 0.3;
    spike.renderOrder = 4;
    spike.visible = false;
    scene.add(spike);
    frostSpikePool.push(spike);
  }

  const playerFrostRig = new THREE.Group();
  const frostBreathVisualWidth = FROST_SKILL_RANGE + 0.45;
  const playerFrostGeo = new THREE.PlaneGeometry(
    frostBreathVisualWidth,
    frostBreathVisualWidth * 2 * Math.tan(FROST_SKILL_HALF_ANGLE)
  );
  playerFrostGeo.translate(frostBreathVisualWidth / 2, 0, 0);
  const playerFrostMesh = new THREE.Mesh(
    playerFrostGeo,
    new THREE.MeshBasicMaterial({
      map: FROST_BREATH_CONE_TEX || null,
      color: FROST_BREATH_CONE_TEX ? 0xffffff : 0x8de9ff,
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

  const purpleHoleMeshes = Array.from({ length: 2 }, () => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 2.35),
      new THREE.MeshBasicMaterial({
        map: PURPLE_BLACK_HOLE_TEX || null,
        color: PURPLE_BLACK_HOLE_TEX ? 0xffffff : 0xb783ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.18;
    mesh.renderOrder = 3;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });

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
    storm_eagle: { id: 'speed', color: 0x9fe6ff, core: 0xf1fdff, emissive: 0x3b9cc5 },
    abyss_lord: { id: 'purple', color: 0xb783ff, core: 0xf0ddff, emissive: 0x7438d8 },
    black_curse_servant: { id: 'green', color: 0x68e7b8, core: 0xcaffea, emissive: 0x28b685 },
    blood_slave: { id: 'red', color: 0xff6542, core: 0xffd0a0, emissive: 0xd93a12 },
    black_mist_servant: { id: 'ice', color: 0x8de9ff, core: 0xe0fbff, emissive: 0x3fa6d9 },
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
    thinIce: [],
    wolfClawBursts: [],
    frostMistBursts: [],
    wispDissolves: [],
    mirrorPillars: [],
    mirrorRubble: [],
    frostScars: [],
    frostSpikeBursts: [],
    wispFogPatches: [],
    wispSpikes: [],
    stormWarnings: [],
    stormLightningStrikes: [],
    stormTornadoes: [],
    stormBolts: [],
    stormFeathers: [],
    stormLightningTimer: STORM_LIGHTNING_INTERVAL,
    stormSummon: null,
    stormIntroShown: false,
    abyssBullets: [],
    abyssAfterimages: [],
    blackRunes: [],
    blackCurseRunes: [],
    blackPools: [],
    blackBeamEffects: [],
    blackClones: [],
    blackMistClones: [],
    blackWizardCurseFields: [],
    blackWizardArrows: [],
    blackWizardSummon: null,
    bloodSlavePools: [],
    bloodSlaveClaws: [],
    lavaBalls: [],
    lavaPools: [],
    skillOrb: null,
    fireBursts: [],
    fireTrails: [],
    orbs: [],
    booms: [],
    energyCd: 0,
    shieldTimer: 0,
    shieldCooldown: 0,
    shieldFlash: 0,
    teleportCooldown: 0,
    teleportHoleTimer: 0,
    teleportHoles: [],
    teleportEmerging: false,
    speedBoostTimer: 0,
    speedCooldown: 0,
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
    shiftSkillHud: document.getElementById('shiftSkillHud'),
    shiftSkillName: document.getElementById('shiftSkillName'),
    shiftSkillDesc: document.getElementById('shiftSkillDesc'),
    shiftSkillState: document.getElementById('shiftSkillState'),
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
    icePillarMeshes.forEach((mesh) => {
      mesh.visible = false;
      mesh.scale.setScalar(1);
    });
  }

  function icePillarFits(cell, head) {
    if (!cell || !inBounds(cell.i, cell.j) || !inBounds(cell.i, cell.j + 1)) return false;
    const cells = [
      { i: cell.i, j: cell.j },
      { i: cell.i, j: cell.j + 1 },
    ];
    if (cells.some(({ i, j }) => isObstacle(i, j))) return false;
    if (cells.some(({ i, j }) => Math.abs(i - head.i) + Math.abs(j - head.j) < 4)) return false;
    if (cells.some(({ i, j }) => Math.abs(i - DOOR_CELL.i) < 4 && j < 5)) return false;
    if (cells.some(({ i, j }) => Math.abs(i - SPAWN_DOOR_CELL.i) < 4 && j > N - 6)) return false;
    if (cells.some(({ i, j }) => state.cells.some((c) => Math.abs(c.i - i) + Math.abs(c.j - j) < 2))) {
      return false;
    }
    if (cells.some(({ i, j }) => state.pellets.some((p) => p.i === i && p.j === j))) return false;
    if (cells.some(({ i, j }) => (
      state.enemies.some((e) => e.alive && Math.abs(e.i - i) + Math.abs(e.j - j) < 2)
    ))) return false;
    if (state.boss && state.boss.alive &&
      cells.some(({ i, j }) => Math.abs(i - BOSS_CELL.i) < 6 && Math.abs(j - BOSS_CELL.j) < 6)) {
      return false;
    }
    return true;
  }

  function spawnIceObstacle(forcedCell = null) {
    if (dynamicIce.size >= ICE_MAX_PILLARS * 2) return false;
    const mesh = icePillarMeshes.find((item) => !item.visible);
    if (!mesh) return false;
    const head = state.cells[0] || { i: HALF, j: HALF };
    let cell = forcedCell;
    if (!cell) {
      for (let tries = 0; tries < 500; tries++) {
        const candidate = { i: 3 + randInt(N - 6), j: 3 + randInt(N - 6) };
        if (!icePillarFits(candidate, head)) continue;
        cell = candidate;
        break;
      }
    }
    if (!icePillarFits(cell, head)) return false;
    const pillar = {
      i: cell.i,
      j: cell.j,
      cells: [cell.i, cell.j, cell.i, cell.j + 1],
      mesh,
      age: 0,
    };
    dynamicIce.set(`${cell.i},${cell.j}`, pillar);
    dynamicIce.set(`${cell.i},${cell.j + 1}`, pillar);
    mesh.visible = true;
    mesh.position.set(cellX(cell.i), 0.34, (cellZ(cell.j) + cellZ(cell.j + 1)) / 2);
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
    for (let k = 0; k < ice.cells.length; k += 2) {
      dynamicIce.delete(`${ice.cells[k]},${ice.cells[k + 1]}`);
    }
    return true;
  }

  function updateIceObstacles(dt) {
    for (const ice of new Set(dynamicIce.values())) {
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
    let spawned = 0;
    for (let k = 0; k < ICE_PILLARS_PER_WAVE; k++) {
      if (spawnIceObstacle()) spawned += 1;
    }
    if (spawned > 0) {
      toast('寒潮凝晶', `${spawned} 根双格冰柱破土而出 · 可用烈焰弹击碎`);
    }
  }

  function activateEnemySlot(slot, spawnType, i, j) {
    const spawnStats = enemyStats(spawnType);
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
      slowTimer: 0,
      splitTimer: spawnStats.splitInterval || 0,
      wolfState: 'stalk',
      wolfStateTimer: 0,
      wolfMode: 'wanderer',
      wolfWanderDir: randInt(8),
      wolfWanderTimer: 0.35 + Math.random() * 0.75,
      wolfLock: null,
      wolfPounceFrom: null,
      wolfPounceTarget: null,
      wolfPath: [],
      wolfPounceHitDone: false,
      wolfTelegraph: null,
      wolfStunTimer: 0,
      wispState: 'fog',
      wispStateTimer: WISP_FOG_TIME,
      wispMoveTimer: 0,
      wispDirections: [],
      wispWarnings: [],
      stormDashTimer: spawnStats.dashInterval || 0,
      stormDashActive: 0,
      stormPhase: Math.random() * Math.PI * 2,
      stormDiveState: 'idle',
      stormDiveTimer: 3.4 + Math.random() * 1.8,
      stormDiveFrom: null,
      stormDiveTarget: null,
      stormDiveElapsed: 0,
      stormDiveHit: false,
    });
    // 复用槽位时恢复当前类型的贴图与缩放。
    const idx = state.enemies.indexOf(slot);
    const mesh = idx >= 0 ? enemyPool[idx] : null;
    if (mesh) {
      mesh.material.map = TEX[spawnType] || null;
      mesh.material.color.setHex(0xffffff);
      mesh.material.opacity = 1;
      mesh.material.needsUpdate = true;
      mesh.scale.setScalar(enemyRenderScale(spawnType));
    }
    return slot;
  }

  function spawnEnemy(distFromHead = 10, isRespawn = false, forcedType = null) {
    const h = state.cells[0] || { i: HALF, j: HALF };
    const slot = state.enemies.find((e) => !e.alive);
    if (!slot) return;
    const spawnType = forcedType || (isRespawn ? chooseRespawnEnemyType() : (slot.type || 'spore'));
    for (let tries = 0; tries < 300; tries++) {
      const i = randInt(N), j = randInt(N);
      if (isObstacle(i, j)) continue;
      if (Math.abs(i - h.i) + Math.abs(j - h.j) < distFromHead) continue;
      if (state.enemies.some((e) => e.alive && e.i === i && e.j === j)) continue;
      const spawned = activateEnemySlot(slot, spawnType, i, j);
      if (isRespawn && spawned.type === 'obsidianBeetle') {
        spawnLavaHazard(cellX(i), cellZ(j));
      }
      return spawned;
    }
  }

  function findIceSlugSplitCell(parent) {
    const head = state.cells[0] || { i: HALF, j: HALF };
    const parentI = Math.round(parent.x + HALF);
    const parentJ = Math.round(parent.z + HALF);
    const offsets = [
      [1, 0], [1, 1], [0, 1], [-1, 1],
      [-1, 0], [-1, -1], [0, -1], [1, -1],
    ];
    const radii = [6, 7, 8, 9, 10];
    const fits = (i, j, minHeadDistance, minParentDistance = 0) => {
      if (!inBounds(i, j) || isObstacle(i, j)) return false;
      if (Math.abs(i - head.i) + Math.abs(j - head.j) < minHeadDistance) return false;
      if (Math.abs(i - parentI) + Math.abs(j - parentJ) < minParentDistance) return false;
      if (state.enemies.some((e) => e.alive && e.i === i && e.j === j)) return false;
      return true;
    };

    const radiusStart = randInt(radii.length);
    for (let radiusStep = 0; radiusStep < radii.length; radiusStep++) {
      const radius = radii[(radiusStart + radiusStep) % radii.length];
      const start = randInt(offsets.length);
      for (let step = 0; step < offsets.length; step++) {
        const [di, dj] = offsets[(start + step) % offsets.length];
        const i = parentI + di * radius;
        const j = parentJ + dj * radius;
        if (fits(i, j, 3, 6)) return { i, j };
      }
    }
    for (let tries = 0; tries < 200; tries++) {
      const i = randInt(N), j = randInt(N);
      if (fits(i, j, 6, 6)) return { i, j };
    }
    return null;
  }

  function spawnIceSlugChild(parent) {
    const slugCount = state.enemies.filter((enemy) => enemy.alive && enemy.type === 'iceSlug').length;
    if (slugCount >= ICE_SLUG_MAX_ACTIVE) return null;
    const slot = state.enemies.find((e) => !e.alive);
    if (!slot) return null;
    const cell = findIceSlugSplitCell(parent);
    if (!cell) return null;
    return activateEnemySlot(slot, 'iceSlug', cell.i, cell.j);
  }

  function hideWolfTelegraph(e) {
    if (!e || !e.wolfTelegraph) return;
    e.wolfTelegraph.visible = false;
    e.wolfTelegraph = null;
  }

  function showWolfTelegraph(e) {
    hideWolfTelegraph(e);
    const lock = e.wolfLock;
    if (!lock) return;
    const group = wolfTelegraphPool.find((item) => !item.visible);
    if (!group) return;
    const fromX = e.x;
    const fromZ = e.z;
    const toX = cellX(lock.i);
    const toZ = cellZ(lock.j);
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const length = Math.max(0.8, Math.hypot(dx, dz));
    group.position.set((fromX + toX) / 2, 0, (fromZ + toZ) / 2);
    group.rotation.y = Math.atan2(-dz, dx);
    for (let i = 0; i < group.userData.bars.length; i++) {
      const bar = group.userData.bars[i];
      bar.scale.set(length, 0.055 + (i % 2) * 0.018, 1);
      bar.material.opacity = 0.38 + i * 0.07;
    }
    group.visible = true;
    e.wolfTelegraph = group;
  }

  function spawnTimedEffect(pool, list, x, z, angle, size, life, opacity) {
    const group = pool.find((item) => !item.visible);
    if (!group) return null;
    group.visible = true;
    group.position.set(x, 0.2, z);
    group.rotation.y = angle;
    group.scale.setScalar(size);
    group.userData.plane.material.opacity = opacity;
    list.push({ group, life, maxLife: life, size, opacity });
    return group;
  }

  function spawnWolfClawBurst(x, z, angle, size = 3.2) {
    const group = spawnTimedEffect(wolfClawBurstPool, state.wolfClawBursts, x, z, angle, size, 0.38, 0.94);
    if (group) group.position.y = 0.62;
  }

  function spawnFrostMist(x, z, size = 2.1) {
    spawnTimedEffect(
      frostMistPool,
      state.frostMistBursts,
      x,
      z,
      Math.random() * Math.PI * 2,
      size,
      0.48,
      0.72
    );
  }

  function updateWolfCombatEffects(dt) {
    for (const list of [state.wolfClawBursts, state.frostMistBursts]) {
      for (let k = list.length - 1; k >= 0; k--) {
        const effect = list[k];
        effect.life -= dt;
        const progress = 1 - Math.max(0, effect.life / effect.maxLife);
        effect.group.scale.setScalar(effect.size * (0.82 + progress * 0.3));
        effect.group.userData.plane.material.opacity = effect.opacity * (1 - progress);
        if (effect.life <= 0) {
          effect.group.visible = false;
          list.splice(k, 1);
        }
      }
    }
  }

  function removeThinIce(ice) {
    if (!ice) return;
    ice.mesh.visible = false;
    const index = state.thinIce.indexOf(ice);
    if (index >= 0) state.thinIce.splice(index, 1);
  }

  function spawnThinIce(cells) {
    for (const cell of cells) {
      if (!inBounds(cell.i, cell.j)) continue;
      const existing = state.thinIce.find((ice) => ice.i === cell.i && ice.j === cell.j);
      if (existing) {
        existing.hits = 0;
        existing.mesh.userData.plane.material.opacity = 0.82;
        continue;
      }
      const mesh = thinIcePool.find((item) => !item.visible);
      if (!mesh) continue;
      mesh.visible = true;
      mesh.position.set(cellX(cell.i), 0.16, cellZ(cell.j));
      mesh.rotation.y = (Math.random() - 0.5) * 0.28;
      mesh.scale.setScalar(1);
      mesh.userData.plane.material.opacity = 0.82;
      state.thinIce.push({ i: cell.i, j: cell.j, mesh, hits: 0, phase: Math.random() * 6.28 });
    }
  }

  function triggerThinIceAt(i, j) {
    const ice = state.thinIce.find((item) => item.i === i && item.j === j);
    if (!ice) return;
    ice.hits += 1;
    if (ice.hits < 2) {
      ice.mesh.userData.plane.material.opacity = 0.46;
      ice.mesh.scale.set(1.12, 0.92, 1.12);
      spawnFrostMist(cellX(i), cellZ(j), 0.8);
      return;
    }
    removeThinIce(ice);
    spawnFrostMist(cellX(i), cellZ(j), 1.15);
    state.slowTimer = Math.max(state.slowTimer, THIN_ICE_SLOW_TIME);
    damage(1, 'hazard');
  }

  function updateThinIce() {
    for (const ice of state.thinIce) {
      const pulse = 1.04 + Math.sin(state.time * 3.8 + ice.phase) * 0.045;
      ice.mesh.scale.set(pulse, pulse, pulse);
      ice.mesh.userData.plane.material.opacity = ice.hits === 0
        ? 0.76 + Math.sin(state.time * 4.4 + ice.phase) * 0.07
        : 0.34 + Math.sin(state.time * 7 + ice.phase) * 0.05;
    }
  }

  function clearWolfCombatEffects() {
    state.enemies.forEach(hideWolfTelegraph);
    wolfTelegraphPool.forEach((group) => { group.visible = false; });
    for (const list of [state.wolfClawBursts, state.frostMistBursts]) {
      list.forEach((effect) => { effect.group.visible = false; });
      list.length = 0;
    }
    state.thinIce.forEach((ice) => { ice.mesh.visible = false; });
    state.thinIce.length = 0;
  }

  function clearWispCombatEffects() {
    state.enemies.forEach(hideWispWarnings);
    wispWarningPool.forEach((rig) => { rig.visible = false; });
    state.wispFogPatches.forEach((patch) => { patch.group.visible = false; });
    state.wispFogPatches.length = 0;
    state.wispDissolves.forEach((effect) => { effect.group.visible = false; });
    state.wispDissolves.length = 0;
    wispDissolvePool.forEach((group) => { group.visible = false; });
    state.wispSpikes.forEach((spike) => { spike.mesh.visible = false; });
    state.wispSpikes.length = 0;
  }

  function wolfPathBetween(fromI, fromJ, toI, toJ) {
    const path = [{ i: fromI, j: fromJ }];
    let i = fromI;
    let j = fromJ;
    const di = Math.sign(toI - fromI);
    const dj = Math.sign(toJ - fromJ);
    for (let guard = 0; guard < 8; guard++) {
      if (i === toI && j === toJ) break;
      i += di;
      j += dj;
      path.push({ i, j });
    }
    return path;
  }

  function maintainWolfChasers() {
    const head = state.cells[0];
    if (!head) return;
    const wolves = state.enemies.filter((e) => e.alive && e.type === 'frostWolf');
    if (wolves.length === 0) return;
    const distanceSq = (wolf) => {
      const dx = wolf.x - cellX(head.i);
      const dz = wolf.z - cellZ(head.j);
      return dx * dx + dz * dz;
    };

    for (const wolf of wolves) {
      if (wolf.wolfMode !== 'chaser') wolf.wolfMode = 'wanderer';
    }
    let chasers = wolves.filter((wolf) => wolf.wolfMode === 'chaser');
    if (chasers.length > WOLF_CHASER_COUNT) {
      chasers.sort((a, b) => distanceSq(a) - distanceSq(b));
      for (const wolf of chasers.slice(WOLF_CHASER_COUNT)) {
        wolf.wolfMode = 'wanderer';
        wolf.wolfWanderTimer = 0;
      }
      chasers = chasers.slice(0, WOLF_CHASER_COUNT);
    }
    if (chasers.length < WOLF_CHASER_COUNT) {
      const candidates = wolves
        .filter((wolf) => wolf.wolfMode !== 'chaser')
        .sort((a, b) => distanceSq(a) - distanceSq(b));
      while (chasers.length < WOLF_CHASER_COUNT && candidates.length > 0) {
        const wolf = candidates.shift();
        wolf.wolfMode = 'chaser';
        chasers.push(wolf);
      }
    }
  }

  function tryStartWolfCharge(e, detectionRange = WOLF_POUNCE_RANGE) {
    const head = state.cells[0];
    if (!head) return false;
    const wi = Math.round(e.x + HALF);
    const wj = Math.round(e.z + HALF);
    const di = head.i - wi;
    const dj = head.j - wj;
    if (di === 0 && dj === 0) return false;
    if (di !== 0 && dj !== 0 && Math.abs(di) !== Math.abs(dj)) return false;
    const steps = Math.max(Math.abs(di), Math.abs(dj));
    if (steps > detectionRange) return false;
    const stepI = Math.sign(di);
    const stepJ = Math.sign(dj);
    for (let step = 1; step < steps; step++) {
      if (isObstacle(wi + stepI * step, wj + stepJ * step)) return false;
    }
    e.wolfState = 'charge';
    e.wolfStateTimer = WOLF_CHARGE_TIME;
    e.wolfPounceHitDone = false;
    e.wolfLock = { i: head.i, j: head.j };
    e.wolfPath = wolfPathBetween(wi, wj, head.i, head.j);
    showWolfTelegraph(e);
    return true;
  }

  function moveFrostWolfWander(e, mesh, dt) {
    const stats = enemyStats(e.type);
    const speed = stats.speed * WOLF_WANDER_SPEED_MUL *
      (e.speedMul === undefined ? 1 : e.speedMul) * enemySpeedFactor(e);
    const directions = [
      [1, 0], [1, 1], [0, 1], [-1, 1],
      [-1, 0], [-1, -1], [0, -1], [1, -1],
    ];
    e.wolfWanderTimer = (e.wolfWanderTimer ?? 0) - dt;
    if (e.wolfWanderTimer <= 0) {
      e.wolfWanderDir = randInt(directions.length);
      e.wolfWanderTimer = 0.45 + Math.random() * 0.8;
    }

    const validMoves = [];
    const head = state.cells[0];
    const currentDistance = head
      ? Math.hypot(e.x - cellX(head.i), e.z - cellZ(head.j))
      : Infinity;
    const startDir = e.wolfWanderDir || 0;
    for (let attempt = 0; attempt < directions.length; attempt++) {
      const directionIndex = (startDir + attempt) % directions.length;
      const [dx, dz] = directions[directionIndex];
      const length = Math.hypot(dx, dz) || 1;
      const nx = e.x + (dx / length) * speed * dt;
      const nz = e.z + (dz / length) * speed * dt;
      const ci = Math.round(nx + HALF);
      const cj = Math.round(nz + HALF);
      if (!inBounds(ci, cj) || isObstacle(ci, cj)) continue;
      if (state.cells.some((cell) => cell.i === ci && cell.j === cj)) continue;
      if (state.enemies.some((other) => other !== e && other.alive && other.i === ci && other.j === cj)) continue;
      const nextDistance = head
        ? Math.hypot(nx - cellX(head.i), nz - cellZ(head.j))
        : Infinity;
      validMoves.push({
        x: nx,
        z: nz,
        i: ci,
        j: cj,
        directionIndex,
        distanceGain: nextDistance - currentDistance,
      });
    }
    let best = null;
    if (validMoves.length > 0) {
      const roamingMoves = currentDistance < 12
        ? validMoves.filter((move) => move.distanceGain >= -0.35)
        : validMoves;
      const choices = roamingMoves.length > 0 ? roamingMoves : validMoves;
      best = choices[randInt(choices.length)];
    }
    if (best) {
      e.x = best.x;
      e.z = best.z;
      e.i = best.i;
      e.j = best.j;
      e.wolfWanderDir = best.directionIndex;
    } else {
      e.wolfWanderTimer = 0;
    }

    mesh.material.color.setHex(0xffffff);
    mesh.position.set(e.x, 0.5 + Math.sin(state.time * 3.2 + e.bob) * 0.045, e.z);
    mesh.rotation.z = Math.sin(state.time * 2 + e.bob) * 0.09;
    if (bodyDistanceSq(e.x, e.z) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
      e.cool = stats.contactCooldown;
      damage(stats.contactDamage, 'contact');
    }
  }

  function moveFrostWolfTowardSnake(e, mesh, target, dt) {
    const stats = enemyStats(e.type);
    const speed = stats.speed * (e.speedMul === undefined ? 1 : e.speedMul) * enemySpeedFactor(e);
    const targetX = cellX(target.i);
    const targetZ = cellZ(target.j);
    const directions = [
      [1, 0], [1, 1], [0, 1], [-1, 1],
      [-1, 0], [-1, -1], [0, -1], [1, -1],
    ];
    let best = null;
    let bestScore = Infinity;
    for (const [dx, dz] of directions) {
      const len = Math.hypot(dx, dz) || 1;
      const nx = e.x + (dx / len) * speed * dt;
      const nz = e.z + (dz / len) * speed * dt;
      const ci = Math.round(nx + HALF);
      const cj = Math.round(nz + HALF);
      if (!inBounds(ci, cj) || isObstacle(ci, cj)) continue;
      if (state.cells.some((cell) => cell.i === ci && cell.j === cj)) continue;
      const score = Math.hypot(targetX - nx, targetZ - nz);
      if (score < bestScore) {
        bestScore = score;
        best = { x: nx, z: nz, i: ci, j: cj };
      }
    }
    if (best) {
      e.x = best.x;
      e.z = best.z;
      e.i = best.i;
      e.j = best.j;
    }
    mesh.position.set(e.x, 0.5 + Math.sin(state.time * 4 + e.bob) * 0.04, e.z);
    mesh.rotation.z = Math.sin(state.time * 2 + e.bob) * 0.08;
    if (bodyDistanceSq(e.x, e.z) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
      e.cool = stats.contactCooldown;
      damage(stats.contactDamage, 'contact');
    }
  }

  function wolfPounceTouchesSnake(e) {
    const collisionRadiusSq = WOLF_POUNCE_HIT_RADIUS * WOLF_POUNCE_HIT_RADIUS;
    const path = e.wolfPath && e.wolfPath.length > 1
      ? e.wolfPath.slice(1)
      : [{ i: e.i, j: e.j }];
    for (const point of path) {
      if (bodyDistanceSq(cellX(point.i), cellZ(point.j)) <= collisionRadiusSq) return true;
    }
    return bodyDistanceSq(e.x, e.z) <= collisionRadiusSq;
  }

  function finishWolfPounce(e) {
    const path = e.wolfPath || [];
    spawnWolfClawBurst(e.x, e.z, Math.atan2(-(e.wolfPounceTarget.z - e.wolfPounceFrom.z),
      e.wolfPounceTarget.x - e.wolfPounceFrom.x), 2.4 + path.length * 0.45);
    spawnThinIce(path.slice(-2));
    const hit = e.wolfPounceHitDone || wolfPounceTouchesSnake(e);
    if (hit) {
      e.cool = enemyStats(e.type).contactCooldown;
      if (!e.wolfPounceHitDone) damage(1, 'contact');
      e.wolfState = 'stalk';
      e.wolfStateTimer = 0;
    } else {
      e.wolfState = 'stun';
      e.wolfStateTimer = WOLF_STUN_TIME;
      e.wolfStunTimer = WOLF_STUN_TIME;
      spawnFrostMist(e.x, e.z, 2.5);
    }
    e.wolfLock = null;
    e.wolfPounceFrom = null;
    e.wolfPounceTarget = null;
    e.wolfPath = [];
    e.wolfPounceHitDone = false;
  }

  function updateFrostWolf(e, mesh, target, dt) {
    if (!e.wolfState) e.wolfState = 'stalk';
    if (!e.wolfMode) e.wolfMode = 'wanderer';
    if (e.wolfState === 'charge') {
      e.wolfStateTimer -= dt;
      if (e.wolfTelegraph) {
        const opacity = 0.62 + Math.sin(state.time * 18) * 0.2;
        for (const bar of e.wolfTelegraph.userData.bars) {
          bar.material.opacity = opacity;
        }
      }
      if (e.wolfStateTimer <= 0) {
        hideWolfTelegraph(e);
        e.wolfState = 'pounce';
        e.wolfStateTimer = WOLF_POUNCE_TIME;
        e.wolfPounceHitDone = false;
        e.wolfPounceFrom = { x: e.x, z: e.z };
        e.wolfPounceTarget = { x: cellX(e.wolfLock.i), z: cellZ(e.wolfLock.j) };
      }
      mesh.material.color.setHex(0xffffff);
      mesh.position.set(e.x, 0.54 + Math.sin(state.time * 22) * 0.05, e.z);
      return;
    }

    if (e.wolfState === 'pounce') {
      e.wolfStateTimer = Math.max(0, e.wolfStateTimer - dt);
      const progress = 1 - e.wolfStateTimer / WOLF_POUNCE_TIME;
      const eased = progress * progress * (3 - 2 * progress);
      e.x = e.wolfPounceFrom.x + (e.wolfPounceTarget.x - e.wolfPounceFrom.x) * eased;
      e.z = e.wolfPounceFrom.z + (e.wolfPounceTarget.z - e.wolfPounceFrom.z) * eased;
      e.i = Math.round(e.x + HALF);
      e.j = Math.round(e.z + HALF);
      mesh.material.color.setHex(0xffffff);
      mesh.position.set(e.x, 0.62 + Math.sin(progress * Math.PI) * 0.42, e.z);
      if (!e.wolfPounceHitDone &&
        bodyDistanceSq(e.x, e.z) <= WOLF_POUNCE_HIT_RADIUS * WOLF_POUNCE_HIT_RADIUS) {
        e.wolfPounceHitDone = true;
        e.cool = enemyStats(e.type).contactCooldown;
        damage(1, 'contact');
        if (state.over) return;
      }
      if (e.wolfStateTimer <= 0) finishWolfPounce(e);
      return;
    }

    if (e.wolfState === 'stun') {
      e.wolfStateTimer = Math.max(0, e.wolfStateTimer - dt);
      e.wolfStunTimer = e.wolfStateTimer;
      mesh.material.color.setHex(0x777b80);
      mesh.position.set(e.x, 0.42, e.z);
      mesh.rotation.z = Math.sin(state.time * 18) * 0.02;
      if (e.wolfStateTimer <= 0) {
        e.wolfState = 'stalk';
        e.wolfStunTimer = 0;
      }
      return;
    }

    mesh.material.color.setHex(0xffffff);
    const detectionRange = e.wolfMode === 'chaser'
      ? WOLF_POUNCE_RANGE
      : WOLF_WANDER_DETECTION_RANGE;
    if (tryStartWolfCharge(e, detectionRange)) return;
    if (e.wolfMode === 'chaser') moveFrostWolfTowardSnake(e, mesh, target, dt);
    else moveFrostWolfWander(e, mesh, dt);
  }

  function hideWispWarnings(e) {
    if (!e || !e.wispWarnings) return;
    e.wispWarnings.forEach((warning) => { warning.visible = false; });
    e.wispWarnings.length = 0;
  }

  function spawnWispWarnings(e) {
    hideWispWarnings(e);
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    for (let i = directions.length - 1; i > 0; i--) {
      const swap = randInt(i + 1);
      [directions[i], directions[swap]] = [directions[swap], directions[i]];
    }
    e.wispDirections = directions.slice(0, 2);
    for (const angle of e.wispDirections) {
      const warning = wispWarningPool.find((rig) => !rig.visible);
      if (!warning) continue;
      warning.visible = true;
      warning.position.set(e.x, 0, e.z);
      warning.rotation.y = Math.atan2(-Math.sin(angle), Math.cos(angle));
      warning.scale.set(5.2, 1, 1);
      warning.children[0].material.opacity = 0.34;
      e.wispWarnings.push(warning);
    }
  }

  function spawnWispFogAt(i, j) {
    const existing = state.wispFogPatches.find((patch) => patch.i === i && patch.j === j);
    if (existing) {
      existing.life = WISP_FOG_LIFE;
      return;
    }
    const group = wispFogPool.find((item) => !item.visible);
    if (!group) return;
    group.visible = true;
    group.position.set(cellX(i), 0.18, cellZ(j));
    group.rotation.y = Math.random() * Math.PI * 2;
    group.scale.setScalar(1.05);
    group.userData.plane.material.opacity = 0.34;
    state.wispFogPatches.push({ i, j, group, life: WISP_FOG_LIFE, phase: Math.random() * 6.28 });
  }

  function spawnWispDissolve(x, z) {
    const group = wispDissolvePool.find((item) => !item.visible);
    if (!group) return;
    group.visible = true;
    group.position.set(x, 0.24, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    group.scale.setScalar(0.88);
    group.userData.plane.material.opacity = 0.86;
    state.wispDissolves.push({
      group,
      life: WISP_DISSOLVE_TIME,
      maxLife: WISP_DISSOLVE_TIME,
      spin: (Math.random() - 0.5) * 0.8,
    });
  }

  function updateWispDissolves(dt) {
    for (let k = state.wispDissolves.length - 1; k >= 0; k--) {
      const effect = state.wispDissolves[k];
      effect.life -= dt;
      const progress = 1 - Math.max(0, effect.life / effect.maxLife);
      effect.group.rotation.y += effect.spin * dt;
      effect.group.scale.setScalar(0.88 + Math.sin(progress * Math.PI) * 0.18);
      effect.group.userData.plane.material.opacity =
        Math.max(0, 0.86 * (1 - progress * progress));
      if (effect.life <= 0) {
        effect.group.visible = false;
        state.wispDissolves.splice(k, 1);
      }
    }
  }

  function updateWispFogPatches(dt) {
    for (let k = state.wispFogPatches.length - 1; k >= 0; k--) {
      const patch = state.wispFogPatches[k];
      patch.life -= dt;
      const remaining = Math.max(0, patch.life / WISP_FOG_LIFE);
      const frame = WISP_FOG_TEX[Math.floor(state.time / 0.26 + patch.phase) % WISP_FOG_TEX.length];
      if (frame && patch.group.userData.plane.material.map !== frame) {
        patch.group.userData.plane.material.map = frame;
        patch.group.userData.plane.material.needsUpdate = true;
      }
      patch.group.userData.plane.material.opacity =
        (0.22 + Math.sin(state.time * 2.5 + patch.phase) * 0.06) * remaining;
      patch.group.scale.setScalar(1.05 + Math.sin(state.time * 2 + patch.phase) * 0.08);
      if (patch.life <= 0) {
        patch.group.visible = false;
        state.wispFogPatches.splice(k, 1);
      }
    }
  }

  function spawnWispSpike(e, angle) {
    const mesh = wispSpikePool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.position.set(e.x, 0.5, e.z);
    mesh.scale.setScalar(1);
    state.wispSpikes.push({
      mesh,
      x: e.x,
      z: e.z,
      vx: Math.cos(angle) * WISP_ORB_SPEED,
      vz: Math.sin(angle) * WISP_ORB_SPEED,
      life: WISP_ORB_LIFE,
    });
  }

  function wispOrbTouchesObstacle(x, z, radius) {
    const baseI = Math.round(x + HALF);
    const baseJ = Math.round(z + HALF);
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const i = baseI + di;
        const j = baseJ + dj;
        if (!inBounds(i, j) || !isObstacle(i, j)) continue;
        const cx = cellX(i);
        const cz = cellZ(j);
        const nearestX = Math.max(cx - 0.5, Math.min(x, cx + 0.5));
        const nearestZ = Math.max(cz - 0.5, Math.min(z, cz + 0.5));
        const dx = x - nearestX;
        const dz = z - nearestZ;
        if (dx * dx + dz * dz <= radius * radius) return true;
      }
    }
    return false;
  }

  function updateWispSpikes(dt) {
    const head = headPosition(_tmpA);
    for (let k = state.wispSpikes.length - 1; k >= 0; k--) {
      const spike = state.wispSpikes[k];
      spike.life -= dt;
      const desired = Math.atan2(head.z - spike.z, head.x - spike.x);
      const current = Math.atan2(spike.vz, spike.vx);
      const turn = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
      const angle = current + Math.max(
        -WISP_ORB_TURN_RATE * dt,
        Math.min(WISP_ORB_TURN_RATE * dt, turn)
      );
      spike.vx = Math.cos(angle) * WISP_ORB_SPEED;
      spike.vz = Math.sin(angle) * WISP_ORB_SPEED;
      spike.x += spike.vx * dt;
      spike.z += spike.vz * dt;
      spike.mesh.position.set(
        spike.x,
        0.5 + Math.sin(state.time * 7 + k) * 0.04,
        spike.z
      );
      spike.mesh.rotation.y += dt * 2.2;
      spike.mesh.scale.setScalar(1 + Math.sin(state.time * 8 + k) * 0.06);
      const ci = Math.round(spike.x + HALF);
      const cj = Math.round(spike.z + HALF);
      if (bodyDistanceSq(spike.x, spike.z) < 0.74 * 0.74) {
        damage(1, 'projectile');
        spike.life = 0;
      }
      const hitObstacle = wispOrbTouchesObstacle(spike.x, spike.z, WISP_ORB_RADIUS);
      if (spike.life <= 0 || !inBounds(ci, cj) || hitObstacle) {
        if (hitObstacle) spawnFrostMist(spike.x, spike.z, 0.8);
        spike.mesh.visible = false;
        state.wispSpikes.splice(k, 1);
      }
    }
  }

  function updateFrostWisp(e, mesh, dt) {
    if (!e.wispState) e.wispState = 'fog';
    if (e.wispState === 'fog') {
      mesh.material.color.setHex(0xffffff);
      mesh.material.opacity = 0.42;
      e.wispStateTimer -= dt;
      e.wispMoveTimer -= dt;
      if (e.wispMoveTimer <= 0) {
        e.wispMoveTimer = 0.55 + Math.random() * 0.25;
        const directions = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        const [di, dj] = directions[randInt(directions.length)];
        const i = Math.max(0, Math.min(N - 1, Math.round(e.x + HALF) + di));
        const j = Math.max(0, Math.min(N - 1, Math.round(e.z + HALF) + dj));
        e.i = i;
        e.j = j;
        e.x = cellX(i);
        e.z = cellZ(j);
        spawnWispFogAt(i, j);
      }
      mesh.position.set(e.x, 0.46 + Math.sin(state.time * 2.6 + e.bob) * 0.05, e.z);
      if (e.wispStateTimer <= 0) {
        e.wispState = 'solid';
        e.wispStateTimer = WISP_SOLID_TIME;
        e.wispMoveTimer = 0;
      }
      return;
    }

    mesh.material.opacity = 1;
    mesh.material.color.setHex(0xffffff);
    mesh.position.set(e.x, 0.5 + Math.sin(state.time * 3.2 + e.bob) * 0.035, e.z);
    if (e.wispState === 'solid') {
      const stats = enemyStats(e.type);
      if (e.cool > 0) e.cool -= dt;
      if (bodyDistanceSq(e.x, e.z) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
        e.cool = stats.contactCooldown;
        damage(stats.contactDamage, 'contact');
        if (state.over) return;
      }
      e.wispStateTimer -= dt;
      if (e.wispStateTimer <= 0) {
        e.wispState = 'cast';
        e.wispStateTimer = WISP_CAST_WARNING;
        spawnWispWarnings(e);
      }
      return;
    }

    if (e.wispState === 'cast') {
      for (const warning of e.wispWarnings) {
        warning.children[0].material.opacity = 0.28 + Math.sin(state.time * 20) * 0.12;
      }
      e.wispStateTimer -= dt;
      if (e.wispStateTimer <= 0) {
        for (let k = 0; k < 3; k++) {
          spawnWispSpike(e, e.wispDirections[k % Math.max(1, e.wispDirections.length)] || 0);
        }
        hideWispWarnings(e);
        spawnWispDissolve(e.x, e.z);
        e.wispState = 'fog';
        e.wispStateTimer = WISP_FOG_TIME;
        e.wispMoveTimer = 0;
      }
    }
  }

  const CAMPAIGN_LEVEL_COUNTS = [8, 8, 8, 8, 8, 8, 4];

  function campaignPosition(levelIndex) {
    const safe = Math.max(0, Math.min(ROOM_COUNT - 1, levelIndex));
    let offset = 0;
    for (let region = 0; region < CAMPAIGN_LEVEL_COUNTS.length; region++) {
      const count = CAMPAIGN_LEVEL_COUNTS[region];
      if (safe < offset + count) {
        return { region, node: safe - offset + 1, count };
      }
      offset += count;
    }
    return { region: CAMPAIGN_LEVEL_COUNTS.length - 1, node: 1, count: 4 };
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

  function enemyRenderScale(type) {
    if (type === 'iceSlug') return 0.8;
    if (type === 'frostWolf') return WOLF_RENDER_SCALE;
    if (type === 'emberWisp') return WISP_RENDER_SCALE;
    if (type === 'frostWisp') return 1.28;
    if (type === 'stormSkimmer') return 0.84;
    if (type === 'stormMoth') return 0.98;
    if (type === 'stormFalcon') return 1.18;
    if (type === 'abyssTentacle') return 1.34;
    if (type === 'voidTick') return 0.88;
    if (type === 'soulWraith') return 1.12;
    return 1;
  }

  function chooseRespawnEnemyType() {
    const types = state.roomEnemyTypes;
    if (!types || types.length === 0) return 'spore';
    return types[randInt(types.length)];
  }

  function updateHud() {
    const len = state.cells.length;
    const position = campaignPosition(state.level);
    el.level.textContent = `${position.region + 1}-${position.node} / ${position.count}`;
    el.len.textContent = String(len);
    el.score.textContent = String(state.score);
    el.kills.textContent = String(state.kills);
    el.hp.style.width = `${Math.max(0, Math.min(100, (len / 24) * 100))}%`;

    if (state.phase === 'boss' && state.boss && state.boss.alive) {
      el.bossbar.style.display = 'block';
      el.bfill.style.width = `${Math.max(0, (state.boss.hp / state.boss.max) * 100)}%`;
      const isBlackBoss = isBlackGorgeBoss(state.boss.kind);
      const showShield = state.boss.kind === 'pharaoh' || isBlackBoss;
      el.bshield.hidden = !showShield;
      if (showShield) {
        if (isBlackBoss) {
          const hpPercent = Math.ceil((state.boss.hp / state.boss.max) * 100);
          if (state.boss.kind === 'black_curse_servant') {
            const lock = state.boss.blackCurseLockTimer || 0;
            el.bshield.textContent = lock > 0
              ? `血咒锁定 · ${Math.ceil(lock)}s · 弹幕追踪`
              : `弹幕 ${Math.max(0, Math.ceil(state.boss.blackCurseBulletTimer))}s · 法阵 ${Math.max(0, Math.ceil(state.boss.blackCurseRuneTimer))}s`;
          } else if (state.boss.kind === 'blood_slave') {
            const rage = state.boss.bloodRageTimer || 0;
            const film = state.boss.bloodFilmTimer || 0;
            const filmText = film > 0
              ? `血膜 ${Math.ceil(film)}s`
              : `血膜冷却 ${Math.ceil(state.boss.bloodFilmCooldown || 0)}s`;
            el.bshield.textContent = rage > 0
              ? `狂暴 ×${BLOOD_SLAVE_RAGE_MULT} · ${Math.ceil(rage)}s · ${filmText}`
              : filmText;
          } else if (state.boss.kind === 'black_mist_servant') {
            const clones = state.blackMistClones.length;
            const hits = state.boss.blackMistCloneHits || 0;
            el.bshield.textContent = state.boss.blackInvulnerable
              ? `雾化瞬移 · ${Math.ceil(state.boss.blackStateTimer)}s`
              : clones > 0
                ? `分身 ${clones} · 本体受击 ${hits}/${BLACK_MIST_CLONE_BREAK_HITS} · 分裂 ${Math.ceil(state.boss.blackMistSplitTimer)}s`
                : `分身冷却 ${Math.ceil(state.boss.blackMistSplitTimer)}s · 瞬移 ${BLACK_MIST_TELEPORT_INTERVAL}s`;
          } else if (state.boss.kind === 'black_wizard') {
            const curse = state.boss.blackWizardCurseLayers || 0;
            const decay = curse > 0 ? `${Math.ceil(state.boss.blackWizardCurseDecayTimer)}s` : '稳定';
            const summon = state.blackWizardSummon;
            const summonText = summon
              ? ` · 召唤物 ${summon.hp}/${summon.maxHp} ${Math.ceil(summon.life)}s`
              : '';
            el.bshield.textContent =
              `诅咒 ${curse}/${BLACK_WIZARD_MAX_CURSE} · 消退 ${decay} · ` +
              `法阵 ${Math.ceil(state.boss.blackWizardCurseFieldTimer)}s · ` +
              `暗影箭 ${Math.ceil(state.boss.blackWizardArrowTimer)}s · ` +
              `召唤 ${Math.ceil(state.boss.blackWizardSummonTimer)}s` +
              summonText;
          } else {
            el.bshield.textContent = `首领阶段 1 · ${hpPercent}%`;
          }
        } else {
          el.bshield.textContent = state.boss.shieldActive
            ? `金盾 ${state.boss.shieldHp} / ${PHARAOH_SHIELD_HP}`
            : `金盾重筑 ${Math.max(0, Math.ceil(state.boss.shieldRespawnTimer))}s`;
        }
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
    const shiftSkill = activeSkillId('shift');
    const shieldText = state.shieldTimer > 0
      ? `${state.shieldTimer.toFixed(1)}s`
      : (state.shieldCooldown > 0 ? `${state.shieldCooldown.toFixed(1)}s` : '就绪');
    const signature = `${eSkill}|${qSkill}|${shiftSkill}|${shieldText}|${state.shieldTimer > 0}|${state.frostCooldown.toFixed(1)}|${state.teleportCooldown.toFixed(1)}|${state.speedBoostTimer.toFixed(1)}|${state.speedCooldown.toFixed(1)}|${state.energyCd.toFixed(1)}|${state.cells.length}`;
    const showSkillHud = Boolean(eSkill || qSkill || shiftSkill) && skillHudRevealTimer > 0;
    el.skillHud.hidden = !showSkillHud;
    el.skillHud.classList.toggle('is-fading', showSkillHud && skillHudRevealTimer <= 0.45);
    if (signature === lastSkillHudSignature) return;
    lastSkillHudSignature = signature;

    el.eSkillHud.hidden = !eSkill;
    el.qSkillHud.hidden = !qSkill;
    el.shiftSkillHud.hidden = !shiftSkill;

    if (eSkill) {
      const red = eSkill === 'red';
      const green = eSkill === 'green';
      const ice = eSkill === 'ice';
      el.eSkillName.textContent = ice ? 'E · 冰核吐息' : (red ? 'E · 赤核烈焰弹' : 'E · 翠核能量波');
      el.eSkillDesc.textContent = ice
        ? '8 格扇形 · 伤害 2 · 减速 3 秒 · 消耗 1'
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
      const portal = qSkill === 'purple';
      el.qSkillName.textContent = portal ? 'Q · 紫核传送' : 'Q · 金核壁垒';
      el.qSkillDesc.textContent = portal
        ? '入口前方 2 格 · 随机出口 · 消耗 2'
        : '护盾 2 秒 · 冷却 5 秒';
      el.qSkillState.textContent = portal
        ? (state.teleportCooldown > 0
          ? `${state.teleportCooldown.toFixed(1)}s`
          : (state.cells.length > 3 ? '就绪' : '身体不足'))
        : shieldText;
      el.qSkillHud.classList.toggle(
        'is-cooling',
        portal ? state.teleportCooldown > 0 : (state.shieldCooldown > 0 || state.shieldTimer > 0)
      );
      if (el.qSkillHud.style?.setProperty) {
        el.qSkillHud.style.setProperty('--skill-color', portal ? '#b783ff' : '#f0c66c');
      }
    }

    if (shiftSkill) {
      el.shiftSkillName.textContent = 'Shift · 风核极速';
      el.shiftSkillDesc.textContent = '按住加速 2 秒 · 冷却 3 秒';
      el.shiftSkillState.textContent = state.speedBoostTimer > 0
        ? `${state.speedBoostTimer.toFixed(1)}s`
        : (state.speedCooldown > 0 ? `${state.speedCooldown.toFixed(1)}s` : '就绪');
      el.shiftSkillHud.classList.toggle(
        'is-cooling',
        state.speedBoostTimer <= 0 && state.speedCooldown > 0
      );
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
    storm: { fog: 0x06111e, a: 0x263d4d, b: 0x35566b, hemi: 0xc7ebff, wall: 0x5c7180, ea: 0x0a314a, eb: 0x0e405b },
    abyss: { fog: 0x09040f, a: 0x160d24, b: 0x211332, hemi: 0xc28aff, wall: 0x2b1938, ea: 0x26083f, eb: 0x350b55 },
    blackgorge: {
      fog: 0x050203, a: 0x0e0507, b: 0x150709, hemi: 0xd65d56,
      wall: 0x1c1012, ea: 0x2d0304, eb: 0x3a0405,
    },
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
    clearStormArena();
    clearAbyssLordArena();
    if (room.theme === 'temple') layoutTemple(idx);
    else if (room.theme === 'volcano') layoutVolcano(idx);
    else if (room.theme === 'frozen') layoutFrozen(idx);
    else if (room.theme === 'storm') layoutStorm(idx);
    else if (room.theme === 'abyss') layoutAbyss(idx);
    else if (room.theme === 'blackgorge') layoutBlackGorge(idx);
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
    state.stormBolts.forEach((bolt) => { bolt.mesh.visible = false; });
    state.stormBolts.length = 0;
    clearWolfCombatEffects();
    (state.lavaBalls || []).forEach((b) => { b.mesh.visible = false; });
    state.lavaBalls = [];
    (state.lavaPools || []).forEach((p) => { p.mesh.visible = false; });
    state.lavaPools = [];
    state.pellets.length = 0;
    state.fireBursts.forEach((burst) => { burst.mesh.visible = false; });
    state.fireBursts.length = 0;
    state.fireTrails.forEach((trail) => { trail.mesh.visible = false; });
    state.fireTrails.length = 0;
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
    clearPurpleTeleport();
    state.teleportCooldown = 0;
    state.teleportEmerging = false;
    state.speedBoostTimer = 0;
    state.speedCooldown = 0;
    state.frostCooldown = 0;
    state.frostEffectTimer = 0;
    state.iceSpawnTimer = ICE_SPAWN_INTERVAL;
    state.stormLightningTimer = STORM_LIGHTNING_INTERVAL;
    state.stormIntroShown = false;
    shieldRibbon.visible = false;
    shieldHaloRig.visible = false;
    bossBreathRig.visible = false;
    bossBreathMat.opacity = 0;
    clearBlackGorgeEffects();
    clearFrostDragonArena();
    clearWispCombatEffects();
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
    matA.emissiveIntensity = room.theme === 'volcano'
      ? 0.72
      : ((room.theme === 'frozen' || room.theme === 'storm')
        ? 0.22
        : (room.theme === 'abyss'
          ? 0.34
          : (room.theme === 'blackgorge' ? 0.3 : 0.16)));
    matB.emissiveIntensity = matA.emissiveIntensity;
    wallMat.color.setHex(tint.wall);
    hemi.color.setHex(tint.hemi);
    hemi.groundColor.setHex(room.theme === 'blackgorge' ? 0x080203 : 0x07100b);
    hemi.intensity = room.theme === 'blackgorge' ? 0.42 : 0.82;
    sun.color.setHex(room.theme === 'blackgorge' ? 0xff5f56 : 0xffd99b);
    sun.intensity = room.theme === 'blackgorge' ? 0.56 : 1.05;
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
      enemyPool[k].scale.setScalar(enemyRenderScale(type));
      state.enemies[k].type = type;
      state.enemies[k].hp = enemyStats(type).hp;
      state.enemies[k].speedMul = 1;
      state.enemies[k].eyeTimer = enemyStats(type).eyeGlowCooldown || 0;
      state.enemies[k].invulnTimer = 0;
      state.enemies[k].staffPulse = 0;
      state.enemies[k].frozenTimer = 0;
      state.enemies[k].slowTimer = 0;
    }

    if (room.kind === 'clear') {
      const safeDistance = idx === 0 ? 14 : 9;
      for (let k = 0; k < types.length; k++) spawnEnemy(safeDistance);
      const position = campaignPosition(idx);
      showLevelIntro(
        `REGION ${position.region + 1} · LEVEL ${String(position.node).padStart(2, '0')} / ${String(position.count).padStart(2, '0')}`,
        room.name,
        `敌人 ${types.length} · 清除后开启传送门`
      );
    } else {
      spawnBoss(room.boss);
      showLevelIntro(
        'BOSS RITE',
        room.name,
        idx === ROOM_COUNT - 1 ? '击败黑巫师 · 完成远征' : '击败首领 · 进入下一层'
      );
    }
    updateHud();
    revealSkillHud();
  }

  function spawnBoss(kind = 'rootcoil') {
    const isPharaoh = kind === 'pharaoh';
    const isColossus = kind === 'magma_colossus';
    const isDragon = kind === 'frost_dragon';
    const isEagle = kind === 'storm_eagle';
    const isAbyssLord = kind === 'abyss_lord';
    const isBlackCurse = kind === 'black_curse_servant';
    const isBloodSlave = kind === 'blood_slave';
    const isBlackMist = kind === 'black_mist_servant';
    const isBlackWizard = kind === 'black_wizard';
    const isBlackBoss = isBlackCurse || isBloodSlave || isBlackMist || isBlackWizard;
    const isRootcoil = !isPharaoh && !isColossus && !isDragon && !isEagle && !isAbyssLord && !isBlackBoss;
    const hp = isColossus
      ? 480
      : (isDragon
        ? 440
        : (isEagle
          ? STORM_EAGLE_HP
          : (isAbyssLord
            ? ABYSS_LORD_HP
            : (isBlackCurse
              ? BLACK_CURSE_ATTENDANT_HP
              : (isBloodSlave
                ? BLOOD_SLAVE_HP
                : (isBlackMist
                  ? BLACK_MIST_SERVANT_HP
                  : (isBlackWizard ? BLACK_WIZARD_HP : (isPharaoh ? 380 : BOSS_HP))))))));
    const renderScale = isColossus
      ? COLOSSUS_RENDER_SCALE
      : (isDragon
        ? 2.325
        : (isEagle
          ? 2.55
          : (isAbyssLord
            ? 2.2
            : (isBlackWizard
              ? BLACK_WIZARD_RENDER_SCALE
              : (isBlackBoss ? 2.05 : (isPharaoh ? 1.425 : 2))))));
    const bulletHitRadius = isRootcoil
      ? 4.6
      : (isDragon
        ? 4.8
        : (isEagle
          ? 4.55
          : (isAbyssLord
            ? 3.15
            : (isBlackBoss ? (isBlackWizard ? 3.8 : 3.15) : (isPharaoh ? 3.45 : 2.3)))));
    const orbHitRadius = isRootcoil
      ? 5.2
      : (isDragon
        ? 3.5
        : (isEagle
          ? 4.15
          : (isAbyssLord
            ? 3.55
            : (isBlackBoss ? (isBlackWizard ? 4.1 : 3.4) : (isPharaoh ? 3.9 : 2.6)))));
    const contactRadius = isRootcoil
      ? 4.8
      : (isDragon
        ? 4.88
        : (isEagle
          ? 4.35
          : (isAbyssLord
            ? 3.35
            : (isBlackBoss ? (isBlackWizard ? 3.5 : 3.0) : (isPharaoh ? 3.75 : 2.5)))));
    const startCell = isBlackCurse ? BLACK_CURSE_BOSS_CELL : BOSS_CELL;
    const start = { x: cellX(startCell.i), z: cellZ(startCell.j) };
    state.boss = {
      alive: true,
      kind,
      hp,
      max: hp,
      renderScale,
      bulletHitRadius,
      orbHitRadius,
      contactRadius,
      crushRadius: isColossus ? COLOSSUS_CRUSH_RADIUS : 0,
      jumpDuration: isColossus ? COLOSSUS_JUMP_TIME : 0,
      x: start.x,
      z: start.z,
      shootTimer: isAbyssLord
        ? 9999
        : (isPharaoh ? PHARAOH_BULLET_INTERVAL : (isDragon ? 99 : (isRootcoil ? ROOT_BULLET_INTERVAL : 3))),
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
      slowTimer: 0,
      breathTimer: isDragon ? DRAGON_ATTACK_INTERVAL : 0,
      breathState: isDragon ? 'idle' : 'none',
      breathElapsed: 0,
      breathAngle: 0,
      breathHit: false,
      dragonState: isDragon ? 'idle' : 'none',
      dragonAttack: null,
      dragonAttackElapsed: 0,
      mirrorsSpawned: false,
      laserHitCooldown: 0,
      laserAngleOffset: 0,
      slamElapsed: 0,
      summonTimer: isRootcoil ? ROOT_SUMMON_INTERVAL : 0,
      stormSummonTimer: isEagle ? STORM_TORNADO_FIRST_CAST : 0,
      stormSummonState: 'idle',
      stormMoveState: isEagle ? 'cooldown' : 'none',
      stormMoveTimer: isEagle ? 1.2 : 0,
      stormDashFrom: null,
      stormDashTo: null,
      stormDashElapsed: 0,
      stormDashHit: false,
      stormDashAngle: 0,
      stormFeatherTimer: isEagle ? 2.4 : 0,
      stormFeatherPoseTimer: 0,
      stormFeatherCycle: 0,
      abyssState: isAbyssLord ? 'idle' : 'none',
      abyssStateTimer: 0,
      abyssThrustCooldown: isAbyssLord ? 1.5 : 0,
      abyssShotTimer: isAbyssLord ? 2.2 : 0,
      abyssThrustFrom: null,
      abyssThrustTo: null,
      abyssThrustHit: false,
      abyssForceThrust: false,
      abyssTeleportTimer: isAbyssLord ? ABYSS_LORD_TELEPORT_INTERVAL : 0,
      abyssTeleportElapsed: 0,
      abyssTeleportFrame: -1,
      summonFlash: 0,
      shieldActive: isPharaoh,
      shieldHp: isPharaoh ? PHARAOH_SHIELD_HP : 0,
      shieldRespawnTimer: 0,
      shieldFlash: 0,
      shieldHudSecond: -1,
      blackAttackTimer: isBlackCurse ? 2.2 : (isBloodSlave ? 2.8 : (isBlackMist ? 1.2 : 2.4)),
      blackAttackCycle: 0,
      blackState: isBloodSlave ? 'stalk' : (isBlackMist ? 'solid' : 'idle'),
      blackStateTimer: isBlackMist ? BLACK_MIST_SOLID_TIME : 0,
      blackInvulnerable: false,
      blackChargeFrom: null,
      blackChargeTo: null,
      blackChargeHit: false,
      blackBeam: null,
      blackClonesSpawned: false,
      blackPhase: 1,
      blackVolleyTimer: isBlackMist ? 0.8 : 1.5,
      blackMistSplitTimer: isBlackMist ? BLACK_MIST_CLONE_SPLIT_INTERVAL : 0,
      blackMistCloneHits: 0,
      blackMistHudSignature: '',
      blackWizardCurseFieldTimer: isBlackWizard ? BLACK_WIZARD_CURSE_FIELD_INTERVAL : 0,
      blackWizardArrowTimer: isBlackWizard ? BLACK_WIZARD_ARROW_INTERVAL : 0,
      blackWizardSummonTimer: isBlackWizard ? BLACK_WIZARD_SUMMON_INTERVAL : 0,
      blackWizardCurseLayers: 0,
      blackWizardCurseDecayTimer: BLACK_WIZARD_CURSE_DECAY_TIME,
      blackWizardPose: 'idle',
      blackWizardPoseTimer: 0,
      blackWizardHudSignature: '',
      blackCurseBulletTimer: isBlackCurse ? BLACK_CURSE_BULLET_INTERVAL : 0,
      blackCurseRuneTimer: isBlackCurse ? BLACK_CURSE_RUNE_INTERVAL : 0,
      blackCurseLockTimer: 0,
      blackCurseSkillCycle: 0,
      bloodState: isBloodSlave ? 'stalk' : 'none',
      bloodStateTimer: 0,
      bloodFilmTimer: isBloodSlave ? BLOOD_SLAVE_FILM_DURATION : 0,
      bloodFilmCooldown: 0,
      bloodClawCooldown: isBloodSlave ? 1.2 : 0,
      bloodClawTarget: null,
      bloodClawFrom: null,
      bloodClawTo: null,
      bloodPoolCooldown: isBloodSlave ? 4.5 : 0,
      bloodRageTimer: 0,
      bloodRageStacks: 0,
      bloodHudSignature: '',
    };
    bossPoseTexture = (kind === 'frost_dragon' ? BOSS_TEX.frost_dragon : null) || BOSS_TEX[kind] || null;
    bossPlaneMat.map = (BOSS_TEX[kind] || BOSS_TEX.rootcoil) || null;
    bossPlaneMat.color.setHex(bossPlaneMat.map ? 0xffffff : 0x6b4a2f);
    bossPlaneMat.transparent = !isEagle;
    bossPlaneMat.alphaTest = isEagle ? 0.08 : 0;
    bossPlaneMat.depthWrite = isEagle;
    bossPlaneMat.opacity = 1;
    bossPlaneMat.needsUpdate = true;
    bossMesh.visible = true;
    bossMesh.position.set(state.boss.x, 0, state.boss.z);
    bossMesh.scale.setScalar(state.boss.renderScale);
    bossMesh.rotation.y = 0;
    bossMesh.rotation.z = 0;
    abyssTeleportMesh.visible = false;
    bossBreathRig.visible = false;
    bossBreathMat.opacity = 0;
    if (isDragon) clearFrostDragonArena();
    clearBlackGorgeEffects();
    pharaohShieldRig.visible = false;
    rootSummonRig.visible = false;
    colossusShadow.visible = false;
    colossusImpactRing.visible = false;
    const bossNames = {
      black_curse_servant: '黑咒侍从 · BLACK CURSE ATTENDANT',
      blood_slave: '畸变血奴 · MUTATED BLOOD SLAVE',
      black_mist_servant: '黑雾魔侍 · BLACK MIST SERVANT',
      black_wizard: '黑巫师 · THE BLACK WIZARD',
      abyss_lord: '深渊影主 · ABYSSAL SHADE',
      frost_dragon: '凛冬冰龙 · FROST DRAGON',
      storm_eagle: '风暴巨鹰 · STORM EAGLE',
      magma_colossus: '熔岩巨像 · MAGMA COLOSSUS',
      pharaoh: '黄金法老 · PHARAOH',
      rootcoil: '枯树 · ROOTCOIL',
    };
    el.bname.textContent = bossNames[kind] || bossNames.rootcoil;
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
    if (bossKind === 'frost_dragon') clearFrostDragonArena();
    if (bossKind === 'storm_eagle') clearStormArena();
    if (bossKind === 'abyss_lord') clearAbyssLordArena();
    clearWispCombatEffects();
    clearBlackGorgeEffects();
    colossusShadow.visible = false;
    colossusImpactRing.visible = false;
    const finalBoss = bossKind === 'black_wizard';
    state.phase = finalBoss ? 'exit' : 'pick';
    state.doorOpen = finalBoss;
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
    if (bossKind === 'abyss_lord') {
      spawnSkillOrb(bossKind);
      updateHud();
      toast('深渊影主倒下', '吞噬紫色核心，获得紫核传送');
      return;
    }
    if (bossKind === 'black_wizard') {
      updateHud();
      toast('黑巫师倒下', '黑色峡谷的咒印熄灭 · 前往终局传送门');
      return;
    }
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
    if (state.phase === 'clear' && state.roomEnemyTypes.includes('frostWolf')) {
      const living = state.enemies.filter((enemy) => enemy.alive).length;
      if (living < MAX_ENEMIES) spawnEnemy(8, true, 'frostWolf');
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
    triggerThinIceAt(ni, nj);
    if (state.over) return;

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
      if (state.teleportEmerging && state.spawnPending === 0) {
        state.teleportEmerging = false;
        state.spawnEmerging = false;
      }
      state.prevTail = null;
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
    // 出洞时默认向上；禁止反向钻回传送门，但保留横向转向以支持超长蛇
    if (state.spawnEmerging && !state.teleportEmerging && d.j > 0) return;
    const reverse = d.i === -state.dir.i && d.j === -state.dir.j;
    if (reverse && state.cells.length > 2) return;
    state.dir = d;
  }

  function angleDistance(a, b) {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }

  function clearPurpleTeleport() {
    for (const mesh of purpleHoleMeshes) {
      mesh.visible = false;
      mesh.material.opacity = 0;
    }
    state.teleportHoles.length = 0;
    state.teleportHoleTimer = 0;
  }

  function showPurpleTeleportHoles(entry, exit) {
    for (const mesh of purpleHoleMeshes) {
      mesh.visible = false;
      mesh.material.opacity = 0;
    }
    state.teleportHoles = [
      { mesh: purpleHoleMeshes[0], i: entry.i, j: entry.j },
      { mesh: purpleHoleMeshes[1], i: exit.i, j: exit.j },
    ];
    for (const hole of state.teleportHoles) {
      hole.mesh.visible = true;
      hole.mesh.material.opacity = 0.95;
      hole.mesh.position.set(cellX(hole.i), 0.18, cellZ(hole.j));
    }
    state.teleportHoleTimer = TELEPORT_HOLE_EFFECT_TIME;
  }

  function updatePurpleTeleportHoles(dt) {
    if (state.teleportHoleTimer <= 0) return;
    state.teleportHoleTimer = Math.max(0, state.teleportHoleTimer - dt);
    const fade = Math.min(1, state.teleportHoleTimer / 0.45);
    for (const hole of state.teleportHoles) {
      hole.mesh.material.opacity = fade * 0.95;
      hole.mesh.rotation.z += dt * 0.7;
    }
    if (state.teleportHoleTimer <= 0) clearPurpleTeleport();
  }

  function teleportExitHasRoom(i, j, dir, length) {
    const room = Math.min(3, Math.max(1, length - 1));
    for (let k = 1; k <= room; k++) {
      const ni = i + dir.i * k;
      const nj = j + dir.j * k;
      if (!inBounds(ni, nj) || isObstacle(ni, nj)) return false;
    }
    return true;
  }

  function choosePurpleTeleportExit(entry, dir, length) {
    let fallback = null;
    for (let tries = 0; tries < 240; tries++) {
      const i = 2 + randInt(N - 4);
      const j = 2 + randInt(N - 4);
      if (i === entry.i && j === entry.j) continue;
      if (isObstacle(i, j)) continue;
      if (state.cells.some((cell) => cell.i === i && cell.j === j)) continue;
      if (!teleportExitHasRoom(i, j, dir, length)) continue;
      fallback = fallback || { i, j };
      if (Math.hypot(i - entry.i, j - entry.j) >= TELEPORT_MIN_HOLE_DISTANCE) {
        return { i, j };
      }
    }
    return fallback;
  }

  function activatePurpleTeleport() {
    if (state.over || state.paused || state.teleportCooldown > 0) return false;
    if (activeSkillId('q') !== 'purple') return false;
    if (state.spawnEmerging && !state.teleportEmerging) return false;
    if (state.cells.length <= TELEPORT_SKILL_COST + 1) {
      toast('紫核传送无法启动', `至少需要 ${TELEPORT_SKILL_COST + 2} 格身体`);
      return false;
    }

    const head = state.cells[0];
    const dir = { ...state.dir };
    const entry = {
      i: head.i + dir.i * 2,
      j: head.j + dir.j * 2,
    };
    if (!inBounds(entry.i, entry.j) || isObstacle(entry.i, entry.j) ||
      state.cells.some((cell) => cell.i === entry.i && cell.j === entry.j)) {
      toast('紫核传送失败', '身前 2 格没有可用黑洞位置');
      return false;
    }

    const remainingLength = state.cells.length - TELEPORT_SKILL_COST;
    const exit = choosePurpleTeleportExit(entry, dir, remainingLength);
    if (!exit) {
      toast('紫核传送失败', '地图上没有合适的出口位置');
      return false;
    }

    for (let k = 0; k < TELEPORT_SKILL_COST; k++) state.cells.pop();
    state.prevTail = null;
    state.cells = [{ i: exit.i, j: exit.j }];
    state.progress = 0;
    state.spawnEmerging = true;
    state.teleportEmerging = true;
    state.spawnPending = remainingLength - 1;
    state.spawnGrace = Math.max(state.spawnGrace, Math.min(2.2, remainingLength * STEP + 0.2));
    state.invuln = Math.max(state.invuln, remainingLength * STEP + 0.25);
    state.teleportCooldown = TELEPORT_SKILL_COOLDOWN;
    showPurpleTeleportHoles(entry, exit);
    updateHud();
    toast(
      '紫核传送',
      `入口 ${entry.i},${entry.j} · 出口 ${exit.i},${exit.j} · 正在钻出`
    );
    return true;
  }

  function pointInFrostCone(x, z, head, angle) {
    const dx = x - head.x;
    const dz = z - head.z;
    const distance = Math.hypot(dx, dz);
    return distance > 0.001 &&
      distance <= FROST_SKILL_RANGE &&
      angleDistance(Math.atan2(dz, dx), angle) <= FROST_SKILL_HALF_ANGLE;
  }

  function activateFrostBreath() {
    if (state.over || state.paused || state.frostCooldown > 0) return;
    if (activeSkillId('e') !== 'ice') return;
    if (state.cells.length <= FROST_SKILL_COST + 1) {
      toast('冰核吐息无法启动', `至少需要 ${FROST_SKILL_COST + 2} 格身体`);
      return;
    }

    for (let k = 0; k < FROST_SKILL_COST; k++) state.cells.pop();
    state.prevTail = null;
    state.frostCooldown = FROST_SKILL_COOLDOWN;
    state.frostEffectTimer = 0.62;

    const head = headPosition(_tmpA).clone();
    const angle = Math.atan2(state.dir.j, state.dir.i);
    playerFrostRig.position.set(head.x, 0, head.z);
    playerFrostRig.rotation.y = Math.atan2(-state.dir.j, state.dir.i);
    playerFrostRig.visible = true;
    playerFrostMesh.material.opacity = 0.82;

    let hitCount = 0;
    let slowed = 0;
    for (const enemy of state.enemies) {
      if (!enemy.alive || !pointInFrostCone(enemy.x, enemy.z, head, angle)) continue;
      if (isEnemyInvulnerable(enemy)) continue;
      if (damageEnemy(enemy, FROST_SKILL_DAMAGE)) {
        hitCount += 1;
        enemy.slowTimer = Math.max(enemy.slowTimer || 0, FROST_SKILL_SLOW_DURATION);
        slowed += 1;
      }
    }

    const wizardSummon = state.blackWizardSummon;
    if (wizardSummon && pointInFrostCone(wizardSummon.x, wizardSummon.z, head, angle)) {
      if (damageBlackWizardSummon(wizardSummon, 1)) {
        hitCount += 1;
        slowed += 1;
      }
    }

    const boss = state.boss;
    if (boss && boss.alive && pointInFrostCone(boss.x, boss.z, head, angle) &&
      !abyssLordInvulnerable(boss) && !blackBossInvulnerable(boss)) {
      const shieldBlocked = damagePharaohShield(false);
      if (!shieldBlocked) {
        boss.hp -= FROST_SKILL_DAMAGE;
        registerBlackMistBossHit();
        boss.slowTimer = Math.max(boss.slowTimer || 0, FROST_SKILL_SLOW_DURATION);
        hitCount += 1;
        slowed += 1;
        state.score += 10;
        updateHud();
        if (boss.hp <= 0) bossDie();
      }
    }

    updateHud();
    toast(
      '冰核吐息',
      hitCount > 0
        ? `命中 ${hitCount} 个目标 · 减速 ${slowed} 个目标 ${FROST_SKILL_SLOW_DURATION} 秒`
        : '寒霜席卷前方 8 格'
    );
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
    const mesh = isFire
      ? (fireBulletPool.find((m) => !m.visible) || fireBulletPool[0])
      : (bulletPool.find((m) => !m.visible) || bulletPool[0]);
    mesh.visible = true;
    mesh.position.copy(from);
    if (isFire) {
      mesh.rotation.y = Math.atan2(-d.j, d.i);
      const plane = mesh.userData.firePlane;
      if (plane) plane.material.opacity = 0.98;
    } else {
      mesh.scale.setScalar(1);
      mesh.material.color.setHex(0x9ff5d8);
      mesh.material.emissive.setHex(0x2ee6a8);
      mesh.material.emissiveIntensity = 1.6;
    }
    state.bullets.push({
      mesh, x: from.x, z: from.z,
      vx: d.i * BULLET_SPEED, vz: d.j * BULLET_SPEED, life: 1.8,
      fire: isFire,
      dirX: d.i,
      dirZ: d.j,
      trailTimer: FIRE_BULLET_TRAIL_INTERVAL,
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

  function activateQSkill() {
    const skillId = activeSkillId('q');
    if (skillId === 'purple') {
      activatePurpleTeleport();
    } else if (skillId === 'yellow') {
      activateShield();
    } else {
      toast('未安装 Q 技能', '击败 Boss 后吞噬核心，并在设置中安装');
    }
  }

  function startSpeedBoost(announce = true) {
    if (state.over || state.paused) return false;
    if (activeSkillId('shift') !== 'speed') return false;
    if (state.speedBoostTimer > 0 || state.speedCooldown > 0) return false;
    state.speedBoostTimer = SPEED_BOOST_DURATION;
    if (announce) toast('风核极速', '按住 Shift · 移动速度 ×1.5');
    updateHud();
    return true;
  }

  function updateSpeedBoost(dt) {
    if (state.speedBoostTimer > 0) {
      state.speedBoostTimer = Math.max(0, state.speedBoostTimer - dt);
      if (state.speedBoostTimer === 0) state.speedCooldown = SPEED_BOOST_COOLDOWN;
      return;
    }
    if (state.speedCooldown > 0) {
      state.speedCooldown = Math.max(0, state.speedCooldown - dt);
    }
    if (state.speedCooldown === 0 && held.has('shift')) startSpeedBoost(false);
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
    if (k === 'q') { e.preventDefault(); activateQSkill(); return; }
    if (k === 'shift') {
      e.preventDefault();
      held.add('shift');
      if (!e.repeat) startSpeedBoost();
      return;
    }
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
    const speedMul = state.speedBoostTimer > 0 ? SPEED_BOOST_MULT : 1;
    state.progress += (dt / STEP) * slowMul * speedMul;
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
      shieldHalo.scale.set(
        SHIELD_HALO_SCALE_X * pulse,
        SHIELD_HALO_SCALE_Y * pulse,
        1
      );
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
      e.jumpElapsed += dt * enemySpeedFactor(e);
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
    const speed = stats.speed * enemySpeedFactor(e);
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

  function updateStormMoth(e, mesh, hp, dt) {
    const stats = enemyStats(e.type);
    const dx = hp.x - e.x;
    const dz = hp.z - e.z;
    const len = Math.hypot(dx, dz) || 1;
    const nxDir = dx / len;
    const nzDir = dz / len;
    let mx = 0;
    let mz = 0;
    if (len > stats.preferredRange + 1.2 || len < stats.preferredRange - 1.2) {
      const sign = len > stats.preferredRange ? 1 : -1;
      mx = nxDir * sign;
      mz = nzDir * sign;
    } else {
      const orbit = Math.sin(e.stormPhase) >= 0 ? 1 : -1;
      mx = -nzDir * orbit;
      mz = nxDir * orbit;
    }
    const speed = stats.speed * enemySpeedFactor(e);
    let nx = e.x + mx * speed * dt;
    let nz = e.z + mz * speed * dt;
    const ci = Math.round(nx + HALF);
    const cj = Math.round(nz + HALF);
    if (!inBounds(ci, cj) || isObstacle(ci, cj)) {
      nx = e.x - mx * speed * dt;
      nz = e.z - mz * speed * dt;
    }
    e.x = Math.max(-HALF + 0.4, Math.min(HALF - 0.4, nx));
    e.z = Math.max(-HALF + 0.4, Math.min(HALF - 0.4, nz));
    e.i = Math.round(e.x + HALF);
    e.j = Math.round(e.z + HALF);
    e.stormPhase += dt * 1.4;
    mesh.position.set(e.x, 0.58 + Math.sin(state.time * 4.8 + e.bob) * 0.1, e.z);
    mesh.rotation.z = Math.sin(state.time * 3.2 + e.bob) * 0.12;
    mesh.scale.setScalar(enemyRenderScale(e.type) + Math.sin(state.time * 5 + e.bob) * 0.04);

    if (e.cool > 0) e.cool -= dt;
    if (bodyDistanceSq(e.x, e.z) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
      e.cool = stats.contactCooldown;
      damage(stats.contactDamage, 'contact');
      if (state.over) return;
    }

    e.shootTimer -= dt;
    if (e.shootTimer <= 0) {
      e.shootTimer = stats.shootCooldown;
      if (len < stats.shootRange) spawnStormBolt(e.x, e.z, hp.x, hp.z);
    }
  }

  function updateStormFalcon(e, mesh, hp, dt) {
    const stats = enemyStats(e.type);
    const dx = hp.x - e.x;
    const dz = hp.z - e.z;
    const len = Math.hypot(dx, dz) || 1;
    if (e.cool > 0) e.cool -= dt;

    if (e.stormDiveState === 'idle') {
      const orbit = Math.sin(state.time * 0.9 + e.stormPhase) >= 0 ? 1 : -1;
      const toward = len > 6.2 ? 1 : (len < 4.8 ? -1 : 0.18);
      const mx = (dx / len) * toward + (-dz / len) * orbit * 0.82;
      const mz = (dz / len) * toward + (dx / len) * orbit * 0.82;
      const ml = Math.hypot(mx, mz) || 1;
      const speed = stats.speed * enemySpeedFactor(e);
      let nx = e.x + (mx / ml) * speed * dt;
      let nz = e.z + (mz / ml) * speed * dt;
      const ci = Math.round(nx + HALF);
      const cj = Math.round(nz + HALF);
      if (!inBounds(ci, cj) || isObstacle(ci, cj)) {
        nx = e.x - (mz / ml) * speed * dt;
        nz = e.z + (mx / ml) * speed * dt;
      }
      e.x = Math.max(-HALF + 0.45, Math.min(HALF - 0.45, nx));
      e.z = Math.max(-HALF + 0.45, Math.min(HALF - 0.45, nz));
      e.i = Math.round(e.x + HALF);
      e.j = Math.round(e.z + HALF);
      mesh.material.color.setHex(0xffffff);
      mesh.position.set(e.x, 0.58 + Math.sin(state.time * 3.4 + e.bob) * 0.09, e.z);
      mesh.rotation.z = Math.sin(state.time * 2.2 + e.bob) * 0.07;
      mesh.scale.setScalar(enemyRenderScale(e.type));

      if (bodyDistanceSq(e.x, e.z) < stats.contactRadius * stats.contactRadius && e.cool <= 0) {
        e.cool = stats.contactCooldown;
        damage(stats.contactDamage, 'contact');
        if (state.over) return;
      }

      e.stormDiveTimer -= dt;
      if (e.stormDiveTimer <= 0 && len <= STORM_DIVE_RANGE) {
        e.stormDiveState = 'telegraph';
        e.stormDiveElapsed = 0;
        e.stormDiveTarget = { x: hp.x, z: hp.z };
        e.stormDiveHit = false;
      }
      return;
    }

    if (e.stormDiveState === 'telegraph') {
      e.stormDiveElapsed += dt;
      const pulse = 0.5 + Math.sin(state.time * 20) * 0.5;
      mesh.material.color.setHex(0xb8f2ff);
      mesh.position.set(e.x, 0.7 + Math.sin(state.time * 16) * 0.06, e.z);
      mesh.scale.setScalar(enemyRenderScale(e.type) * (1 + pulse * 0.1));
      const target = e.stormDiveTarget || { x: e.x, z: e.z };
      mesh.rotation.z = Math.atan2(-(target.z - e.z), target.x - e.x) * 0.18;
      if (e.stormDiveElapsed >= STORM_DIVE_TELEGRAPH) {
        e.stormDiveState = 'dive';
        e.stormDiveElapsed = 0;
        e.stormDiveFrom = { x: e.x, z: e.z };
      }
      return;
    }

    if (e.stormDiveState === 'dive') {
      e.stormDiveElapsed += dt;
      const progress = Math.min(1, e.stormDiveElapsed / STORM_DIVE_TIME);
      const eased = progress * progress * (3 - 2 * progress);
      const from = e.stormDiveFrom || { x: e.x, z: e.z };
      const target = e.stormDiveTarget || hp;
      e.x = from.x + (target.x - from.x) * eased;
      e.z = from.z + (target.z - from.z) * eased;
      e.i = Math.round(e.x + HALF);
      e.j = Math.round(e.z + HALF);
      mesh.material.color.setHex(0xd8f7ff);
      mesh.position.set(e.x, 0.62 + Math.sin(Math.PI * progress) * 1.15, e.z);
      mesh.rotation.z = Math.atan2(-(target.z - from.z), target.x - from.x) - Math.PI / 2;
      mesh.scale.setScalar(enemyRenderScale(e.type) * 1.06);
      if (progress >= 1) {
        if (bodyDistanceSq(e.x, e.z) < 1.18 * 1.18) {
          damage(1, 'contact');
        }
        e.stormDiveState = 'recover';
        e.stormDiveElapsed = 0;
      }
      return;
    }

    e.stormDiveElapsed += dt;
    mesh.material.color.setHex(0x9bb4c1);
    mesh.position.set(e.x, 0.5 + Math.sin(state.time * 5 + e.bob) * 0.025, e.z);
    mesh.rotation.z = Math.sin(state.time * 4) * 0.04;
    mesh.scale.setScalar(enemyRenderScale(e.type) * 0.94);
    if (e.stormDiveElapsed >= STORM_DIVE_RECOVER) {
      e.stormDiveState = 'idle';
      e.stormDiveElapsed = 0;
      e.stormDiveTimer = 3.8 + Math.random() * 1.6;
      e.stormDiveTarget = null;
      e.stormDiveFrom = null;
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

    const wolfEyePair = wolfEyes[index];
    const wolfEyesActive = e.type === 'frostWolf' && e.wolfState === 'charge';
    for (const eye of wolfEyePair) {
      eye.visible = wolfEyesActive;
      if (wolfEyesActive) {
        const pulse = 1.1 + Math.sin(state.time * 20 + index) * 0.22;
        eye.scale.setScalar(pulse);
        eye.material.opacity = 0.82 + Math.sin(state.time * 24 + index) * 0.16;
      }
    }

    const wispEyePair = wispEyes[index];
    const wispEyesActive = e.type === 'frostWisp' && e.wispState !== 'fog';
    for (const eye of wispEyePair) {
      eye.visible = wispEyesActive;
      if (wispEyesActive) {
        const pulse = 1.05 + Math.sin(state.time * 18 + index) * 0.2;
        eye.scale.setScalar(pulse);
        eye.material.opacity = 0.84 + Math.sin(state.time * 22 + index) * 0.14;
      }
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
    return (e.type === 'mummy' && e.invulnTimer > 0) ||
      (e.type === 'frostWisp' && e.wispState !== 'solid');
  }

  function enemySpeedFactor(e) {
    return e.slowTimer > 0 ? FROST_SKILL_SLOW_MULT : 1;
  }

  function damageEnemy(enemy, amount) {
    if (!enemy || !enemy.alive || isEnemyInvulnerable(enemy)) return false;
    enemy.hp -= amount;
    const index = state.enemies.indexOf(enemy);
    if (enemy.hp <= 0) {
      if (enemy.type === 'frostWisp') spawnWispDissolve(enemy.x, enemy.z);
      enemy.alive = false;
      state.kills += 1;
      state.score += 25;
      growBy(2);
    } else if (enemy.type === 'scarab' && enemyPool[index]) {
      enemyPool[index].material.map = TEX.scarabBroken || enemyPool[index].material.map;
      enemyPool[index].material.needsUpdate = true;
    }
    return true;
  }

  function updateEnemies(dt) {
    const hp = headPosition(_tmpA).clone();
    const spawnLocked = state.spawnGrace > 0;
    let splitCount = 0;
    if (spawnLocked) state.spawnGrace = Math.max(0, state.spawnGrace - dt);
    maintainWolfChasers();
    for (let k = 0; k < enemyPool.length; k++) {
      const mesh = enemyPool[k];
      const e = state.enemies[k];
      if (!e || !e.alive) {
        mesh.visible = false;
        if (e) {
          hideWolfTelegraph(e);
          hideWispWarnings(e);
        }
        continue;
      }
      mesh.visible = true;
      if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
      if (!spawnLocked && e.type === 'iceSlug') {
        const splitInterval = enemyStats(e.type).splitInterval;
        if (!(e.splitTimer > 0)) e.splitTimer = splitInterval;
        e.splitTimer -= dt;
        if (e.splitTimer <= 0) {
          e.splitTimer += splitInterval;
          if (spawnIceSlugChild(e)) splitCount += 1;
        }
      }
      if (e.frozenTimer > 0) {
        hideWolfTelegraph(e);
        if (e.type === 'frostWolf' && wolfEyes[k]) {
          wolfEyes[k].forEach((eye) => { eye.visible = false; });
        }
        if (e.type === 'frostWisp') {
          hideWispWarnings(e);
          if (wispEyes[k]) wispEyes[k].forEach((eye) => { eye.visible = false; });
        }
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
      if (e.type === 'frostWolf') {
        const target = state.cells[0];
        updateFrostWolf(e, mesh, target, dt);
        if (state.over) return;
        continue;
      }
      if (e.type === 'frostWisp') {
        updateFrostWisp(e, mesh, dt);
        if (state.over) return;
        continue;
      }
      if (e.type === 'stormMoth') {
        updateStormMoth(e, mesh, hp, dt);
        if (state.over) return;
        continue;
      }
      if (e.type === 'stormFalcon') {
        updateStormFalcon(e, mesh, hp, dt);
        if (state.over) return;
        continue;
      }
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
      if (e.type === 'stormSkimmer') {
        e.stormDashTimer -= dt;
        e.stormDashActive = Math.max(0, e.stormDashActive - dt);
        if (e.stormDashTimer <= 0) {
          e.stormDashTimer = stats.dashInterval;
          e.stormDashActive = stats.dashDuration;
        }
        e.speedMul = e.stormDashActive > 0 ? stats.dashSpeedMul : 1;
      }
      const speed = stats.speed * (e.speedMul === undefined ? 1 : e.speedMul) * enemySpeedFactor(e) *
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
    if (splitCount > 0) {
      updateHud();
      toast('冰晶增殖', `${splitCount} 只冰晶蛞蝓完成分裂`);
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

  function setFrostDragonPose(attacking, overrideTexture = null) {
    const texture = overrideTexture || (attacking
      ? (FROST_DRAGON_ATTACK_TEX || BOSS_TEX.frost_dragon)
      : (BOSS_TEX.frost_dragon || bossPoseTexture));
    if (!texture || bossPlaneMat.map === texture) return;
    bossPlaneMat.map = texture;
    bossPlaneMat.color.setHex(0xffffff);
    bossPlaneMat.needsUpdate = true;
    bossPoseTexture = texture;
  }

  function clearFrostDragonArena() {
    state.mirrorPillars.forEach((pillar) => {
      pillar.alive = false;
      if (pillar.mesh) pillar.mesh.visible = false;
    });
    state.mirrorPillars.length = 0;
    state.mirrorRubble.forEach((rubble) => { rubble.mesh.visible = false; });
    state.mirrorRubble.length = 0;
    state.frostScars.forEach((scar) => { scar.mesh.visible = false; });
    state.frostScars.length = 0;
    state.frostSpikeBursts.forEach((burst) => { burst.mesh.visible = false; });
    state.frostSpikeBursts.length = 0;
    frostLaserRigs.forEach((rig) => { rig.visible = false; });
    mirrorPillarMeshes.forEach((mesh) => { mesh.visible = false; });
    mirrorRubblePool.forEach((mesh) => { mesh.visible = false; });
  }

  function findMirrorAt(i, j) {
    return state.mirrorPillars.find((pillar) => (
      pillar.alive && pillar.cells.some((cell) => cell.i === i && cell.j === j)
    ));
  }

  function breakMirrorPillar(pillar) {
    if (!pillar || !pillar.alive) return false;
    pillar.alive = false;
    pillar.mesh.visible = false;
    for (const cell of pillar.cells) {
      const rubble = mirrorRubblePool.find((mesh) => !mesh.visible);
      if (!rubble) continue;
      rubble.visible = true;
      rubble.position.set(cellX(cell.i), 0.105, cellZ(cell.j));
      rubble.rotation.z = (Math.random() - 0.5) * 0.45;
      state.mirrorRubble.push({ mesh: rubble, i: cell.i, j: cell.j });
    }
    toast('霜镜破碎', '激光阻挡已解除 · 碎裂冰面不会造成伤害');
    return true;
  }

  function spawnMirrorPillars() {
    if (state.mirrorPillars.some((pillar) => pillar.alive)) return;
    const anchors = [
      { i: BOSS_CELL.i, j: 10, direction: -1 },
      { i: BOSS_CELL.i, j: 30, direction: 1 },
    ];
    for (let n = 0; n < anchors.length; n++) {
      let anchor = null;
      for (let offset = 0; offset <= 4; offset++) {
        const j = anchors[n].j + (anchors[n].direction < 0 ? -offset : offset);
        const cells = [{ i: BOSS_CELL.i, j }, { i: BOSS_CELL.i, j: j + 1 }, { i: BOSS_CELL.i, j: j + 2 }];
        if (cells.every((cell) => inBounds(cell.i, cell.j) && !isObstacle(cell.i, cell.j))) {
          anchor = { i: BOSS_CELL.i, j, cells };
          break;
        }
      }
      if (!anchor) continue;
      const mesh = mirrorPillarMeshes[n];
      const pillar = { id: n, i: anchor.i, j: anchor.j, cells: anchor.cells, mesh, alive: true };
      mesh.visible = true;
      mesh.position.set(cellX(anchor.i), 0, cellZ(anchor.j + 1));
      mesh.rotation.y = 0;
      state.mirrorPillars.push(pillar);
    }
    if (state.mirrorPillars.length > 0) {
      toast('霜镜召唤', '冰镜晶柱会阻挡激光 · 可用烈焰弹击碎');
    }
  }

  function dragonLaserSegments(b) {
    const baseAngle = b.laserAngleOffset || 0;
    const directions = [
      baseAngle,
      baseAngle + Math.PI / 2,
      baseAngle + Math.PI,
      baseAngle - Math.PI / 2,
    ];
    const mains = [];
    for (const angle of directions) {
      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);
      let length = DRAGON_LASER_RANGE;
      let hitPillar = null;
      for (const pillar of state.mirrorPillars) {
        if (!pillar.alive) continue;
        for (const cell of pillar.cells) {
          const dx = cellX(cell.i) - b.x;
          const dz = cellZ(cell.j) - b.z;
          const projection = dx * dirX + dz * dirZ;
          const perpendicular = Math.abs(-dx * dirZ + dz * dirX);
          if (projection > 0 && projection < length && perpendicular <= 0.72) {
            length = Math.max(0.5, projection - 0.45);
            hitPillar = pillar;
          }
        }
      }
      mains.push({ angle, length, hitPillar });
    }
    return { mains };
  }

  function updateDragonLaserVisuals(b, opacity) {
    const segments = dragonLaserSegments(b);
    for (let i = 0; i < frostLaserRigs.length; i++) {
      const rig = frostLaserRigs[i];
      const segment = segments.mains[i];
      rig.visible = true;
      rig.position.set(b.x, 0, b.z);
      rig.rotation.y = Math.atan2(-Math.sin(segment.angle), Math.cos(segment.angle));
      rig.scale.set(segment.length, 1, 1);
      rig.children[0].material.opacity = opacity;
    }
    return segments;
  }

  function hideDragonLaserVisuals() {
    frostLaserRigs.forEach((rig) => { rig.visible = false; });
  }

  function pointHitsDragonRay(px, pz, ox, oz, angle, length, width) {
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    const dx = px - ox;
    const dz = pz - oz;
    const projection = dx * dirX + dz * dirZ;
    if (projection < 0 || projection > length) return false;
    return Math.abs(-dx * dirZ + dz * dirX) <= width;
  }

  function bodyTouchesDragonLaser(b) {
    const segments = dragonLaserSegments(b);
    for (const cell of state.cells) {
      const x = cellX(cell.i);
      const z = cellZ(cell.j);
      for (const main of segments.mains) {
        if (pointHitsDragonRay(x, z, b.x, b.z, main.angle, main.length, DRAGON_LASER_HIT_WIDTH)) {
          return true;
        }
      }
    }
    return false;
  }

  function spawnFrostScars(b) {
    const dirX = Math.cos(b.breathAngle);
    const dirZ = Math.sin(b.breathAngle);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (isObstacle(i, j)) continue;
        const dx = cellX(i) - b.x;
        const dz = cellZ(j) - b.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 2.2 || distance > DRAGON_BREATH_RANGE) continue;
        const dot = (dx * dirX + dz * dirZ) / distance;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        const cellMargin = Math.atan2(0.72, Math.max(1, distance));
        if (angle > DRAGON_BREATH_HALF_ANGLE + cellMargin) continue;

        const existing = state.frostScars.find((scar) => scar.i === i && scar.j === j);
        if (existing) {
          existing.life = DRAGON_FROST_SCAR_LIFE;
          existing.mesh.material.opacity = 0.9;
          continue;
        }
        const mesh = frostScarPool.find((item) => !item.visible);
        if (!mesh) return;
        mesh.visible = true;
        mesh.position.set(cellX(i), 0.12, cellZ(j));
        mesh.rotation.z = 0;
        mesh.material.opacity = 0.9;
        state.frostScars.push({ i, j, mesh, life: DRAGON_FROST_SCAR_LIFE });
      }
    }
  }

  function updateFrostScars(dt) {
    for (let k = state.frostScars.length - 1; k >= 0; k--) {
      const scar = state.frostScars[k];
      scar.life -= dt;
      const onScar = state.cells.some((cell) => cell.i === scar.i && cell.j === scar.j);
      if (onScar) state.slowTimer = Math.max(state.slowTimer, 0.45);
      scar.mesh.material.opacity = Math.min(0.9, scar.life * 0.34);
      if (scar.life <= 0) {
        scar.mesh.visible = false;
        state.frostScars.splice(k, 1);
      }
    }
  }

  function spawnFrostSpike(x, z) {
    const mesh = frostSpikePool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.position.set(x, 0.3, z);
    mesh.scale.setScalar(0.35);
    mesh.material.opacity = 0.96;
    state.frostSpikeBursts.push({ mesh, life: 0.58, maxLife: 0.58 });
  }

  function spawnFrostSlamRing(b) {
    const count = DRAGON_SLAM_BULLET_COUNT;
    const startRadius = 5.15;
    const speed = 5.1;
    for (let k = 0; k < count; k++) {
      const mesh = frostSlamBulletPool.find((item) => !item.visible);
      if (!mesh) break;
      const angle = (k / count) * Math.PI * 2 + state.time * 0.18;
      const x = b.x + Math.cos(angle) * startRadius;
      const z = b.z + Math.sin(angle) * startRadius;
      mesh.visible = true;
      mesh.position.set(x, 0.5, z);
      state.enemyBullets.push({
        mesh,
        x,
        z,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        life: 4.6,
      });
    }
  }

  function eruptFrostScars() {
    const scars = state.frostScars.slice();
    for (const scar of scars) {
      spawnFrostSpike(cellX(scar.i), cellZ(scar.j));
      if (state.cells.some((cell) => cell.i === scar.i && cell.j === scar.j)) {
        state.slowTimer = Math.max(state.slowTimer, 2);
        damage(1, 'hazard');
      }
      scar.mesh.visible = false;
    }
    state.frostScars.length = 0;
  }

  function updateFrostSpikes(dt) {
    for (let k = state.frostSpikeBursts.length - 1; k >= 0; k--) {
      const burst = state.frostSpikeBursts[k];
      burst.life -= dt;
      const progress = 1 - Math.max(0, burst.life / burst.maxLife);
      burst.mesh.scale.setScalar(0.35 + Math.sin(Math.min(1, progress * 2.4) * Math.PI * 0.5) * 0.95);
      burst.mesh.material.opacity = progress < 0.7 ? 0.96 : (1 - progress) / 0.3 * 0.96;
      if (burst.life <= 0) {
        burst.mesh.visible = false;
        state.frostSpikeBursts.splice(k, 1);
      }
    }
  }

  function setSlamPose(impact = false) {
    setFrostDragonPose(true, FROST_DRAGON_SLAM_TEX[impact ? 1 : 0]);
  }

  function startFrostDragonAttack(b, attack, targetAngle) {
    b.dragonAttack = attack;
    b.dragonAttackElapsed = 0;
    b.laserHitCooldown = 0;
    b.breathHit = false;
    if (attack === 'breath') {
      b.dragonState = 'breathTelegraph';
      b.breathAngle = targetAngle;
    } else if (attack === 'laser') {
      b.dragonState = 'laserTelegraph';
      b.laserAngleOffset = 0;
    } else {
      b.dragonState = 'slamTelegraph';
    }
    setFrostDragonPose(true);
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
    const baseScale = b.renderScale || 2.325;
    const dx = hp.x - b.x;
    const dz = hp.z - b.z;
    const targetAngle = Math.atan2(dz, dx);
    b.x = cellX(BOSS_CELL.i);
    b.z = cellZ(BOSS_CELL.j);
    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.scale.setScalar(baseScale + Math.sin(state.time * 2.1) * 0.03);
    if (!b.mirrorsSpawned && b.hp <= b.max * DRAGON_MIRROR_HP_RATIO) {
      b.mirrorsSpawned = true;
      spawnMirrorPillars();
    }

    if (b.dragonState === 'idle') {
      bossMesh.rotation.z = Math.sin(state.time * 1.5) * 0.025;
      bossBreathRig.visible = false;
      bossBreathMat.opacity = 0;
      hideDragonLaserVisuals();
      setFrostDragonPose(false);
      if (b.cool > 0) b.cool -= dt;
      if (bodyDistanceSq(b.x, b.z) < b.contactRadius * b.contactRadius && b.cool <= 0) {
        b.cool = 1.6;
        damage(2, 'contact');
        if (state.over) return;
      }
      b.breathTimer -= dt;
      if (b.breathTimer <= 0) {
        const attacks = ['breath', 'laser', 'slam'];
        startFrostDragonAttack(b, attacks[randInt(attacks.length)], targetAngle);
      }
      return;
    }

    bossMesh.rotation.z = Math.sin(state.time * 8) * 0.018;
    b.dragonAttackElapsed += dt;

    if (b.dragonState === 'breathTelegraph') {
      b.breathAngle = targetAngle;
      const dirX = Math.cos(b.breathAngle);
      const dirZ = Math.sin(b.breathAngle);
      bossBreathRig.position.set(b.x + dirX * 1.45, 0, b.z + dirZ * 1.45);
      bossBreathRig.rotation.y = Math.atan2(-dirZ, dirX);
      bossBreathRig.visible = true;
      bossBreathMat.opacity = Math.min(0.42, 0.18 + b.dragonAttackElapsed / DRAGON_BREATH_TELEGRAPH * 0.24);
      if (b.dragonAttackElapsed >= DRAGON_BREATH_TELEGRAPH) {
        b.dragonState = 'breathActive';
        b.dragonAttackElapsed = 0;
        bossBreathMat.opacity = 0.92;
      }
      return;
    }

    if (b.dragonState === 'breathActive') {
      const dirX = Math.cos(b.breathAngle);
      const dirZ = Math.sin(b.breathAngle);
      bossBreathRig.position.set(b.x + dirX * 1.45, 0, b.z + dirZ * 1.45);
      bossBreathRig.rotation.y = Math.atan2(-dirZ, dirX);
      bossBreathRig.visible = true;
      bossBreathMat.opacity = 0.84 + Math.sin(state.time * 19) * 0.1;
      if (!b.breathHit && bodyTouchesDragonBreath(b)) {
        b.breathHit = true;
        const shielded = state.shieldTimer > 0;
        damage(2, 'projectile');
        if (!shielded) toast('凛冬龙息命中', '体长 -2');
        if (state.over) return;
      }
      if (b.dragonAttackElapsed >= DRAGON_BREATH_ACTIVE) {
        spawnFrostScars(b);
        bossBreathRig.visible = false;
        bossBreathMat.opacity = 0;
        b.dragonState = 'slamTelegraph';
        b.dragonAttack = 'slam';
        b.dragonAttackElapsed = 0;
        b.slamElapsed = 0;
      }
      return;
    }

    if (b.dragonState === 'laserTelegraph' || b.dragonState === 'laserActive') {
      const active = b.dragonState === 'laserActive';
      if (active) {
        b.laserAngleOffset += DRAGON_LASER_SPIN_SPEED * dt;
        b.laserHitCooldown = Math.max(0, b.laserHitCooldown - dt);
      }
      updateDragonLaserVisuals(b, active ? 0.92 : 0.22);
      setFrostDragonPose(true);
      if (active && b.laserHitCooldown <= 0 && bodyTouchesDragonLaser(b)) {
        b.laserHitCooldown = DRAGON_LASER_HIT_COOLDOWN;
        damage(1, 'projectile');
        if (state.over) return;
      }
      const duration = active ? DRAGON_LASER_ACTIVE : DRAGON_LASER_TELEGRAPH;
      if (b.dragonAttackElapsed >= duration) {
        if (!active) {
          b.dragonState = 'laserActive';
          b.dragonAttackElapsed = 0;
        } else {
          hideDragonLaserVisuals();
          b.dragonState = 'idle';
          b.dragonAttack = null;
          b.breathTimer = DRAGON_ATTACK_INTERVAL;
          setFrostDragonPose(false);
        }
      }
      return;
    }

    if (b.dragonState === 'slamTelegraph' || b.dragonState === 'slamActive') {
      b.slamElapsed += dt;
      const active = b.dragonState === 'slamActive';
      setSlamPose(active);
      bossMesh.scale.setScalar(
        baseScale * (1 + (active ? Math.sin(b.slamElapsed * 10) * 0.025 : 0))
      );
      if (!active && b.dragonAttackElapsed >= DRAGON_SLAM_TELEGRAPH) {
        b.dragonState = 'slamActive';
        b.dragonAttackElapsed = 0;
        b.slamElapsed = 0;
        setSlamPose(true);
        eruptFrostScars();
        spawnFrostSlamRing(b);
        if (state.over) return;
        return;
      }
      if (active && b.dragonAttackElapsed >= DRAGON_SLAM_ACTIVE) {
        b.dragonState = 'idle';
        b.dragonAttack = null;
        b.dragonAttackElapsed = 0;
        b.slamElapsed = 0;
        b.breathTimer = DRAGON_ATTACK_INTERVAL;
        setFrostDragonPose(false);
      }
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
    if (b.slowTimer > 0) {
      b.slowTimer = Math.max(0, b.slowTimer - dt);
      dt *= FROST_SKILL_SLOW_MULT;
    }
    const hp = headPosition(_tmpA).clone();
    if (b.kind === 'black_curse_servant') {
      updateBlackCurseServant(b, dt, hp);
      return;
    }
    if (b.kind === 'blood_slave') {
      updateBloodSlave(b, dt, hp);
      return;
    }
    if (b.kind === 'black_mist_servant') {
      updateBlackMistServant(b, dt, hp);
      return;
    }
    if (b.kind === 'black_wizard') {
      updateBlackWizard(b, dt, hp);
      return;
    }
    if (b.kind === 'abyss_lord') {
      updateAbyssLordScene(b, dt, hp);
      return;
    }
    if (b.kind === 'storm_eagle') {
      updateStormEagle(b, dt, hp);
      return;
    }
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

  // 第六章场景阶段：影主固定在王座中心并保留接触伤害，钻洞与暗影弹稍后接入。
  function abyssLordInvulnerable(b = state.boss) {
    return Boolean(
      b &&
      b.alive &&
      b.kind === 'abyss_lord' &&
      (b.abyssState === 'vanish' || b.abyssState === 'emerge')
    );
  }

  function beginAbyssTeleportAnimation(b, kind) {
    const texture = kind === 'vanish' ? ABYSS_LORD_VANISH_TEX : ABYSS_LORD_EMERGE_TEX;
    b.abyssState = kind;
    b.abyssStateTimer = ABYSS_LORD_TELEPORT_DURATION;
    b.abyssTeleportElapsed = 0;
    b.abyssTeleportFrame = -1;
    bossMesh.visible = false;
    abyssTeleportMesh.visible = true;
    abyssTeleportMesh.position.set(b.x, 0.64, b.z);
    abyssTeleportMesh.scale.setScalar(b.renderScale || 2.2);
    abyssTeleportMesh.material.map = texture || null;
    abyssTeleportMesh.material.opacity = 1;
    abyssTeleportMesh.material.needsUpdate = true;
  }

  function chooseAbyssTeleportTarget() {
    for (let tries = 0; tries < 100; tries++) {
      const i = 2 + randInt(N - 4);
      const j = 2 + randInt(N - 4);
      if (isObstacle(i, j)) continue;
      if (state.cells.some((cell) => cell.i === i && cell.j === j)) continue;
      return { i, j };
    }
    return {
      i: BOSS_CELL.i,
      j: BOSS_CELL.j,
    };
  }

  function startAbyssThrust(b, hp, forced = false) {
    if (!b || b.abyssState !== 'idle' || b.abyssThrustCooldown > 0 || state.over) return false;
    const distance = Math.hypot(hp.x - b.x, hp.z - b.z);
    if (!forced && distance > ABYSS_LORD_TRIGGER_RANGE) return false;
    b.abyssState = 'windup';
    b.abyssStateTimer = ABYSS_LORD_THRUST_WINDUP;
    b.abyssThrustCooldown = ABYSS_LORD_THRUST_INTERVAL;
    b.abyssThrustFrom = { x: b.x, z: b.z };
    b.abyssThrustTo = {
      x: Math.max(-HALF + 1, Math.min(HALF - 1, hp.x)),
      z: Math.max(-HALF + 1, Math.min(HALF - 1, hp.z)),
    };
    b.abyssThrustHit = false;
    b.abyssForceThrust = false;
    return true;
  }

  function fireAbyssLordVolley(b, hp) {
    const base = Math.atan2(hp.z - b.z, hp.x - b.x);
    for (let index = 0; index < ABYSS_LORD_SHOT_COUNT; index++) {
      const offset = (index - (ABYSS_LORD_SHOT_COUNT - 1) / 2) * ABYSS_LORD_SHOT_SPREAD;
      spawnAbyssBullet(b.x, b.z, base + offset);
    }
    b.abyssShotTimer = ABYSS_LORD_SHOT_INTERVAL;
  }

  function spawnAbyssBullet(x, z, angle) {
    const mesh = abyssBulletPool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.rotation.y = -angle;
    mesh.position.set(x, 0.58, z);
    mesh.scale.setScalar(1);
    state.abyssBullets.push({
      mesh,
      x,
      z,
      vx: Math.cos(angle) * ABYSS_LORD_BULLET_SPEED,
      vz: Math.sin(angle) * ABYSS_LORD_BULLET_SPEED,
      angle,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function spawnAbyssAfterimage(x, z) {
    const mesh = abyssAfterimagePool.find((item) => !item.visible);
    if (!mesh) return;
    x = Math.max(-HALF + 0.5, Math.min(HALF - 0.5, x));
    z = Math.max(-HALF + 0.5, Math.min(HALF - 0.5, z));
    mesh.visible = true;
    mesh.position.set(x, 0.13, z);
    mesh.scale.setScalar(1);
    mesh.material.opacity = 0.82;
    state.abyssAfterimages.push({
      mesh,
      x,
      z,
      life: ABYSS_LORD_AFTERIMAGE_LIFE,
      age: 0,
      hit: false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function abyssAfterimageTouchesBody(afterimage) {
    const half = ABYSS_LORD_AFTERIMAGE_SIZE / 2;
    return state.cells.some((cell) => (
      Math.abs(cellX(cell.i) - afterimage.x) <= half &&
      Math.abs(cellZ(cell.j) - afterimage.z) <= half
    ));
  }

  function updateAbyssLordArena(dt) {
    for (let k = state.abyssBullets.length - 1; k >= 0; k--) {
      const bullet = state.abyssBullets[k];
      bullet.x += bullet.vx * dt;
      bullet.z += bullet.vz * dt;
      bullet.mesh.position.set(
        bullet.x,
        0.58 + Math.sin(state.time * 14 + bullet.phase) * 0.04,
        bullet.z
      );
      bullet.mesh.scale.setScalar(1 + Math.sin(state.time * 18 + bullet.phase) * 0.025);

      let dead = !inBounds(Math.round(bullet.x + HALF), Math.round(bullet.z + HALF));
      if (!dead && bodyDistanceSq(bullet.x, bullet.z) <
        ABYSS_LORD_BULLET_HIT_RADIUS * ABYSS_LORD_BULLET_HIT_RADIUS) {
        damage(ABYSS_LORD_BULLET_DAMAGE, 'projectile');
        dead = true;
      }
      if (dead) {
        spawnAbyssAfterimage(bullet.x, bullet.z);
        bullet.mesh.visible = false;
        state.abyssBullets.splice(k, 1);
      }
    }

    for (let k = state.abyssAfterimages.length - 1; k >= 0; k--) {
      const afterimage = state.abyssAfterimages[k];
      afterimage.life -= dt;
      afterimage.age += dt;
      afterimage.mesh.material.opacity =
        Math.min(0.82, Math.max(0, afterimage.life) * 1.4) *
        (0.82 + Math.sin(state.time * 5 + afterimage.phase) * 0.12);
      afterimage.mesh.scale.setScalar(1 + Math.sin(state.time * 4 + afterimage.phase) * 0.04);
      if (!afterimage.hit && afterimage.age >= 0.15 && abyssAfterimageTouchesBody(afterimage)) {
        afterimage.hit = true;
        afterimage.life = Math.min(afterimage.life, 0.7);
        state.slowTimer = Math.max(state.slowTimer, ABYSS_LORD_AFTERIMAGE_SLOW_TIME);
        if (state.boss && state.boss.kind === 'abyss_lord' && state.boss.alive) {
          state.boss.abyssForceThrust = true;
        }
        toast('暗影残影', '移动速度降低 3 秒 · 影主锁定突刺');
      }
      if (afterimage.life <= 0) {
        afterimage.mesh.visible = false;
        state.abyssAfterimages.splice(k, 1);
      }
    }
  }

  function updateAbyssLordScene(b, dt, hp) {
    b.abyssThrustCooldown = Math.max(0, b.abyssThrustCooldown - dt);
    b.abyssShotTimer = Math.max(0, b.abyssShotTimer - dt);

    if (b.abyssState === 'vanish' || b.abyssState === 'emerge') {
      b.abyssStateTimer = Math.max(0, b.abyssStateTimer - dt);
      b.abyssTeleportElapsed += dt;
      const progress = Math.min(1, b.abyssTeleportElapsed / ABYSS_LORD_TELEPORT_DURATION);
      const frame = Math.min(
        ABYSS_LORD_TELEPORT_FRAMES - 1,
        Math.floor(progress * ABYSS_LORD_TELEPORT_FRAMES)
      );
      const texture = b.abyssState === 'vanish'
        ? ABYSS_LORD_VANISH_TEX
        : ABYSS_LORD_EMERGE_TEX;
      if (texture && b.abyssTeleportFrame !== frame) {
        b.abyssTeleportFrame = frame;
        texture.offset.x = frame / ABYSS_LORD_TELEPORT_FRAMES;
      }
      abyssTeleportMesh.position.set(b.x, 0.64, b.z);
      if (b.abyssStateTimer > 0) return;

      if (b.abyssState === 'vanish') {
        const target = chooseAbyssTeleportTarget();
        b.x = cellX(target.i);
        b.z = cellZ(target.j);
        beginAbyssTeleportAnimation(b, 'emerge');
      } else {
        abyssTeleportMesh.visible = false;
        bossMesh.visible = true;
        b.abyssState = 'idle';
        b.abyssStateTimer = 0;
        b.abyssTeleportTimer = ABYSS_LORD_TELEPORT_INTERVAL;
        bossPlaneMat.map = BOSS_TEX.abyss_lord || null;
        bossPlaneMat.needsUpdate = true;
      }
    }

    if (b.abyssState !== 'vanish' && b.abyssState !== 'emerge') {
      b.abyssTeleportTimer = Math.max(0, b.abyssTeleportTimer - dt);
    }
    const distance = Math.hypot(hp.x - b.x, hp.z - b.z);
    if (b.abyssState === 'idle') {
      if (b.abyssTeleportTimer <= 0) {
        b.abyssTeleportTimer = ABYSS_LORD_TELEPORT_INTERVAL;
        beginAbyssTeleportAnimation(b, 'vanish');
      } else if (b.abyssThrustCooldown <= 0 &&
        (b.abyssForceThrust || distance <= ABYSS_LORD_TRIGGER_RANGE)) {
        startAbyssThrust(b, hp, b.abyssForceThrust);
      } else if (distance > ABYSS_LORD_TRIGGER_RANGE && b.abyssShotTimer <= 0) {
        fireAbyssLordVolley(b, hp);
      }
    } else if (b.abyssState === 'windup') {
      b.abyssStateTimer = Math.max(0, b.abyssStateTimer - dt);
      if (b.abyssStateTimer <= 0) {
        b.abyssState = 'thrust';
        b.abyssStateTimer = ABYSS_LORD_THRUST_TIME;
        b.abyssThrustHit = false;
        b.abyssThrustFrom = { x: b.x, z: b.z };
      }
    } else if (b.abyssState === 'thrust') {
      const previousX = b.x;
      const previousZ = b.z;
      b.abyssStateTimer = Math.max(0, b.abyssStateTimer - dt);
      const progress = 1 - b.abyssStateTimer / ABYSS_LORD_THRUST_TIME;
      const eased = progress * progress * (3 - 2 * progress);
      const from = b.abyssThrustFrom || { x: b.x, z: b.z };
      const to = b.abyssThrustTo || from;
      b.x = from.x + (to.x - from.x) * eased;
      b.z = from.z + (to.z - from.z) * eased;
      if (!b.abyssThrustHit && stormEagleDashTouchesBody(
        previousX,
        previousZ,
        b.x,
        b.z,
        ABYSS_LORD_THRUST_HIT_RADIUS
      )) {
        b.abyssThrustHit = true;
        damage(ABYSS_LORD_THRUST_DAMAGE, 'contact');
        if (state.over) return;
        toast('影主突刺命中', '体长 -3');
      }
      if (b.abyssStateTimer <= 0) {
        b.abyssTeleportTimer = ABYSS_LORD_TELEPORT_INTERVAL;
        beginAbyssTeleportAnimation(b, 'vanish');
      }
    }

    if (b.abyssState !== 'vanish' && b.abyssState !== 'emerge') {
      const thrustPose = b.abyssState === 'windup' || b.abyssState === 'thrust';
      const poseTexture = thrustPose
        ? BOSS_TEX.abyss_lord_thrust
        : BOSS_TEX.abyss_lord;
      if (poseTexture && bossPlaneMat.map !== poseTexture) {
        bossPlaneMat.map = poseTexture;
        bossPlaneMat.needsUpdate = true;
      }
      bossMesh.visible = true;
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.y = 0;
      bossMesh.rotation.z = thrustPose ? 0 : Math.sin(state.time * 1.45) * 0.018;
      bossMesh.scale.setScalar(b.renderScale || 2.2);
      bossPlaneMat.opacity = 1;
    }
  }

  function clearAbyssLordArena() {
    state.abyssBullets.forEach((bullet) => {
      bullet.mesh.visible = false;
    });
    state.abyssBullets.length = 0;
    state.abyssAfterimages.forEach((afterimage) => {
      afterimage.mesh.visible = false;
    });
    state.abyssAfterimages.length = 0;
    abyssBulletPool.forEach((mesh) => {
      mesh.visible = false;
    });
    abyssAfterimagePool.forEach((mesh) => {
      mesh.visible = false;
    });
    abyssTeleportMesh.visible = false;
  }

  function isBlackGorgeBoss(kind = state.boss?.kind) {
    return kind === 'black_curse_servant' ||
      kind === 'blood_slave' ||
      kind === 'black_mist_servant' ||
      kind === 'black_wizard';
  }

  function blackBossInvulnerable(b = state.boss) {
    return Boolean(b && b.alive && b.blackInvulnerable);
  }

  function bodyInBlackArea(i, j) {
    return state.cells.some((cell) => (
      cell.i >= i && cell.i <= i + 1 &&
      cell.j >= j && cell.j <= j + 1
    ));
  }

  function spawnBlackRune(i, j, delay = BLACK_RUNE_WARNING, color = 0xff2f2c) {
    const mesh = blackRunePool.find((item) => !item.visible);
    if (!mesh) return;
    i = Math.max(0, Math.min(N - 2, Math.round(i)));
    j = Math.max(0, Math.min(N - 2, Math.round(j)));
    mesh.material.color.setHex(color);
    mesh.material.opacity = 0.2;
    mesh.position.set(cellX(i + 0.5), 0.14, cellZ(j + 0.5));
    mesh.scale.setScalar(1);
    mesh.visible = true;
    state.blackRunes.push({
      mesh, i, j, age: 0, delay, active: BLACK_RUNE_ACTIVE, hit: false,
    });
    return state.blackRunes[state.blackRunes.length - 1];
  }

  function updateBlackRunes(dt) {
    for (let k = state.blackRunes.length - 1; k >= 0; k--) {
      const rune = state.blackRunes[k];
      rune.age += dt;
      const warning = rune.age < rune.delay;
      if (warning) {
        const pulse = 0.4 + Math.sin(state.time * 18 + rune.i) * 0.1;
        rune.mesh.material.opacity = pulse + (rune.age / rune.delay) * 0.24;
        rune.mesh.scale.setScalar(0.82 + (rune.age / rune.delay) * 0.2);
      } else {
        rune.mesh.material.opacity = Math.max(
          0,
          0.95 * (1 - (rune.age - rune.delay) / rune.active)
        );
        rune.mesh.scale.setScalar(1.05 + (rune.age - rune.delay) * 0.4);
        if (!rune.hit) {
          rune.hit = true;
          if (bodyInBlackArea(rune.i, rune.j)) damage(1, 'hazard');
          if (state.over) return;
        }
      }
      if (rune.age >= rune.delay + rune.active) {
        rune.mesh.visible = false;
        state.blackRunes.splice(k, 1);
      }
    }
  }

  function bodyInBlackCurseRune(rune) {
    const half = BLACK_CURSE_RUNE_SIZE / 2;
    return state.cells.some((cell) => (
      Math.abs(cellX(cell.i) - rune.x) <= half &&
      Math.abs(cellZ(cell.j) - rune.z) <= half
    ));
  }

  function chooseBlackCurseRuneCenters() {
    const minCenter = BLACK_CURSE_RUNE_SIZE / 2;
    const maxCenter = N - 1 - minCenter;
    const head = state.cells[0] || BOSS_CELL;
    const firstI = Math.max(minCenter, Math.min(maxCenter, head.i));
    const firstJ = Math.max(minCenter, Math.min(maxCenter, head.j));
    const centers = [{ x: cellX(firstI), z: cellZ(firstJ) }];

    while (centers.length < 3) {
      let chosen = null;
      for (let tries = 0; tries < 80; tries++) {
        const i = minCenter + randInt(N - BLACK_CURSE_RUNE_SIZE);
        const j = minCenter + randInt(N - BLACK_CURSE_RUNE_SIZE);
        const candidate = { x: cellX(i), z: cellZ(j) };
        if (centers.every((center) => (
          Math.hypot(center.x - candidate.x, center.z - candidate.z) >=
          BLACK_CURSE_RUNE_SIZE + 1
        ))) {
          chosen = candidate;
          break;
        }
      }
      centers.push(chosen || {
        x: cellX(minCenter + randInt(N - BLACK_CURSE_RUNE_SIZE)),
        z: cellZ(minCenter + randInt(N - BLACK_CURSE_RUNE_SIZE)),
      });
    }
    return centers;
  }

  function spawnBlackCurseRune(centerX, centerZ) {
    const mesh = blackCurseRunePool.find((item) => !item.visible);
    if (!mesh) return null;
    mesh.position.set(centerX, 0.13, centerZ);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.setScalar(1);
    mesh.material.opacity = 0.12;
    mesh.visible = true;
    const rune = {
      mesh,
      x: centerX,
      z: centerZ,
      age: 0,
      warning: BLACK_CURSE_RUNE_WARNING,
      active: BLACK_CURSE_RUNE_ACTIVE,
      hit: false,
    };
    state.blackCurseRunes.push(rune);
    return rune;
  }

  function spawnBlackCurseRuneWave() {
    const centers = chooseBlackCurseRuneCenters();
    centers.forEach((center) => spawnBlackCurseRune(center.x, center.z));
  }

  function fireBlackCurseBulletCurtain(b, homing = false) {
    const head = headPosition(_tmpA).clone();
    for (let k = 0; k < BLACK_CURSE_BULLET_COUNT; k++) {
      const mesh = blackCurseBulletPool.find((item) => !item.visible);
      if (!mesh) break;
      const x = -HALF + 1 + (k / (BLACK_CURSE_BULLET_COUNT - 1)) * (N - 2) +
        (Math.random() - 0.5) * 0.45;
      const z = b.z + 1.9 + Math.random() * 0.55;
      const jitter = (Math.random() - 0.5) * 0.14;
      const angle = homing
        ? Math.atan2(head.z - z, head.x - x) + jitter
        : Math.PI / 2 + jitter * 0.45;
      const speed = BLACK_CURSE_BULLET_SPEED * (0.94 + Math.random() * 0.12);
      mesh.position.set(x, 0.42, z);
      mesh.rotation.y = -angle;
      mesh.visible = true;
      state.enemyBullets.push({
        mesh,
        x,
        z,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        life: Infinity,
        speed,
        homing,
        blackCurse: true,
      });
    }
  }

  function updateBlackCurseRunes(dt) {
    for (let k = state.blackCurseRunes.length - 1; k >= 0; k--) {
      const rune = state.blackCurseRunes[k];
      rune.age += dt;
      if (rune.age < rune.warning) {
        const progress = rune.age / rune.warning;
        rune.mesh.material.opacity = 0.2 + progress * 0.42 +
          Math.sin(state.time * 14 + rune.x) * 0.04;
        rune.mesh.rotation.y += dt * (0.18 + progress * 0.42);
      } else {
        const progress = Math.min(1, (rune.age - rune.warning) / rune.active);
        rune.mesh.material.opacity = Math.max(0, 0.92 * (1 - progress));
        rune.mesh.scale.setScalar(1 + progress * 0.06);
        rune.mesh.rotation.y += dt * 0.9;
        if (!rune.hit) {
          rune.hit = true;
          const damageBefore = state.damageTaken;
          if (bodyInBlackCurseRune(rune)) damage(BLACK_CURSE_RUNE_DAMAGE, 'hazard');
          if (state.over) return;
          if (state.damageTaken > damageBefore &&
            state.boss && state.boss.kind === 'black_curse_servant' && state.boss.alive) {
            state.boss.blackCurseLockTimer = BLACK_CURSE_LOCK_TIME;
            updateHud();
            toast('黑咒侍从 · 血咒锁定', '蛇身被法阵灼伤 3 格 · 后续弹幕追踪 8 秒');
          }
        }
      }
      if (rune.age >= rune.warning + rune.active) {
        rune.mesh.visible = false;
        state.blackCurseRunes.splice(k, 1);
      }
    }
  }

  function spawnBlackPool(i, j, life = 4.2) {
    const mesh = blackPoolPool.find((item) => !item.visible);
    if (!mesh) return;
    i = Math.max(0, Math.min(N - 2, Math.round(i)));
    j = Math.max(0, Math.min(N - 2, Math.round(j)));
    mesh.position.set(cellX(i + 0.5), 0.1, cellZ(j + 0.5));
    mesh.material.opacity = 0;
    mesh.scale.setScalar(0.7);
    mesh.visible = true;
    state.blackPools.push({ mesh, i, j, life, maxLife: life, hit: false });
  }

  function updateBlackPools(dt) {
    for (let k = state.blackPools.length - 1; k >= 0; k--) {
      const pool = state.blackPools[k];
      pool.life -= dt;
      const fade = Math.min(1, (pool.maxLife - pool.life) * 4, pool.life * 2);
      pool.mesh.material.opacity = Math.max(0, fade * 0.62);
      pool.mesh.scale.setScalar(0.75 + Math.min(1, (pool.maxLife - pool.life) * 3) * 0.25);
      if (!pool.hit && bodyInBlackArea(pool.i, pool.j)) {
        pool.hit = true;
        state.slowTimer = Math.max(state.slowTimer, 2.5);
        damage(1, 'hazard');
        if (state.over) return;
      }
      if (pool.life <= 0) {
        pool.mesh.visible = false;
        state.blackPools.splice(k, 1);
      }
    }
  }

  function spawnBlackBeam({
    x, z, angle, length = 18, width = 0.7, warning = 0.9,
    active = 1.2, color = 0xff3732, spin = 0,
  }) {
    const mesh = blackBeamPool.find((item) => !item.visible);
    if (!mesh) return null;
    mesh.material.color.setHex(color);
    mesh.material.opacity = 0;
    mesh.visible = true;
    mesh.position.set(x, 0.25, z);
    const effect = {
      mesh, x, z, angle, length, width, warning, active, spin,
      age: 0, hit: false,
    };
    state.blackBeamEffects.push(effect);
    return effect;
  }

  function blackBodyHitsBeam(effect) {
    const dirX = Math.cos(effect.angle);
    const dirZ = Math.sin(effect.angle);
    return state.cells.some((cell) => {
      const dx = cellX(cell.i) - effect.x;
      const dz = cellZ(cell.j) - effect.z;
      const projection = dx * dirX + dz * dirZ;
      if (projection < 0 || projection > effect.length) return false;
      return Math.abs(-dx * dirZ + dz * dirX) <= effect.width * 0.52;
    });
  }

  function updateBlackBeams(dt) {
    for (let k = state.blackBeamEffects.length - 1; k >= 0; k--) {
      const effect = state.blackBeamEffects[k];
      effect.age += dt;
      if (effect.spin) effect.angle += effect.spin * dt;
      const active = effect.age >= effect.warning;
      effect.mesh.rotation.y = Math.atan2(-Math.sin(effect.angle), Math.cos(effect.angle));
      effect.mesh.scale.set(effect.length, effect.width, 1);
      if (active) {
        effect.mesh.material.opacity = 0.58 + Math.sin(state.time * 24) * 0.12;
        if (!effect.hit && blackBodyHitsBeam(effect)) {
          effect.hit = true;
          damage(1, 'projectile');
          if (state.over) return;
        }
      } else {
        effect.mesh.material.opacity = 0.12 + (effect.age / effect.warning) * 0.28;
      }
      if (effect.age >= effect.warning + effect.active) {
        effect.mesh.visible = false;
        state.blackBeamEffects.splice(k, 1);
      }
    }
  }

  function spawnBlackClonePair(b) {
    const offsets = [
      { x: b.x - 12, z: b.z + 7 },
      { x: b.x + 12, z: b.z + 7 },
    ];
    for (let i = 0; i < blackClones.length; i++) {
      const mesh = blackClones[i];
      const point = offsets[i];
      mesh.position.set(point.x, 0.54, point.z);
      mesh.scale.setScalar(0.92);
      mesh.material.opacity = 0;
      mesh.visible = true;
      state.blackClones.push({ mesh, x: point.x, z: point.z, age: 0, fired: false, side: i });
    }
  }

  function updateBlackClones(dt) {
    for (let k = state.blackClones.length - 1; k >= 0; k--) {
      const clone = state.blackClones[k];
      clone.age += dt;
      clone.mesh.material.opacity = Math.min(0.44, clone.age * 1.4) *
        Math.max(0, Math.min(1, 2.1 - clone.age));
      clone.mesh.position.y = 0.54 + Math.sin(state.time * 3 + clone.side) * 0.06;
      if (!clone.fired && clone.age >= 0.78) {
        clone.fired = true;
        const target = headPosition(_tmpA);
        const base = Math.atan2(target.z - clone.z, target.x - clone.x);
        for (let shot = -2; shot <= 2; shot++) {
          const angle = base + shot * 0.13;
          spawnBossBullet(
            clone.x, clone.z,
            Math.cos(angle) * 4.7,
            Math.sin(angle) * 4.7,
            4.4
          );
        }
      }
      if (clone.age >= 2.1) {
        clone.mesh.visible = false;
        state.blackClones.splice(k, 1);
      }
    }
  }

  function clearBlackGorgeEffects() {
    state.blackRunes.forEach((rune) => { rune.mesh.visible = false; });
    state.blackRunes.length = 0;
    state.blackCurseRunes.forEach((rune) => { rune.mesh.visible = false; });
    state.blackCurseRunes.length = 0;
    state.blackPools.forEach((pool) => { pool.mesh.visible = false; });
    state.blackPools.length = 0;
    state.blackBeamEffects.forEach((effect) => { effect.mesh.visible = false; });
    state.blackBeamEffects.length = 0;
    state.blackClones.forEach((clone) => { clone.mesh.visible = false; });
    state.blackClones.length = 0;
    state.blackMistClones.forEach((clone) => { clone.mesh.visible = false; });
    state.blackMistClones.length = 0;
    state.bloodSlavePools.forEach((pool) => { pool.mesh.visible = false; });
    state.bloodSlavePools.length = 0;
    state.bloodSlaveClaws.forEach((claw) => { claw.mesh.visible = false; });
    state.bloodSlaveClaws.length = 0;
    state.blackWizardCurseFields.forEach((field) => { field.mesh.visible = false; });
    state.blackWizardCurseFields.length = 0;
    state.blackWizardArrows.forEach((arrow) => { arrow.mesh.visible = false; });
    state.blackWizardArrows.length = 0;
    if (state.blackWizardSummon) state.blackWizardSummon.mesh.visible = false;
    state.blackWizardSummon = null;
    blackWizardFieldWarningRing.visible = false;
    blackWizardFieldWarningRing.material.opacity = 0;
    blackRunePool.forEach((mesh) => { mesh.visible = false; });
    blackCurseRunePool.forEach((mesh) => { mesh.visible = false; });
    blackCurseBulletPool.forEach((mesh) => { mesh.visible = false; });
    blackMistCloneMeshes.forEach((mesh) => { mesh.visible = false; });
    blackMistBulletPool.forEach((mesh) => { mesh.visible = false; });
    blackWizardCurseFieldPool.forEach((mesh) => { mesh.visible = false; });
    blackWizardArrowPool.forEach((mesh) => { mesh.visible = false; });
    blackWizardCurseMarks.forEach((mesh) => { mesh.visible = false; });
    blackWizardSummonMesh.visible = false;
    blackPoolPool.forEach((mesh) => { mesh.visible = false; });
    bloodSlavePoolPool.forEach((mesh) => { mesh.visible = false; });
    bloodSlaveClawPool.forEach((mesh) => { mesh.visible = false; });
    blackBeamPool.forEach((mesh) => { mesh.visible = false; });
    blackClones.forEach((mesh) => {
      mesh.visible = false;
      mesh.material.opacity = 0;
    });
    bloodFilmRig.visible = false;
    bloodRageEyeRig.visible = false;
    bossPlaneMat.opacity = 1;
    bossPlaneMat.color.setHex(0xffffff);
  }

  function updateBlackGorgeEffects(dt) {
    updateBlackRunes(dt);
    updateBlackCurseRunes(dt);
    updateBlackPools(dt);
    updateBlackBeams(dt);
    updateBlackClones(dt);
  }

  function moveBlackBossToward(b, target, speed, dt) {
    const dx = target.x - b.x;
    const dz = target.z - b.z;
    const distance = Math.hypot(dx, dz) || 1;
    if (distance > 8.5) {
      b.x += (dx / distance) * speed * dt;
      b.z += (dz / distance) * speed * dt;
    } else if (distance < 5) {
      b.x -= (dx / distance) * speed * 0.42 * dt;
      b.z -= (dz / distance) * speed * 0.42 * dt;
    }
    b.x = Math.max(-HALF + 2, Math.min(HALF - 2, b.x));
    b.z = Math.max(-HALF + 2, Math.min(HALF - 2, b.z));
  }

  function blackBossContact(b, dt, radius = 3, damageAmount = 2) {
    if (b.cool > 0) b.cool = Math.max(0, b.cool - dt);
    if (bodyDistanceSq(b.x, b.z) < radius * radius && b.cool <= 0) {
      b.cool = 1.35;
      damage(damageAmount, 'contact');
    }
  }

  function updateBlackCurseServant(b, dt, hp) {
    bossPlaneMat.opacity = 1;
    b.x = cellX(BLACK_CURSE_BOSS_CELL.i);
    b.z = cellZ(BLACK_CURSE_BOSS_CELL.j);
    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.z = Math.sin(state.time * 1.8) * 0.028;
    bossMesh.scale.setScalar((b.renderScale || 2.05) * (1 + Math.sin(state.time * 2.3) * 0.022));
    blackBossContact(b, dt, 3, 1);
    if (state.over) return;

    b.blackCurseLockTimer = Math.max(0, b.blackCurseLockTimer - dt);
    b.blackCurseBulletTimer -= dt;
    b.blackCurseRuneTimer -= dt;

    const readySkills = [];
    if (b.blackCurseBulletTimer <= 0) readySkills.push('bullets');
    if (b.blackCurseRuneTimer <= 0) readySkills.push('runes');
    if (readySkills.length > 0) {
      const skill = readySkills[randInt(readySkills.length)];
      b.blackCurseSkillCycle += 1;
      if (skill === 'bullets') {
        b.blackCurseBulletTimer = BLACK_CURSE_BULLET_INTERVAL;
        const homing = b.blackCurseLockTimer > 0;
        fireBlackCurseBulletCurtain(b, homing);
        toast(
          '黑咒侍从 · 深渊弹幕',
          homing
            ? '27 发黑咒弹幕贯穿全场 · 血咒锁定追踪中'
            : '27 发黑咒弹幕贯穿全场 · 触碰障碍前持续飞行'
        );
      } else {
        b.blackCurseRuneTimer = BLACK_CURSE_RUNE_INTERVAL;
        spawnBlackCurseRuneWave();
        toast('黑咒侍从 · 三重禁阵', '三处 8×8 法阵生成 · 2 秒后灼伤并锁定本体');
      }
    }

    const hudSignature = [
      Math.ceil(b.blackCurseLockTimer),
      Math.ceil(b.blackCurseBulletTimer),
      Math.ceil(b.blackCurseRuneTimer),
    ].join(':');
    if (b.blackCurseHudSignature !== hudSignature) {
      b.blackCurseHudSignature = hudSignature;
      updateHud();
    }
  }

  function bloodSlaveDamage(b, baseDamage) {
    return baseDamage * (b.bloodRageTimer > 0 ? BLOOD_SLAVE_RAGE_MULT : 1);
  }

  function healBloodSlave(b, amount) {
    if (!b || !b.alive || amount <= 0 || b.hp >= b.max) return;
    b.hp = Math.min(b.max, b.hp + amount);
    updateHud();
  }

  function bloodSlaveBasicContact(b, dt) {
    if (b.cool > 0) b.cool = Math.max(0, b.cool - dt);
    if (bodyDistanceSq(b.x, b.z) >= 2.8 * 2.8 || b.cool > 0) return;
    b.cool = 1.35;
    const damageBefore = state.damageTaken;
    damage(bloodSlaveDamage(b, 1), 'contact');
    if (!state.over && state.damageTaken > damageBefore && b.bloodFilmTimer > 0) {
      healBloodSlave(b, BLOOD_SLAVE_FILM_HEAL);
    }
  }

  function startBloodSlaveClaw(b, hp) {
    if (b.bloodState !== 'stalk') return false;
    const dx = hp.x - b.x;
    const dz = hp.z - b.z;
    const distance = Math.hypot(dx, dz) || 1;
    const dirX = dx / distance;
    const dirZ = dz / distance;
    const dashDistance = Math.max(0, distance - 2.1);
    b.bloodState = 'clawWindup';
    b.bloodStateTimer = BLOOD_SLAVE_CLAW_WINDUP;
    b.bloodClawCooldown = BLOOD_SLAVE_CLAW_COOLDOWN;
    b.bloodClawTarget = { x: hp.x, z: hp.z };
    b.bloodClawAngle = Math.atan2(dz, dx);
    b.bloodClawFrom = { x: b.x, z: b.z };
    b.bloodClawTo = {
      x: Math.max(-HALF + 1.5, Math.min(HALF - 1.5, b.x + dirX * dashDistance)),
      z: Math.max(-HALF + 1.5, Math.min(HALF - 1.5, b.z + dirZ * dashDistance)),
    };
    toast('畸变血奴 · 裂肉三爪', '十二格内锁定蛇头 · 短距扑击后三连裂爪');
    return true;
  }

  function spawnBloodSlaveClawEffect(x, z, angle, index) {
    const mesh = bloodSlaveClawPool.find((item) => !item.visible);
    if (!mesh) return;
    const offset = (index - 1) * 0.34;
    const baseScale = 0.92 + index * 0.04;
    mesh.position.set(x + Math.cos(angle + Math.PI / 2) * offset, 0.22,
      z + Math.sin(angle + Math.PI / 2) * offset);
    mesh.rotation.y = -angle + (index - 1) * 0.1;
    mesh.scale.setScalar(baseScale);
    mesh.material.opacity = 0.94;
    mesh.visible = true;
    state.bloodSlaveClaws.push({
      mesh,
      life: 0.48,
      maxLife: 0.48,
      baseScale,
    });
  }

  function resolveBloodSlaveClaw(b) {
    const target = b.bloodClawTarget;
    if (!target) return;
    for (let index = 0; index < 3; index++) {
      spawnBloodSlaveClawEffect(target.x, target.z, b.bloodClawAngle || 0, index);
    }
    const damageBefore = state.damageTaken;
    if (bodyDistanceSq(target.x, target.z) <=
      BLOOD_SLAVE_CLAW_HIT_RADIUS * BLOOD_SLAVE_CLAW_HIT_RADIUS) {
      damage(bloodSlaveDamage(b, BLOOD_SLAVE_CLAW_DAMAGE), 'contact');
    }
    if (!state.over && state.damageTaken > damageBefore) {
      if (b.bloodFilmTimer > 0) healBloodSlave(b, BLOOD_SLAVE_FILM_HEAL);
      toast('畸变血奴 · 三爪命中', b.bloodRageTimer > 0 ? '狂暴伤害 ×2' : '蛇身连续撕裂');
    }
  }

  function spawnBloodSlavePool(x, z) {
    const mesh = bloodSlavePoolPool.find((item) => !item.visible);
    if (!mesh) return;
    x = Math.max(-HALF + BLOOD_SLAVE_POOL_RADIUS, Math.min(HALF - BLOOD_SLAVE_POOL_RADIUS, x));
    z = Math.max(-HALF + BLOOD_SLAVE_POOL_RADIUS, Math.min(HALF - BLOOD_SLAVE_POOL_RADIUS, z));
    mesh.position.set(x, 0.12, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.setScalar(0.88);
    mesh.material.opacity = 0;
    mesh.visible = true;
    state.bloodSlavePools.push({
      mesh,
      x,
      z,
      life: BLOOD_SLAVE_POOL_LIFE,
      maxLife: BLOOD_SLAVE_POOL_LIFE,
      rageTriggered: false,
    });
  }

  function startBloodSlavePound(b) {
    if (b.bloodState !== 'stalk') return false;
    b.bloodState = 'poundWindup';
    b.bloodStateTimer = 0.55;
    b.bloodPoolCooldown = BLOOD_SLAVE_POOL_COOLDOWN;
    toast('畸变血奴 · 裂胸血雨', '捶打胸膛后将在地图上随机泼洒四片 6×6 血滩');
    return true;
  }

  function chooseBloodSlavePoolCenters(b) {
    const limit = HALF - BLOOD_SLAVE_POOL_RADIUS;
    const centers = [];
    const fallbackPoints = [
      [-14, -14], [14, -14], [-14, 14], [14, 14],
      [0, -15], [0, 15], [-15, 0], [15, 0],
      [-8, -16], [8, 16], [-16, 8], [16, -8],
    ];

    for (let index = 0; index < BLOOD_SLAVE_POOL_COUNT; index++) {
      let chosen = null;
      for (let tries = 0; tries < 200; tries++) {
        const candidate = {
          x: (Math.random() * 2 - 1) * limit,
          z: (Math.random() * 2 - 1) * limit,
        };
        if (Math.hypot(candidate.x - b.x, candidate.z - b.z) <
          BLOOD_SLAVE_POOL_MIN_BOSS_DISTANCE) continue;
        if (centers.some((center) => (
          Math.hypot(center.x - candidate.x, center.z - candidate.z) <
          BLOOD_SLAVE_POOL_MIN_SPACING
        ))) continue;
        chosen = candidate;
        break;
      }
      if (!chosen) {
        const fallback = fallbackPoints.find(([x, z]) => (
          Math.hypot(x - b.x, z - b.z) >= BLOOD_SLAVE_POOL_MIN_BOSS_DISTANCE &&
          centers.every((center) => (
            Math.hypot(center.x - x, center.z - z) >= BLOOD_SLAVE_POOL_MIN_SPACING
          ))
        ));
        chosen = fallback
          ? { x: fallback[0], z: fallback[1] }
          : { x: (Math.random() * 2 - 1) * limit, z: (Math.random() * 2 - 1) * limit };
      }
      centers.push(chosen);
    }
    return centers;
  }

  function resolveBloodSlavePound(b) {
    chooseBloodSlavePoolCenters(b)
      .forEach((center) => spawnBloodSlavePool(center.x, center.z));
    toast('畸变血奴 · 血滩喷涌', '四片 6×6 血滩随机散布地图 · 踩中减速并触发红眼狂暴');
  }

  function updateBloodSlavePools(b, dt) {
    for (let k = state.bloodSlavePools.length - 1; k >= 0; k--) {
      const pool = state.bloodSlavePools[k];
      pool.life -= dt;
      const age = pool.maxLife - pool.life;
      const fade = Math.min(1, age * 5, Math.max(0, pool.life) * 2);
      pool.mesh.material.opacity = fade * 0.92;
      pool.mesh.scale.setScalar(
        0.88 + Math.min(1, age * 5) * 0.12 +
        Math.sin(state.time * 3.4 + pool.x) * 0.012
      );
      if (state.cells.some((cell) => (
        Math.hypot(cellX(cell.i) - pool.x, cellZ(cell.j) - pool.z) <=
        BLOOD_SLAVE_POOL_RADIUS
      ))) {
        state.slowTimer = Math.max(state.slowTimer, 0.5);
        if (!pool.rageTriggered) {
          pool.rageTriggered = true;
          b.bloodRageTimer = BLOOD_SLAVE_RAGE_TIME;
          b.bloodRageStacks = Math.min(BLOOD_SLAVE_POOL_COUNT, (b.bloodRageStacks || 0) + 1);
          updateHud();
          toast('畸变血奴 · 红眼狂暴', '血滩触发狂暴增伤 · 5 秒内伤害 ×2');
        }
        damage(bloodSlaveDamage(b, BLOOD_SLAVE_POOL_DAMAGE), 'hazard');
        if (state.over) return;
      }
      if (pool.life <= 0) {
        pool.mesh.visible = false;
        state.bloodSlavePools.splice(k, 1);
      }
    }
  }

  function updateBloodSlaveClawEffects(dt) {
    for (let k = state.bloodSlaveClaws.length - 1; k >= 0; k--) {
      const claw = state.bloodSlaveClaws[k];
      claw.life -= dt;
      const progress = 1 - Math.max(0, claw.life / claw.maxLife);
      claw.mesh.material.opacity = Math.max(0, 0.94 * (1 - progress));
      claw.mesh.scale.setScalar(claw.baseScale + progress * 0.16);
      if (claw.life <= 0) {
        claw.mesh.visible = false;
        state.bloodSlaveClaws.splice(k, 1);
      }
    }
  }

  function updateBloodSlavePassive(b, dt) {
    if (b.bloodFilmTimer > 0) {
      b.bloodFilmTimer = Math.max(0, b.bloodFilmTimer - dt);
      if (b.bloodFilmTimer === 0) {
        b.bloodFilmCooldown = BLOOD_SLAVE_FILM_COOLDOWN;
        updateHud();
      }
    } else {
      b.bloodFilmCooldown = Math.max(0, b.bloodFilmCooldown - dt);
      if (b.bloodFilmCooldown === 0) {
        b.bloodFilmTimer = BLOOD_SLAVE_FILM_DURATION;
        toast('畸变血奴 · 血膜再生', '血膜持续 5 秒 · 普通攻击命中蛇身可为自身回复 1 格');
      }
    }

    b.bloodRageTimer = Math.max(0, b.bloodRageTimer - dt);
    if (b.bloodRageTimer === 0) b.bloodRageStacks = 0;
    const filmActive = b.bloodFilmTimer > 0;
    bloodFilmRig.visible = filmActive;
    bloodFilmRig.position.set(b.x, 0, b.z);
    if (filmActive) {
      const pulse = 1 + Math.sin(state.time * 5.2) * 0.045;
      bloodFilmRig.scale.setScalar(pulse);
      bloodFilmDisc.material.opacity = 0.16 + Math.sin(state.time * 4.1) * 0.05;
      bloodFilmRings[0].scale.setScalar(1 + Math.sin(state.time * 5.4) * 0.045);
      bloodFilmRings[1].scale.setScalar(1 + Math.sin(state.time * 4.6 + 1.2) * 0.06);
    }
    bloodRageEyeRig.visible = b.bloodRageTimer > 0;
    if (bloodRageEyeRig.visible) {
      bloodRageEyeRig.position.set(b.x, 0, b.z);
      bloodRageEyeRig.scale.setScalar(1 + Math.sin(state.time * 16) * 0.08);
    }
    bossPlaneMat.color.setHex(b.bloodRageTimer > 0 ? 0xff8b82 : 0xffffff);
    const hudSignature = [
      Math.ceil(b.bloodFilmTimer),
      Math.ceil(b.bloodFilmCooldown),
      Math.ceil(b.bloodRageTimer),
      b.bloodRageStacks || 0,
    ].join(':');
    if (b.bloodHudSignature !== hudSignature) {
      b.bloodHudSignature = hudSignature;
      updateHud();
    }
  }

  function updateBloodSlave(b, dt, hp) {
    bossPlaneMat.opacity = 1;
    b.bloodClawCooldown = Math.max(0, b.bloodClawCooldown - dt);
    b.bloodPoolCooldown = Math.max(0, b.bloodPoolCooldown - dt);
    updateBloodSlavePassive(b, dt);
    updateBloodSlavePools(b, dt);
    updateBloodSlaveClawEffects(dt);
    if (state.over) return;

    if (b.bloodState === 'clawWindup') {
      b.bloodStateTimer = Math.max(0, b.bloodStateTimer - dt);
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = Math.sin(state.time * 24) * 0.035;
      bossMesh.scale.setScalar((b.renderScale || 2.05) *
        (1 + (1 - b.bloodStateTimer / BLOOD_SLAVE_CLAW_WINDUP) * 0.08));
      if (b.bloodStateTimer === 0) {
        b.bloodState = 'clawDash';
        b.bloodStateTimer = BLOOD_SLAVE_CLAW_DASH_TIME;
      }
      return;
    }

    if (b.bloodState === 'clawDash') {
      b.bloodStateTimer = Math.max(0, b.bloodStateTimer - dt);
      const progress = 1 - b.bloodStateTimer / BLOOD_SLAVE_CLAW_DASH_TIME;
      const eased = progress * progress * (3 - 2 * progress);
      b.x = b.bloodClawFrom.x + (b.bloodClawTo.x - b.bloodClawFrom.x) * eased;
      b.z = b.bloodClawFrom.z + (b.bloodClawTo.z - b.bloodClawFrom.z) * eased;
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = Math.sin(progress * Math.PI) * 0.14;
      bossMesh.scale.setScalar((b.renderScale || 2.05) * 0.96);
      if (b.bloodStateTimer === 0) {
        resolveBloodSlaveClaw(b);
        if (state.over) return;
        b.bloodState = 'clawRecover';
        b.bloodStateTimer = BLOOD_SLAVE_CLAW_RECOVER;
      }
      return;
    }

    if (b.bloodState === 'clawRecover') {
      b.bloodStateTimer = Math.max(0, b.bloodStateTimer - dt);
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = -0.1 + Math.sin(state.time * 10) * 0.025;
      bossMesh.scale.setScalar((b.renderScale || 2.05) * 0.93);
      if (b.bloodStateTimer === 0) b.bloodState = 'stalk';
      return;
    }

    if (b.bloodState === 'poundWindup') {
      b.bloodStateTimer = Math.max(0, b.bloodStateTimer - dt);
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = Math.sin(state.time * 20) * 0.06;
      bossMesh.scale.setScalar((b.renderScale || 2.05) *
        (1 + Math.sin((0.55 - b.bloodStateTimer) * 18) * 0.055));
      if (b.bloodStateTimer === 0) {
        resolveBloodSlavePound(b);
        b.bloodState = 'poundRecover';
        b.bloodStateTimer = 0.42;
      }
      return;
    }

    if (b.bloodState === 'poundRecover') {
      b.bloodStateTimer = Math.max(0, b.bloodStateTimer - dt);
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = -0.06;
      bossMesh.scale.setScalar((b.renderScale || 2.05) * 0.95);
      if (b.bloodStateTimer === 0) b.bloodState = 'stalk';
      return;
    }

    moveBlackBossToward(b, hp, 1.18, dt);
    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.z = Math.sin(state.time * 2.1) * 0.04;
    bossMesh.scale.setScalar((b.renderScale || 2.05) *
      (1 + Math.sin(state.time * 3) * 0.025));
    bloodSlaveBasicContact(b, dt);
    if (state.over) return;
    const distance = Math.hypot(hp.x - b.x, hp.z - b.z);
    if (distance <= BLOOD_SLAVE_CLAW_RANGE && b.bloodClawCooldown <= 0) {
      startBloodSlaveClaw(b, hp);
    } else if (b.bloodPoolCooldown <= 0) {
      startBloodSlavePound(b);
    }
  }

  function spawnBlackMistBullet(x, z, angle, speed = BLACK_MIST_BULLET_SPEED) {
    const mesh = blackMistBulletPool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.position.set(x, 0.55, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.setScalar(1);
    mesh.visible = true;
    state.enemyBullets.push({
      mesh,
      x,
      z,
      vx: Math.cos(angle) * speed,
      vz: Math.sin(angle) * speed,
      life: 4.8,
      blackMist: true,
    });
  }

  function fireBlackMistRing(source, count = 8, speed = BLACK_MIST_BULLET_SPEED, offset = 0) {
    for (let shot = 0; shot < count; shot++) {
      const angle = offset + (shot / count) * Math.PI * 2 + state.time * 0.4;
      spawnBlackMistBullet(source.x, source.z, angle, speed);
    }
  }

  function chooseBlackMistCloneCell(used = []) {
    const head = state.cells[0] || BOSS_CELL;
    for (let tries = 0; tries < 100; tries++) {
      const cell = randomFreeCell();
      if (Math.abs(cell.i - head.i) + Math.abs(cell.j - head.j) < 8) continue;
      if (used.some((other) => Math.abs(other.i - cell.i) + Math.abs(other.j - cell.j) < 8)) {
        continue;
      }
      return cell;
    }
    return randomFreeCell();
  }

  function clearBlackMistClones(b = state.boss, announce = false) {
    state.blackMistClones.forEach((clone) => { clone.mesh.visible = false; });
    state.blackMistClones.length = 0;
    if (b && b.kind === 'black_mist_servant') {
      b.blackMistCloneHits = 0;
      b.blackMistSplitTimer = BLACK_MIST_CLONE_SPLIT_INTERVAL;
      updateHud();
    }
    if (announce) toast('黑雾魔侍 · 分身崩解', '本体连续承受 3 次弹丸攻击 · 10 秒后再次分裂');
  }

  function spawnBlackMistClones(b) {
    if (state.blackMistClones.length > 0) return false;
    const used = [];
    for (let index = 0; index < BLACK_MIST_CLONE_COUNT; index++) {
      const cell = chooseBlackMistCloneCell(used);
      used.push(cell);
      const mesh = blackMistCloneMeshes[index];
      mesh.position.set(cellX(cell.i), 0.62, cellZ(cell.j));
      mesh.visible = true;
      state.blackMistClones.push({
        mesh,
        x: cellX(cell.i),
        z: cellZ(cell.j),
        mistState: 'solid',
        stateTimer: BLACK_MIST_SOLID_TIME,
        volleyTimer: 0.7 + index * 0.22,
        teleported: false,
        target: null,
        hitFlash: 0,
        phase: Math.random() * Math.PI * 2,
      });
    }
    b.blackMistCloneHits = 0;
    b.blackMistSplitTimer = BLACK_MIST_CLONE_SPLIT_INTERVAL;
    updateHud();
    toast('黑雾魔侍 · 雾影分裂', '两个同体积分身出现 · 攻击本体 3 次可令分身崩解');
    return true;
  }

  function blackMistBlockingClone(x, z, radius = BLACK_MIST_CLONE_HIT_RADIUS) {
    return state.blackMistClones.find((clone) => (
      clone.mistState === 'solid' &&
      Math.hypot(clone.x - x, clone.z - z) <= radius
    )) || null;
  }

  function registerBlackMistBossHit() {
    const b = state.boss;
    if (!b || b.kind !== 'black_mist_servant' || state.blackMistClones.length === 0) return;
    b.blackMistCloneHits = Math.min(
      BLACK_MIST_CLONE_BREAK_HITS,
      (b.blackMistCloneHits || 0) + 1
    );
    updateHud();
    if (b.blackMistCloneHits >= BLACK_MIST_CLONE_BREAK_HITS) {
      clearBlackMistClones(b, true);
    }
  }

  function updateBlackMistClone(clone, dt) {
    clone.hitFlash = Math.max(0, clone.hitFlash - dt);
    if (clone.mistState === 'mist') {
      clone.stateTimer = Math.max(0, clone.stateTimer - dt);
      const half = BLACK_MIST_TIME * 0.5;
      if (clone.stateTimer <= half && !clone.teleported) {
        clone.teleported = true;
        const target = chooseBlackMistCloneCell(
          state.blackMistClones.filter((other) => other !== clone)
            .map((other) => ({ i: Math.round(other.x + HALF), j: Math.round(other.z + HALF) }))
        );
        clone.x = cellX(target.i);
        clone.z = cellZ(target.j);
      }
      clone.mesh.material.opacity = Math.max(0.12, clone.stateTimer / BLACK_MIST_TIME * 0.42);
      clone.mesh.position.set(clone.x, 0.62, clone.z);
      clone.mesh.scale.setScalar(2.05 * (1.03 - clone.stateTimer * 0.04));
      if (clone.stateTimer === 0) {
        clone.mistState = 'solid';
        clone.stateTimer = BLACK_MIST_SOLID_TIME;
        clone.volleyTimer = 0.55;
        clone.teleported = false;
        clone.mesh.material.opacity = 0.88;
        clone.mesh.scale.setScalar(2.05);
        fireBlackMistRing(clone, 14, BLACK_MIST_BULLET_BURST_SPEED, state.time * 0.3);
      }
      return;
    }

    clone.stateTimer = Math.max(0, clone.stateTimer - dt);
    clone.volleyTimer -= dt;
    clone.mesh.material.opacity = 0.84 + Math.sin(state.time * 4 + clone.phase) * 0.06;
    clone.mesh.material.color.setHex(clone.hitFlash > 0 ? 0xffffff : 0xffb0aa);
    clone.mesh.position.set(
      clone.x,
      0.62 + Math.sin(state.time * 4.2 + clone.phase) * 0.035,
      clone.z
    );
    clone.mesh.scale.setScalar(2.05 * (1 + Math.sin(state.time * 3.2 + clone.phase) * 0.018));
    if (clone.volleyTimer <= 0) {
      clone.volleyTimer = 1.7;
      fireBlackMistRing(clone, 8, BLACK_MIST_BULLET_SPEED, clone.phase);
    }
    if (clone.stateTimer === 0) {
      clone.mistState = 'mist';
      clone.stateTimer = BLACK_MIST_TIME;
      clone.teleported = false;
    }
  }

  function updateBlackMistServant(b, dt, hp) {
    b.blackMistSplitTimer = Math.max(0, b.blackMistSplitTimer - dt);
    if (b.blackMistSplitTimer === 0) {
      if (state.blackMistClones.length === 0) spawnBlackMistClones(b);
      else b.blackMistSplitTimer = BLACK_MIST_CLONE_SPLIT_INTERVAL;
    }
    state.blackMistClones.forEach((clone) => updateBlackMistClone(clone, dt));

    if (b.blackState === 'mist') {
      b.blackStateTimer = Math.max(0, b.blackStateTimer - dt);
      const half = BLACK_MIST_TIME * 0.5;
      if (b.blackStateTimer <= half && !b.blackMistTeleported) {
        b.blackMistTeleported = true;
        b.x = b.blackMistTarget.x;
        b.z = b.blackMistTarget.z;
      }
      bossPlaneMat.opacity = Math.max(0.14, b.blackStateTimer / BLACK_MIST_TIME * 0.46);
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.scale.setScalar((b.renderScale || 2.05) * (1.04 - b.blackStateTimer * 0.05));
      if (b.blackStateTimer === 0) {
        b.blackState = 'solid';
        b.blackStateTimer = BLACK_MIST_SOLID_TIME;
        b.blackInvulnerable = false;
        b.blackVolleyTimer = 0.55;
        b.blackMistTeleported = false;
        bossPlaneMat.opacity = 1;
        fireBlackMistRing(b, 14, BLACK_MIST_BULLET_BURST_SPEED, state.time * 0.3);
        updateHud();
      }
    } else {
      b.blackStateTimer = Math.max(0, b.blackStateTimer - dt);
      moveBlackBossToward(b, hp, 1.12, dt);
      bossPlaneMat.opacity = 1;
      bossMesh.position.set(b.x, 0, b.z);
      bossMesh.rotation.z = Math.sin(state.time * 2.8) * 0.03;
      bossMesh.scale.setScalar((b.renderScale || 2.05) * (1 + Math.sin(state.time * 4.1) * 0.02));
      blackBossContact(b, dt, 2.9, 1);
      if (state.over) return;

      b.blackVolleyTimer -= dt;
      if (b.blackVolleyTimer <= 0) {
        b.blackVolleyTimer = 1.7;
        fireBlackMistRing(b, 8, BLACK_MIST_BULLET_SPEED);
      }

      if (b.blackStateTimer === 0) {
        b.blackState = 'mist';
        b.blackStateTimer = BLACK_MIST_TIME;
        b.blackInvulnerable = true;
        b.blackMistTeleported = false;
        const target = randomFreeCell();
        b.blackMistTarget = { x: cellX(target.i), z: cellZ(target.j) };
        spawnBlackRune(target.i - 0.5, target.j - 0.5, BLACK_MIST_TIME * 0.5, 0xa133ff);
        updateHud();
        toast('黑雾魔侍 · 雾化瞬移', '雾化期间免疫伤害 · 5 秒后完成下一次位移');
      }
    }

    const hudSignature = [
      Math.ceil(b.blackStateTimer),
      Math.ceil(b.blackMistSplitTimer),
      b.blackMistCloneHits || 0,
      state.blackMistClones.length,
      b.blackInvulnerable ? 1 : 0,
    ].join(':');
    if (b.blackMistHudSignature !== hudSignature) {
      b.blackMistHudSignature = hudSignature;
      updateHud();
    }
  }

  function blackWizardDamageAmount(b, baseDamage) {
    return baseDamage * (1 + (b.blackWizardCurseLayers || 0));
  }

  function addBlackWizardCurse(b, layers = 1) {
    const previous = b.blackWizardCurseLayers || 0;
    b.blackWizardCurseLayers = Math.min(
      BLACK_WIZARD_MAX_CURSE,
      previous + layers
    );
    b.blackWizardCurseDecayTimer = BLACK_WIZARD_CURSE_DECAY_TIME;
    if (b.blackWizardCurseLayers === previous) return false;
    updateHud();
    toast(
      `黑巫师 · 诅咒 ${b.blackWizardCurseLayers}/${BLACK_WIZARD_MAX_CURSE}`,
      `黑巫师造成的伤害提升至 ${1 + b.blackWizardCurseLayers} 倍`
    );
    return true;
  }

  function noteBlackWizardSkillHit(b, addCurse = false) {
    b.blackWizardCurseDecayTimer = BLACK_WIZARD_CURSE_DECAY_TIME;
    if (addCurse) addBlackWizardCurse(b, 1);
    else updateHud();
  }

  function dealBlackWizardDamage(b, baseDamage, source, addCurse = false, slowTime = 0) {
    const damageBefore = state.damageTaken;
    damage(blackWizardDamageAmount(b, baseDamage), source);
    if (state.over || state.damageTaken <= damageBefore) return false;
    noteBlackWizardSkillHit(b, addCurse);
    if (slowTime > 0) state.slowTimer = Math.max(state.slowTimer, slowTime);
    return true;
  }

  function updateBlackWizardCurseMarks(b, dt) {
    const head = headPosition(_tmpA);
    for (let index = 0; index < blackWizardCurseMarks.length; index++) {
      const mark = blackWizardCurseMarks[index];
      mark.visible = b.alive && index < b.blackWizardCurseLayers;
      if (!mark.visible) continue;
      const angle = state.time * 1.35 + (index / BLACK_WIZARD_MAX_CURSE) * Math.PI * 2;
      mark.position.set(
        head.x + Math.cos(angle) * 0.92,
        0.82 + Math.sin(state.time * 4 + index) * 0.025,
        head.z + Math.sin(angle) * 0.92
      );
      mark.rotation.y = -angle;
      mark.scale.setScalar(0.94 + Math.sin(state.time * 5 + index) * 0.06);
    }
  }

  function updateBlackWizardCurseState(b, dt) {
    if ((b.blackWizardCurseLayers || 0) > 0) {
      b.blackWizardCurseDecayTimer = Math.max(0, b.blackWizardCurseDecayTimer - dt);
      if (b.blackWizardCurseDecayTimer === 0) {
        b.blackWizardCurseLayers -= 1;
        b.blackWizardCurseDecayTimer = BLACK_WIZARD_CURSE_DECAY_TIME;
        updateHud();
        toast(
          '诅咒消退',
          b.blackWizardCurseLayers > 0
            ? `剩余 ${b.blackWizardCurseLayers} 层`
            : '诅咒已完全消退'
        );
      }
    }
    updateBlackWizardCurseMarks(b, dt);
  }

  function blackWizardBasicContact(b, dt) {
    if (b.cool > 0) b.cool = Math.max(0, b.cool - dt);
    if (bodyDistanceSq(b.x, b.z) >= 3.5 * 3.5 || b.cool > 0) return;
    b.cool = 1.35;
    dealBlackWizardDamage(b, 2, 'contact');
  }

  function spawnBlackWizardCurseField(b, hp) {
    state.blackWizardCurseFields.forEach((field) => { field.mesh.visible = false; });
    state.blackWizardCurseFields.length = 0;
    blackWizardFieldWarningRing.visible = false;
    const mesh = blackWizardCurseFieldPool.find((item) => !item.visible);
    if (!mesh) return;
    const limit = HALF - BLACK_WIZARD_CURSE_FIELD_SIZE / 2;
    const x = Math.max(-limit, Math.min(limit, hp.x));
    const z = Math.max(-limit, Math.min(limit, hp.z));
    mesh.position.set(x, 0.13, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.setScalar(1);
    mesh.material.opacity = 0;
    mesh.visible = false;
    blackWizardFieldWarningRing.position.set(x, 0.16, z);
    blackWizardFieldWarningRing.scale.setScalar(1);
    blackWizardFieldWarningRing.material.opacity = 0.82;
    blackWizardFieldWarningRing.visible = true;
    state.blackWizardCurseFields.push({
      mesh,
      x,
      z,
      warningTimer: BLACK_WIZARD_CURSE_FIELD_WARNING,
      life: BLACK_WIZARD_CURSE_FIELD_LIFE,
      maxLife: BLACK_WIZARD_CURSE_FIELD_LIFE,
    });
  }

  function updateBlackWizardCurseFields(b, dt) {
    for (let index = state.blackWizardCurseFields.length - 1; index >= 0; index--) {
      const field = state.blackWizardCurseFields[index];
      if (field.warningTimer > 0) {
        field.warningTimer = Math.max(0, field.warningTimer - dt);
        const warningProgress = 1 - field.warningTimer / BLACK_WIZARD_CURSE_FIELD_WARNING;
        blackWizardFieldWarningRing.position.set(field.x, 0.16, field.z);
        blackWizardFieldWarningRing.scale.setScalar(0.94 + warningProgress * 0.06);
        blackWizardFieldWarningRing.material.opacity =
          0.5 + Math.sin(state.time * 18) * 0.18 + warningProgress * 0.28;
        if (field.warningTimer === 0) {
          blackWizardFieldWarningRing.visible = false;
          blackWizardFieldWarningRing.material.opacity = 0;
          field.mesh.material.opacity = 0.2;
          field.mesh.visible = true;
        }
        continue;
      }
      field.life -= dt;
      const fade = Math.min(1, (field.maxLife - field.life) * 4, field.life * 2);
      field.mesh.material.opacity = Math.max(0, fade * 0.72);
      field.mesh.rotation.y += dt * 0.34;
      field.mesh.scale.setScalar(1 + Math.sin(state.time * 2.8) * 0.018);
      const containsBody = state.cells.some((cell) => (
        Math.hypot(cellX(cell.i) - field.x, cellZ(cell.j) - field.z) <=
        BLACK_WIZARD_CURSE_FIELD_SIZE / 2
      ));
      if (containsBody) {
        state.slowTimer = Math.max(state.slowTimer, 0.45);
        dealBlackWizardDamage(
          b,
          BLACK_WIZARD_CURSE_FIELD_DAMAGE,
          'hazard',
          true
        );
        if (state.over) return;
      }
      if (field.life <= 0) {
        field.mesh.visible = false;
        state.blackWizardCurseFields.splice(index, 1);
      }
    }
  }

  function spawnBlackWizardShadowArrow(x, z, angle) {
    const mesh = blackWizardArrowPool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.position.set(x, 0.42, z);
    mesh.rotation.y = -angle;
    mesh.visible = true;
    state.blackWizardArrows.push({
      mesh,
      x,
      z,
      vx: Math.cos(angle) * BLACK_WIZARD_ARROW_SPEED,
      vz: Math.sin(angle) * BLACK_WIZARD_ARROW_SPEED,
      angle,
      life: 2.2,
    });
  }

  function fireBlackWizardShadowArrows(b, hp) {
    const base = Math.atan2(hp.z - b.z, hp.x - b.x);
    for (let index = 0; index < BLACK_WIZARD_ARROW_COUNT; index++) {
      const lane = index - (BLACK_WIZARD_ARROW_COUNT - 1) / 2;
      const angle = base + lane * 0.025;
      const sideX = Math.cos(base + Math.PI / 2) * lane * 1.9;
      const sideZ = Math.sin(base + Math.PI / 2) * lane * 1.9;
      spawnBlackWizardShadowArrow(
        b.x + Math.cos(base) * 3.8 + sideX,
        b.z + Math.sin(base) * 3.8 + sideZ,
        angle
      );
    }
  }

  function updateBlackWizardShadowArrows(b, dt) {
    for (let index = state.blackWizardArrows.length - 1; index >= 0; index--) {
      const arrow = state.blackWizardArrows[index];
      arrow.life -= dt;
      arrow.x += arrow.vx * dt;
      arrow.z += arrow.vz * dt;
      arrow.mesh.position.set(arrow.x, 0.42, arrow.z);
      arrow.mesh.rotation.y = -arrow.angle;
      const ci = Math.round(arrow.x + HALF);
      const cj = Math.round(arrow.z + HALF);
      let dead = arrow.life <= 0 || Math.abs(arrow.x) > HALF + 2 ||
        Math.abs(arrow.z) > HALF + 2 || isObstacle(ci, cj);
      if (!dead) {
        const tailX = arrow.x - Math.cos(arrow.angle) * BLACK_WIZARD_ARROW_LENGTH;
        const tailZ = arrow.z - Math.sin(arrow.angle) * BLACK_WIZARD_ARROW_LENGTH;
        if (stormEagleDashTouchesBody(
          tailX,
          tailZ,
          arrow.x,
          arrow.z,
          BLACK_WIZARD_ARROW_WIDTH / 2
        )) {
          const hadCurse = (b.blackWizardCurseLayers || 0) > 0;
          dealBlackWizardDamage(
            b,
            BLACK_WIZARD_ARROW_DAMAGE,
            'projectile',
            true,
            hadCurse ? BLACK_WIZARD_ARROW_SLOW_TIME : 0
          );
          dead = true;
        }
      }
      if (dead) {
        arrow.mesh.visible = false;
        state.blackWizardArrows.splice(index, 1);
      }
    }
  }

  function clearBlackWizardSummon(announce = false) {
    if (!state.blackWizardSummon) return;
    state.blackWizardSummon.mesh.visible = false;
    state.blackWizardSummon = null;
    updateHud();
    if (announce) toast('黑巫师 · 召唤终结', '召唤物已从战场消失');
  }

  function spawnBlackWizardSummon(b) {
    clearBlackWizardSummon(false);
    const kinds = ['black_curse_servant', 'blood_slave', 'black_mist_servant'];
    const kind = kinds[randInt(kinds.length)];
    const head = state.cells[0] || BOSS_CELL;
    let cell = null;
    for (let tries = 0; tries < 100; tries++) {
      const candidate = randomFreeCell();
      if (Math.abs(candidate.i - head.i) + Math.abs(candidate.j - head.j) < 8) continue;
      if (Math.abs(candidate.i - BOSS_CELL.i) + Math.abs(candidate.j - BOSS_CELL.j) < 5) continue;
      cell = candidate;
      break;
    }
    cell = cell || randomFreeCell();
    const mesh = blackWizardSummonMesh;
    mesh.material.map = BOSS_TEX[kind] || BOSS_TEX.black_wizard || null;
    mesh.material.color.setHex(0xffffff);
    mesh.material.opacity = 0.92;
    mesh.material.needsUpdate = true;
    mesh.position.set(cellX(cell.i), 0.62, cellZ(cell.j));
    mesh.visible = true;
    state.blackWizardSummon = {
      kind,
      mesh,
      x: cellX(cell.i),
      z: cellZ(cell.j),
      hp: BLACK_WIZARD_SUMMON_HP,
      maxHp: BLACK_WIZARD_SUMMON_HP,
      life: BLACK_WIZARD_SUMMON_LIFE,
      shootTimer: 1.25,
      contactCool: 0,
      hitFlash: 0,
      teleportTimer: kind === 'black_mist_servant' ? 3 : 0,
    };
    updateHud();
    toast('黑巫师 · 终焉召令', '随机召唤一名终章 Boss · 5 次命中可击破 · 持续 15 秒');
  }

  function damageBlackWizardSummon(summon, amount = 1) {
    if (!summon || state.blackWizardSummon !== summon) return false;
    summon.hp -= amount;
    summon.hitFlash = 0.18;
    updateHud();
    if (summon.hp <= 0) {
      clearBlackWizardSummon(false);
      toast('黑巫师 · 召唤物被击破', '召唤物消散');
    }
    return true;
  }

  function blackWizardSummonAt(x, z, radius = 3.0) {
    const summon = state.blackWizardSummon;
    if (!summon || summon.hp <= 0) return null;
    return Math.hypot(summon.x - x, summon.z - z) <= radius ? summon : null;
  }

  function spawnWizardSummonBullet(summon, angle) {
    const mesh = bossBulletPool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.position.set(summon.x, 0.5, summon.z);
    mesh.visible = true;
    state.enemyBullets.push({
      mesh,
      x: summon.x,
      z: summon.z,
      vx: Math.cos(angle) * 4.1,
      vz: Math.sin(angle) * 4.1,
      life: 4.5,
      wizardSummonBullet: true,
    });
  }

  function updateBlackWizardSummon(b, dt) {
    const summon = state.blackWizardSummon;
    if (!summon) return;
    summon.life -= dt;
    summon.shootTimer -= dt;
    summon.contactCool = Math.max(0, summon.contactCool - dt);
    summon.hitFlash = Math.max(0, summon.hitFlash - dt);
    summon.mesh.material.color.setHex(summon.hitFlash > 0 ? 0xff6262 : 0xffffff);
    summon.mesh.material.opacity = 0.86 + Math.sin(state.time * 4.2) * 0.05;

    if (summon.kind === 'black_mist_servant') {
      summon.teleportTimer -= dt;
      if (summon.teleportTimer <= 0) {
        summon.teleportTimer = 3;
        const cell = randomFreeCell();
        summon.x = cellX(cell.i);
        summon.z = cellZ(cell.j);
      }
    } else {
      const head = headPosition(_tmpA);
      const dx = head.x - summon.x;
      const dz = head.z - summon.z;
      const distance = Math.hypot(dx, dz) || 1;
      const speed = summon.kind === 'blood_slave' ? 1.45 : 0.82;
      if (distance > 6) {
        summon.x += (dx / distance) * speed * dt;
        summon.z += (dz / distance) * speed * dt;
      }
    }

    summon.x = Math.max(-HALF + 2, Math.min(HALF - 2, summon.x));
    summon.z = Math.max(-HALF + 2, Math.min(HALF - 2, summon.z));
    summon.mesh.position.set(
      summon.x,
      0.62 + Math.sin(state.time * 3.4) * 0.035,
      summon.z
    );
    summon.mesh.scale.setScalar(2.05 * (1 + Math.sin(state.time * 3) * 0.018));

    if (bodyDistanceSq(summon.x, summon.z) < 2.7 * 2.7 && summon.contactCool <= 0) {
      summon.contactCool = 1.5;
      dealBlackWizardDamage(b, 1, 'contact');
    }
    if (summon.shootTimer <= 0) {
      summon.shootTimer = 2.2;
      const offset = state.time * 0.45;
      for (let shot = 0; shot < 6; shot++) {
        spawnWizardSummonBullet(summon, offset + (shot / 6) * Math.PI * 2);
      }
    }
    if (summon.life <= 0) clearBlackWizardSummon(true);
  }

  function setBlackWizardPose(b, pose) {
    b.blackWizardPose = pose;
    b.blackWizardPoseTimer = BLACK_WIZARD_CAST_POSE_TIME;
    bossPlaneMat.map = pose === 'summon'
      ? (BLACK_WIZARD_SUMMON_TEX || BOSS_TEX.black_wizard)
      : (BLACK_WIZARD_CAST_TEX || BOSS_TEX.black_wizard);
    bossPlaneMat.needsUpdate = true;
  }

  function updateBlackWizardPose(b, dt) {
    if (b.blackWizardPoseTimer <= 0) return;
    b.blackWizardPoseTimer = Math.max(0, b.blackWizardPoseTimer - dt);
    if (b.blackWizardPoseTimer === 0) {
      b.blackWizardPose = 'idle';
      bossPlaneMat.map = BOSS_TEX.black_wizard || null;
      bossPlaneMat.needsUpdate = true;
    }
  }

  function updateBlackWizard(b, dt, hp) {
    bossPlaneMat.opacity = 0.94 + Math.sin(state.time * 3) * 0.06;
    b.x = cellX(BOSS_CELL.i);
    b.z = cellZ(BOSS_CELL.j);
    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.z = Math.sin(state.time * 1.9) * 0.02;
    const displayScale = b.blackWizardPose === 'idle'
      ? (b.renderScale || BLACK_WIZARD_RENDER_SCALE)
      : BLACK_WIZARD_SKILL_RENDER_SCALE;
    bossMesh.scale.setScalar(displayScale * (1 + Math.sin(state.time * 2.5) * 0.02));
    updateBlackWizardPose(b, dt);
    updateBlackWizardCurseState(b, dt);
    updateBlackWizardCurseFields(b, dt);
    updateBlackWizardShadowArrows(b, dt);
    updateBlackWizardSummon(b, dt);
    if (state.over) return;
    blackWizardBasicContact(b, dt);

    b.blackWizardCurseFieldTimer -= dt;
    b.blackWizardArrowTimer -= dt;
    b.blackWizardSummonTimer -= dt;
    const readySkills = [];
    if (b.blackWizardCurseFieldTimer <= 0) readySkills.push('field');
    if (b.blackWizardArrowTimer <= 0) readySkills.push('arrows');
    if (b.blackWizardSummonTimer <= 0) readySkills.push('summon');
    if (readySkills.length > 0) {
      const skill = readySkills[randInt(readySkills.length)];
      if (skill === 'field') {
        b.blackWizardCurseFieldTimer = BLACK_WIZARD_CURSE_FIELD_INTERVAL;
        spawnBlackWizardCurseField(b, hp);
        setBlackWizardPose(b, 'cast');
        toast('黑巫师 · 十环诅咒', '红圈预警 1 秒 · 法阵生成后持续受伤并叠加诅咒');
      } else if (skill === 'arrows') {
        b.blackWizardArrowTimer = BLACK_WIZARD_ARROW_INTERVAL;
        fireBlackWizardShadowArrows(b, hp);
        setBlackWizardPose(b, 'cast');
        toast('黑巫师 · 三重暗影箭', '三支 2×5 高速暗影箭齐射 · 命中叠加诅咒');
      } else {
        b.blackWizardSummonTimer = BLACK_WIZARD_SUMMON_INTERVAL;
        spawnBlackWizardSummon(b);
        setBlackWizardPose(b, 'summon');
      }
    }

    const hudSignature = [
      Math.ceil(b.blackWizardCurseFieldTimer),
      Math.ceil(b.blackWizardArrowTimer),
      Math.ceil(b.blackWizardSummonTimer),
      b.blackWizardCurseLayers || 0,
      Math.ceil(b.blackWizardCurseDecayTimer),
      state.blackWizardSummon?.hp || 0,
      Math.ceil(state.blackWizardSummon?.life || 0),
    ].join(':');
    if (b.blackWizardHudSignature !== hudSignature) {
      b.blackWizardHudSignature = hudSignature;
      updateHud();
    }
  }

  function startStormEagleSummon(b) {
    const anchors = [];
    for (let index = 0; index < STORM_TORNADO_COUNT; index++) {
      anchors.push(chooseStormAnchor(anchors, true, STORM_TORNADO_FOOTPRINT));
    }
    anchors.forEach((anchor) => showStormWarning(anchor, 'tornado', STORM_TORNADO_WARNING));
    b.stormSummonState = 'warning';
    b.stormSummonTimer = STORM_TORNADO_WARNING;
    toast('风暴巨鹰 · 三重风暴', '三处 6×6 风眼预警 1 秒 · 持续 6 秒');
  }

  function chooseStormEagleDashTarget() {
    let fallback = null;
    let fallbackDistance = -1;
    for (let tries = 0; tries < 80; tries++) {
      const i = 3 + randInt(N - 6);
      const j = 3 + randInt(N - 6);
      if (isObstacle(i, j)) continue;
      const x = cellX(i);
      const z = cellZ(j);
      const distance = Math.hypot(x - state.boss.x, z - state.boss.z);
      if (distance > fallbackDistance) {
        fallback = { i, j, x, z };
        fallbackDistance = distance;
      }
      if (distance >= STORM_EAGLE_DASH_MIN_DISTANCE) return { i, j, x, z };
    }
    return fallback || {
      i: BOSS_CELL.i,
      j: BOSS_CELL.j,
      x: cellX(BOSS_CELL.i),
      z: cellZ(BOSS_CELL.j),
    };
  }

  function stormEagleDashTouchesBody(fromX, fromZ, toX, toZ, radius) {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const lengthSq = dx * dx + dz * dz;
    const radiusSq = radius * radius;
    return state.cells.some((cell) => {
      const pointX = cellX(cell.i);
      const pointZ = cellZ(cell.j);
      const t = lengthSq > 0.0001
        ? Math.max(0, Math.min(1, ((pointX - fromX) * dx + (pointZ - fromZ) * dz) / lengthSq))
        : 0;
      const nearestX = fromX + dx * t;
      const nearestZ = fromZ + dz * t;
      const offsetX = pointX - nearestX;
      const offsetZ = pointZ - nearestZ;
      return offsetX * offsetX + offsetZ * offsetZ <= radiusSq;
    });
  }

  function fireStormEagleFeatherFan(b, target) {
    const base = Math.atan2(target.z - b.z, target.x - b.x);
    const count = STORM_EAGLE_FEATHER_COUNT;
    for (let index = 0; index < count; index++) {
      const mesh = stormFeatherPool.find((item) => !item.visible);
      if (!mesh) break;
      const ratio = count > 1 ? index / (count - 1) - 0.5 : 0;
      const angle = base + ratio * STORM_EAGLE_FEATHER_SPAN + (Math.random() - 0.5) * 0.025;
      const speed = STORM_EAGLE_FEATHER_SPEED * (0.93 + Math.random() * 0.14);
      const x = b.x + Math.cos(angle) * 2.4;
      const z = b.z + Math.sin(angle) * 2.4;
      mesh.visible = true;
      mesh.position.set(x, 0.66, z);
      mesh.rotation.y = -angle;
      mesh.scale.setScalar(1);
      state.stormFeathers.push({
        mesh,
        x,
        z,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        angle,
        life: STORM_EAGLE_FEATHER_LIFE,
        phase: Math.random() * Math.PI * 2,
      });
    }
    b.stormFeatherPoseTimer = STORM_EAGLE_FEATHER_POSE_TIME;
    b.stormFeatherCycle += 1;
  }

  function updateStormFeathers(dt) {
    for (let k = state.stormFeathers.length - 1; k >= 0; k--) {
      const feather = state.stormFeathers[k];
      feather.life -= dt;
      feather.x += feather.vx * dt;
      feather.z += feather.vz * dt;
      feather.mesh.position.set(
        feather.x,
        0.66 + Math.sin(state.time * 18 + feather.phase) * 0.045,
        feather.z
      );
      feather.mesh.rotation.y = -feather.angle;
      feather.mesh.scale.setScalar(1 + Math.sin(state.time * 24 + feather.phase) * 0.07);

      // 羽毛会穿过多地图障碍，只在地图边界和寿命结束时回收。
      let dead = feather.life <= 0 ||
        Math.abs(feather.x) > HALF + 2 ||
        Math.abs(feather.z) > HALF + 2;
      if (!dead && bodyDistanceSq(feather.x, feather.z) <
        STORM_EAGLE_FEATHER_RADIUS * STORM_EAGLE_FEATHER_RADIUS) {
        damage(1, 'projectile');
        dead = true;
      }
      if (dead) {
        feather.mesh.visible = false;
        state.stormFeathers.splice(k, 1);
      }
    }
  }

  function updateStormEagle(b, dt, hp) {
    b.stormFeatherTimer -= dt;
    b.stormFeatherPoseTimer = Math.max(0, (b.stormFeatherPoseTimer || 0) - dt);
    if (b.stormFeatherTimer <= 0) {
      b.stormFeatherTimer = STORM_EAGLE_FEATHER_INTERVAL;
      fireStormEagleFeatherFan(b, hp);
    }

    if (b.stormMoveState === 'cooldown') {
      b.stormMoveTimer -= dt;
      if (b.stormMoveTimer <= 0) {
        b.stormDashTo = chooseStormEagleDashTarget();
        b.stormDashAngle = Math.atan2(
          b.stormDashTo.x - b.x,
          b.stormDashTo.z - b.z
        );
        b.stormMoveState = 'windup';
        b.stormMoveTimer = STORM_EAGLE_DASH_WINDUP;
      }
    } else if (b.stormMoveState === 'windup') {
      b.stormMoveTimer -= dt;
      if (b.stormMoveTimer <= 0) {
        b.stormMoveState = 'dash';
        b.stormMoveTimer = STORM_EAGLE_DASH_TIME;
        b.stormDashElapsed = 0;
        b.stormDashHit = false;
        b.stormDashFrom = { x: b.x, z: b.z };
      }
    } else if (b.stormMoveState === 'dash') {
      const previousX = b.x;
      const previousZ = b.z;
      b.stormMoveTimer = Math.max(0, b.stormMoveTimer - dt);
      b.stormDashElapsed += dt;
      const progress = Math.min(1, b.stormDashElapsed / STORM_EAGLE_DASH_TIME);
      const eased = progress * progress * (3 - 2 * progress);
      const from = b.stormDashFrom || { x: b.x, z: b.z };
      const to = b.stormDashTo || from;
      b.x = from.x + (to.x - from.x) * eased;
      b.z = from.z + (to.z - from.z) * eased;
      if (!b.stormDashHit &&
        stormEagleDashTouchesBody(previousX, previousZ, b.x, b.z, b.contactRadius)) {
        b.stormDashHit = true;
        damage(STORM_EAGLE_RAM_DAMAGE, 'contact');
        if (state.over) return;
      }
      if (progress >= 1) {
        b.stormMoveState = 'cooldown';
        b.stormMoveTimer = STORM_EAGLE_DASH_COOLDOWN;
        b.stormDashFrom = null;
        b.stormDashTo = null;
      }
    } else {
      b.stormMoveState = 'cooldown';
      b.stormMoveTimer = STORM_EAGLE_DASH_COOLDOWN;
    }

    const dashPose = b.stormMoveState === 'windup' || b.stormMoveState === 'dash';
    const featherWarning = b.stormFeatherTimer > 0 &&
      b.stormFeatherTimer <= STORM_EAGLE_FEATHER_WARNING;
    const featherPose = !dashPose && (featherWarning || b.stormFeatherPoseTimer > 0);
    const eagleTexture = dashPose
      ? BOSS_TEX.storm_eagle_dive
      : (featherPose ? BOSS_TEX.storm_eagle_flap : BOSS_TEX.storm_eagle);
    if (eagleTexture && bossPlaneMat.map !== eagleTexture) {
      bossPlaneMat.map = eagleTexture;
      bossPlaneMat.needsUpdate = true;
    }
    bossPlaneMat.opacity = 1;

    const moveWarning = b.stormMoveState === 'windup';
    bossPlaneMat.color.setHex(
      b.stormSummonState === 'warning'
        ? 0xcaf7ff
        : (moveWarning ? 0xb7f4ff : (featherPose ? 0x79d7ff : 0xffffff))
    );
    bossMesh.position.set(b.x, 0, b.z);
    bossMesh.rotation.y = dashPose ? b.stormDashAngle : 0;
    bossMesh.rotation.z = 0;
    bossMesh.scale.setScalar(b.renderScale || 2.55);

    b.stormSummonTimer -= dt;
    if (b.stormSummonTimer > 0) return;
    if (b.stormSummonState === 'warning') {
      b.stormSummonState = 'idle';
      b.stormSummonTimer = STORM_TORNADO_INTERVAL;
    } else {
      startStormEagleSummon(b);
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
      if (b.blackCurse && b.homing && b.speed) {
        const desired = Math.atan2(hp.z - b.z, hp.x - b.x);
        const current = Math.atan2(b.vz, b.vx);
        const turn = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
        const angle = current + Math.max(
          -BLACK_CURSE_BULLET_TURN_RATE * dt,
          Math.min(BLACK_CURSE_BULLET_TURN_RATE * dt, turn)
        );
        b.vx = Math.cos(angle) * b.speed;
        b.vz = Math.sin(angle) * b.speed;
      }
      b.life -= dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.mesh.position.set(b.x, 0.5, b.z);
      if (b.blackCurse) {
        b.mesh.position.y = 0.42;
        b.mesh.rotation.y = -Math.atan2(b.vz, b.vx);
      } else if (b.blackMist) {
        b.mesh.position.y = 0.55;
        b.mesh.rotation.y += dt * 2.8;
      }

      let dead;
      if (b.blackCurse) {
        dead = b.x < -HALF - 10 || b.x > HALF + 10 ||
          b.z < -HALF - 10 || b.z > HALF + 10 ||
          isObstacle(Math.round(b.x + HALF), Math.round(b.z + HALF));
      } else {
        dead = b.life <= 0 || Math.abs(b.x) > HALF + 1 || Math.abs(b.z) > HALF + 1 ||
          isObstacle(Math.round(b.x + HALF), Math.round(b.z + HALF)); // 木桩挡弹
      }
      const hitRadius = b.blackCurse
        ? BLACK_CURSE_BULLET_HIT_RADIUS
        : (b.blackMist ? BLACK_MIST_BULLET_HIT_RADIUS : 0.7);
      if (!dead && bodyDistanceSq(b.x, b.z) < hitRadius * hitRadius) {
        dead = true;
        if (b.wizardSummonBullet && state.boss?.kind === 'black_wizard') {
          dealBlackWizardDamage(state.boss, 1, 'projectile');
        } else {
          damage(1, 'projectile');
        }
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

  function stormFootprintContainsBody(anchor, size = 2) {
    return state.cells.some((cell) => (
      cell.i >= anchor.i && cell.i < anchor.i + size &&
      cell.j >= anchor.j && cell.j < anchor.j + size
    ));
  }

  function chooseStormAnchor(used = [], avoidBoss = false, footprint = 2) {
    const head = state.cells[0] || { i: HALF, j: HALF };
    const footprintSize = Math.max(2, Math.min(N - 2, Math.floor(footprint)));
    const maxAnchor = N - footprintSize;
    const scatter = Math.max(3, Math.ceil(footprintSize / 2));
    for (let tries = 0; tries < 80; tries++) {
      let i;
      let j;
      if (Math.random() < 0.36) {
        i = head.i + randInt(scatter * 2 + 1) - scatter;
        j = head.j + randInt(scatter * 2 + 1) - scatter;
      } else {
        i = 1 + randInt(Math.max(1, maxAnchor));
        j = 1 + randInt(Math.max(1, maxAnchor));
      }
      i = Math.max(1, Math.min(maxAnchor, i));
      j = Math.max(1, Math.min(maxAnchor, j));
      if (avoidBoss &&
        Math.abs(i - BOSS_CELL.i) < footprintSize + 2 &&
        Math.abs(j - BOSS_CELL.j) < footprintSize + 2) {
        continue;
      }
      if (used.some((anchor) => (
        Math.abs(anchor.i - i) < footprintSize &&
        Math.abs(anchor.j - j) < footprintSize
      ))) {
        continue;
      }
      return { i, j };
    }
    return { i: N - 5, j: N - 5 };
  }

  function showStormWarning(anchor, kind, duration) {
    const mesh = stormWarningPool.find((item) => !item.visible);
    if (!mesh) return null;
    const lightning = kind === 'lightning';
    const footprint = lightning ? 2 : STORM_TORNADO_FOOTPRINT;
    const centerOffset = footprint / 2 - 0.5;
    mesh.visible = true;
    mesh.position.set(cellX(anchor.i + centerOffset), 0.17, cellZ(anchor.j + centerOffset));
    mesh.scale.set(footprint / 2, 1, footprint / 2);
    mesh.userData.plane.material.color.setHex(lightning ? 0xffc94f : 0xff8f64);
    mesh.userData.border.material.color.setHex(lightning ? 0xfff2b8 : 0xffd5c4);
    const warning = {
      mesh,
      anchor: { ...anchor },
      kind,
      duration,
      remaining: duration,
    };
    state.stormWarnings.push(warning);
    return warning;
  }

  function strikeStormLightning(anchor) {
    const mesh = stormLightningPool.find((item) => !item.visible);
    if (mesh) {
      mesh.visible = true;
      mesh.material.opacity = 0.98;
      mesh.position.set(cellX(anchor.i + 0.5), 0.34, cellZ(anchor.j + 0.5));
      mesh.rotation.z = (Math.random() - 0.5) * 0.12;
      state.stormLightningStrikes.push({
        mesh,
        t: 0,
        duration: STORM_LIGHTNING_IMPACT_TIME,
      });
    }
    if (stormFootprintContainsBody(anchor, 2)) {
      const previousDamage = state.damageTaken;
      damage(STORM_LIGHTNING_DAMAGE, 'hazard');
      if (state.damageTaken > previousDamage && !state.over) {
        toast('落雷命中', `2×2 雷区 · 体长 -${STORM_LIGHTNING_DAMAGE}`);
      }
    }
  }

  function spawnStormTornado(anchor) {
    const mesh = stormTornadoPool.find((item) => !item.visible);
    if (!mesh) return;
    mesh.visible = true;
    mesh.material.opacity = 0.86;
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.scale.setScalar(1);
    const centerOffset = STORM_TORNADO_FOOTPRINT / 2 - 0.5;
    mesh.position.set(cellX(anchor.i + centerOffset), 0.3, cellZ(anchor.j + centerOffset));
    state.stormTornadoes.push({
      mesh,
      anchor: { ...anchor },
      life: STORM_TORNADO_LIFE,
      maxLife: STORM_TORNADO_LIFE,
      hitCooldown: 0,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function clearStormArena() {
    state.stormWarnings.forEach((warning) => {
      if (warning.mesh) warning.mesh.visible = false;
    });
    state.stormWarnings.length = 0;
    state.stormLightningStrikes.forEach((strike) => {
      if (strike.mesh) strike.mesh.visible = false;
    });
    state.stormLightningStrikes.length = 0;
    state.stormTornadoes.forEach((tornado) => {
      if (tornado.mesh) tornado.mesh.visible = false;
    });
    state.stormTornadoes.length = 0;
    state.stormBolts.forEach((bolt) => {
      if (bolt.mesh) bolt.mesh.visible = false;
    });
    state.stormBolts.length = 0;
    state.stormFeathers.forEach((feather) => {
      if (feather.mesh) feather.mesh.visible = false;
    });
    state.stormFeathers.length = 0;
    stormFeatherPool.forEach((mesh) => {
      mesh.visible = false;
    });
    state.stormWarnings.length = 0;
    state.stormSummon = null;
    state.stormLightningTimer = STORM_LIGHTNING_INTERVAL;
    state.stormIntroShown = false;
  }

  function updateStormWarnings(dt) {
    for (let k = state.stormWarnings.length - 1; k >= 0; k--) {
      const warning = state.stormWarnings[k];
      warning.remaining = Math.max(0, warning.remaining - dt);
      const pulse = 0.5 + Math.sin(state.time * 24) * 0.5;
      warning.mesh.userData.plane.material.opacity = 0.22 + pulse * 0.2;
      warning.mesh.userData.border.material.opacity = 0.72 + pulse * 0.28;
      if (warning.remaining > 0) continue;
      warning.mesh.visible = false;
      state.stormWarnings.splice(k, 1);
      if (warning.kind === 'lightning') strikeStormLightning(warning.anchor);
      else spawnStormTornado(warning.anchor);
    }
  }

  function updateStormLightningStrikes(dt) {
    for (let k = state.stormLightningStrikes.length - 1; k >= 0; k--) {
      const strike = state.stormLightningStrikes[k];
      strike.t += dt;
      const left = 1 - Math.min(1, strike.t / strike.duration);
      strike.mesh.material.opacity = left;
      strike.mesh.scale.setScalar(0.94 + (1 - left) * 0.08);
      if (left <= 0) {
        strike.mesh.visible = false;
        state.stormLightningStrikes.splice(k, 1);
      }
    }
  }

  function updateStormTornadoes(dt) {
    for (let k = state.stormTornadoes.length - 1; k >= 0; k--) {
      const tornado = state.stormTornadoes[k];
      tornado.life -= dt;
      tornado.hitCooldown = Math.max(0, tornado.hitCooldown - dt);
      tornado.mesh.material.opacity = Math.min(0.9, Math.max(0, tornado.life) * 2.5) *
        (0.88 + Math.sin(state.time * 5 + tornado.phase) * 0.08);
      tornado.mesh.scale.setScalar(0.96 + Math.sin(state.time * 4.2 + tornado.phase) * 0.04);
      if (tornado.hitCooldown <= 0 &&
        stormFootprintContainsBody(tornado.anchor, STORM_TORNADO_FOOTPRINT)) {
        tornado.hitCooldown = STORM_TORNADO_HIT_COOLDOWN;
        const previousDamage = state.damageTaken;
        damage(1, 'hazard');
        if (state.damageTaken > previousDamage && !state.over) {
          state.slowTimer = Math.max(state.slowTimer, STORM_TORNADO_SLOW_TIME);
          toast('卷入龙卷', '体长 -1 · 移动速度降低 3 秒');
        }
      }
      if (tornado.life <= 0) {
        tornado.mesh.visible = false;
        state.stormTornadoes.splice(k, 1);
      }
    }
  }

  function updateStormArena(dt) {
    if (ROOMS[state.level]?.theme !== 'storm') return;
    updateStormWarnings(dt);
    updateStormLightningStrikes(dt);
    updateStormTornadoes(dt);
    if (state.phase !== 'clear' && state.phase !== 'boss') return;
    state.stormLightningTimer -= dt;
    if (state.stormLightningTimer > 0) return;
    state.stormLightningTimer = STORM_LIGHTNING_INTERVAL;
    const anchor = chooseStormAnchor();
    showStormWarning(anchor, 'lightning', STORM_LIGHTNING_WARNING);
    if (!state.stormIntroShown) {
      state.stormIntroShown = true;
      toast('雷暴将至', '每 5 秒随机落下 2×2 雷区 · 预警 1 秒');
    }
  }

  function spawnStormBolt(x, z, tx, tz) {
    const mesh = stormBoltPool.find((item) => !item.visible);
    if (!mesh) return;
    const dx = tx - x;
    const dz = tz - z;
    const len = Math.hypot(dx, dz) || 1;
    mesh.visible = true;
    mesh.position.set(x, 0.56, z);
    state.stormBolts.push({
      mesh,
      x,
      z,
      vx: (dx / len) * STORM_BOLT_SPEED,
      vz: (dz / len) * STORM_BOLT_SPEED,
      life: 4.8,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function updateStormBolts(dt) {
    for (let k = state.stormBolts.length - 1; k >= 0; k--) {
      const bolt = state.stormBolts[k];
      bolt.life -= dt;
      bolt.x += bolt.vx * dt;
      bolt.z += bolt.vz * dt;
      bolt.mesh.position.set(
        bolt.x,
        0.56 + Math.sin(state.time * 18 + bolt.phase) * 0.08,
        bolt.z
      );
      bolt.mesh.scale.setScalar(0.9 + Math.sin(state.time * 22 + bolt.phase) * 0.12);
      const ci = Math.round(bolt.x + HALF);
      const cj = Math.round(bolt.z + HALF);
      let dead = bolt.life <= 0 || !inBounds(ci, cj) || isObstacle(ci, cj);
      if (!dead && bodyDistanceSq(bolt.x, bolt.z) < 0.64 * 0.64) {
        damage(1, 'projectile');
        dead = true;
      }
      if (dead) {
        bolt.mesh.visible = false;
        state.stormBolts.splice(k, 1);
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
        if (enemy.type === 'frostWisp') spawnWispDissolve(enemy.x, enemy.z);
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

      if (!boom) {
        const summon = blackWizardSummonAt(orb.x, orb.z);
        if (summon) {
          boom = true;
          damageBlackWizardSummon(summon, 1);
          orb.boomX = summon.x;
          orb.boomZ = summon.z;
        }
      }

      if (!boom) {
        const clone = blackMistBlockingClone(orb.x, orb.z);
        if (clone) {
          boom = true;
          clone.hitFlash = 0.18;
          orb.boomX = clone.x;
          orb.boomZ = clone.z;
        }
      }

      if (!boom && state.boss && state.boss.alive && !abyssLordInvulnerable() &&
        Math.hypot(state.boss.x - orb.x, state.boss.z - orb.z) < state.boss.orbHitRadius) {
        boom = true;
        orb.boomX = state.boss.x;
        orb.boomZ = state.boss.z;
        if (!damagePharaohShield(true)) {
          if (!blackBossInvulnerable()) {
            state.boss.hp -= ENERGY_BALL_DAMAGE;
            registerBlackMistBossHit();
            updateHud();
            if (state.boss.hp <= 0) bossDie();
          }
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

  function spawnFireTrailSegment(bullet) {
    const mesh = fireTrailPool.find((item) => !item.visible);
    if (!mesh) return;
    const plane = mesh.userData.trailPlane;
    mesh.visible = true;
    mesh.position.set(
      bullet.x - bullet.dirX * 1.05,
      0.54,
      bullet.z - bullet.dirZ * 1.05
    );
    mesh.rotation.y = Math.atan2(-bullet.dirZ, bullet.dirX);
    mesh.scale.setScalar(0.72);
    if (plane) plane.material.opacity = 0.18;
    state.fireTrails.push({
      mesh,
      life: FIRE_BULLET_TRAIL_LIFE,
      maxLife: FIRE_BULLET_TRAIL_LIFE,
    });
  }

  function updateFireTrails(dt) {
    for (let k = state.fireTrails.length - 1; k >= 0; k--) {
      const trail = state.fireTrails[k];
      trail.life -= dt;
      const remaining = Math.max(0, trail.life / trail.maxLife);
      const plane = trail.mesh.userData.trailPlane;
      if (plane) plane.material.opacity = 0.18 * remaining * remaining;
      trail.mesh.scale.setScalar(0.72 + (1 - remaining) * 0.16);
      if (trail.life <= 0) {
        trail.mesh.visible = false;
        state.fireTrails.splice(k, 1);
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
        if (en.type === 'frostWisp') spawnWispDissolve(en.x, en.z);
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
      b.mesh.position.set(b.x, b.fire ? 0.58 : 0.4, b.z);
      if (b.fire) {
        b.trailTimer -= dt;
        if (b.trailTimer <= 0) {
          b.trailTimer += FIRE_BULLET_TRAIL_INTERVAL;
          spawnFireTrailSegment(b);
        }
      }

      const ci = Math.round(b.x + HALF);
      const cj = Math.round(b.z + HALF);
      let burstSpawned = false;
      let dead = b.life <= 0 || !inBounds(ci, cj);
      if (!dead && b.fire) {
        const orbIndex = state.wispSpikes.findIndex((orb) => (
          Math.hypot(orb.x - b.x, orb.z - b.z) < WISP_ORB_RADIUS + PLAYER_BULLET_RADIUS + 0.2
        ));
        if (orbIndex >= 0) {
          const orb = state.wispSpikes[orbIndex];
          orb.mesh.visible = false;
          state.wispSpikes.splice(orbIndex, 1);
          spawnFireBurst(b.x, b.z);
          burstSpawned = true;
          dead = true;
        }
      }
      if (!dead && b.fire && dynamicIce.has(`${ci},${cj}`)) {
        breakIceObstacle(ci, cj);
        spawnFireBurst(b.x, b.z);
        burstSpawned = true;
      }
      const mirror = findMirrorAt(ci, cj);
      if (!dead && b.fire && mirror) {
        breakMirrorPillar(mirror);
        spawnFireBurst(b.x, b.z);
        burstSpawned = true;
      }
      if (!dead && isObstacle(ci, cj)) dead = true;

      // 命中小怪
      if (!dead && (state.phase === 'clear' || state.phase === 'boss')) {
        for (let e = 0; e < state.enemies.length; e++) {
          const en = state.enemies[e];
          if (!en.alive) continue;
          if (Math.hypot(en.x - b.x, en.z - b.z) < ENEMY_HIT_RADIUS) {
            if (b.fire) {
              damageEnemiesInFireAoe(en.x, en.z, b.enemyDamage);
              spawnFireBurst(en.x, en.z);
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
            if (en.type === 'frostWisp') spawnWispDissolve(en.x, en.z);
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

      if (!dead) {
        const summon = blackWizardSummonAt(b.x, b.z);
        if (summon) {
          damageBlackWizardSummon(summon, 1);
          dead = true;
          if (b.fire && !burstSpawned) {
            spawnFireBurst(b.x, b.z);
            burstSpawned = true;
          }
        }
      }

      if (!dead) {
        const clone = blackMistBlockingClone(b.x, b.z);
        if (clone) {
          clone.hitFlash = 0.18;
          dead = true;
          if (b.fire && !burstSpawned) {
            spawnFireBurst(b.x, b.z);
            burstSpawned = true;
          }
        }
      }

      // 命中 Boss
      if (!dead && state.phase === 'boss' && state.boss && state.boss.alive &&
        !abyssLordInvulnerable()) {
        if (Math.hypot(state.boss.x - b.x, state.boss.z - b.z) < state.boss.bulletHitRadius) {
          const shieldBlocked = damagePharaohShield(false);
          const mistBlocked = blackBossInvulnerable();
          if (!shieldBlocked && !mistBlocked) {
            state.boss.hp -= b.bossDamage;
            registerBlackMistBossHit();
            state.score += 10;
            updateHud();
          }
          dead = true;
          if (b.fire) {
            spawnFireBurst(b.x, b.z);
            burstSpawned = true;
          }
          if (!shieldBlocked && !mistBlocked && state.boss.hp <= 0) bossDie();
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

    if (state.spawnEmerging && !state.teleportEmerging) {
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
      state.stormBolts,
      state.fireBursts,
      state.fireTrails,
    ];
    projectileLists.forEach((list) => {
      list.forEach((entry) => {
        const mesh = entry && entry.mesh ? entry.mesh : entry;
        if (mesh) mesh.visible = false;
      });
      list.length = 0;
    });
    clearIceObstacles();
    clearWolfCombatEffects();
    clearFrostDragonArena();
    clearWispCombatEffects();
    clearStormArena();
    clearAbyssLordArena();
    clearBlackGorgeEffects();
    clearPurpleTeleport();
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
    clearPurpleTeleport();
    state.teleportCooldown = 0;
    state.teleportEmerging = false;
    state.speedBoostTimer = 0;
    state.speedCooldown = 0;
    state.fireBursts.forEach((burst) => { burst.mesh.visible = false; });
    state.fireBursts.length = 0;
    state.fireTrails.forEach((trail) => { trail.mesh.visible = false; });
    state.fireTrails.length = 0;
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
    clearBlackGorgeEffects();
    bossBreathRig.visible = false;
    playerFrostRig.visible = false;
    state.time = 0;
    state.shotDamage = 6;
    state.shootCdMul = 1;
    state.enemies = Array.from({ length: MAX_ENEMIES }, () => ({ alive: false, i: 0, j: 0, x: 0, z: 0, cool: 0, bob: 0 }));

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
    el.ovsub.textContent = '你穿过七片疆域，吞掉黑咒侍从、畸变血奴与黑雾魔侍，最终将黑巫师连同黑色峡谷一并吞噬。';
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
      state.teleportCooldown = Math.max(0, state.teleportCooldown - dt);
      state.frostCooldown = Math.max(0, state.frostCooldown - dt);
      state.frostEffectTimer = Math.max(0, state.frostEffectTimer - dt);
      updateSpeedBoost(dt);
      updatePurpleTeleportHoles(dt);
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
      } else if (state.speedBoostTimer > 0) {
        ribbon.material.color.setHex(0xc8fff2);
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

      updateWolfCombatEffects(dt);
      updateThinIce();
      updateFrostScars(dt);
      updateFrostSpikes(dt);
      updateWispFogPatches(dt);
      updateWispDissolves(dt);
      updateWispSpikes(dt);
      updateStormBolts(dt);
      updateStormFeathers(dt);
      updateStormArena(dt);
      updateAbyssLordArena(dt);
      updateBlackGorgeEffects(dt);
      updateBullets(dt);
      updateFireTrails(dt);
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
    activateQSkill,
    activatePurpleTeleport,
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
    spawnIcePillar: spawnIceObstacle,
    breakIceObstacle,
    spawnThinIce,
    triggerThinIceAt,
    spawnMirrorPillars,
    breakMirrorPillar,
    startFrostDragonAttack,
    spawnFrostScars,
    eruptFrostScars,
    spawnFrostSlamRing: () => state.boss && spawnFrostSlamRing(state.boss),
    spawnWispDissolve,
    spawnWispIceOrb: (x, z, angle = 0) => spawnWispSpike({ x, z }, angle),
    getWispCombat: () => ({
      dissolves: state.wispDissolves.length,
      orbs: state.wispSpikes.map(({ x, z, vx, vz, life }) => ({ x, z, vx, vz, life })),
    }),
    getFrostDragonArena: () => ({
      mirrors: state.mirrorPillars.map((pillar) => ({
        i: pillar.i,
        j: pillar.j,
        alive: pillar.alive,
        cells: pillar.cells.map((cell) => ({ ...cell })),
      })),
      frostScars: state.frostScars.map(({ i, j, life }) => ({ i, j, life })),
      rubbleCount: state.mirrorRubble.length,
      segments: state.boss?.kind === 'frost_dragon' ? dragonLaserSegments(state.boss) : null,
    }),
    getStormArena: () => ({
      theme: ROOMS[state.level]?.theme || null,
      lightningTimer: state.stormLightningTimer,
      warnings: state.stormWarnings.map(({ anchor, kind, remaining }) => ({
        ...anchor,
        kind,
        remaining,
        footprint: kind === 'tornado' ? STORM_TORNADO_FOOTPRINT : 2,
      })),
      strikes: state.stormLightningStrikes.length,
      tornadoes: state.stormTornadoes.map(({ anchor, life }) => ({
        ...anchor,
        life,
        footprint: STORM_TORNADO_FOOTPRINT,
      })),
      bolts: state.stormBolts.length,
      feathers: state.stormFeathers.length,
      slowTimer: state.slowTimer,
      bossKind: state.boss?.kind || null,
      bossMoveState: state.boss?.kind === 'storm_eagle' ? state.boss.stormMoveState : null,
      bossMoveTimer: state.boss?.kind === 'storm_eagle' ? state.boss.stormMoveTimer : null,
      bossPose: state.boss?.kind === 'storm_eagle'
        ? (bossPlaneMat.map === BOSS_TEX.storm_eagle_dive
          ? 'dive'
          : (bossPlaneMat.map === BOSS_TEX.storm_eagle_flap ? 'flap' : 'idle'))
        : null,
      bossRotationY: state.boss?.kind === 'storm_eagle' ? bossMesh.rotation.y : null,
      bossScale: state.boss?.kind === 'storm_eagle' ? bossMesh.scale.x : null,
      dashAngle: state.boss?.kind === 'storm_eagle' ? state.boss.stormDashAngle : null,
      dashCooldown: STORM_EAGLE_DASH_COOLDOWN,
      dashTarget: state.boss?.kind === 'storm_eagle' && state.boss.stormDashTo
        ? { ...state.boss.stormDashTo }
        : null,
    }),
    getAbyssLordArena: () => {
      const boss = state.boss?.kind === 'abyss_lord' ? state.boss : null;
      const head = state.cells[0];
      return {
        theme: ROOMS[state.level]?.theme || null,
        bossKind: state.boss?.kind || null,
        bossState: boss?.abyssState || null,
        bossX: boss?.x ?? null,
        bossZ: boss?.z ?? null,
        distance: boss && head ? Math.hypot(
          boss.x - cellX(head.i),
          boss.z - cellZ(head.j)
        ) : null,
        thrustCooldown: boss?.abyssThrustCooldown ?? null,
        shotTimer: boss?.abyssShotTimer ?? null,
        teleportTimer: boss?.abyssTeleportTimer ?? null,
        forceThrust: Boolean(boss?.abyssForceThrust),
        hidden: Boolean(boss && (boss.abyssState === 'vanish' || boss.abyssState === 'emerge')),
        teleportVisible: abyssTeleportMesh.visible,
        teleportFrame: boss?.abyssTeleportFrame ?? -1,
        bullets: state.abyssBullets.map(({ x, z, vx, vz }) => ({ x, z, vx, vz })),
        afterimages: state.abyssAfterimages.map(({ x, z, life, age, hit }) => ({
          x,
          z,
          life,
          age,
          hit,
        })),
        slowTimer: state.slowTimer,
      };
    },
    spawnAbyssBullet,
    spawnAbyssAfterimage,
    spawnBlackRune,
    spawnBlackCurseRune,
    spawnBlackCurseRuneWave,
    fireBlackCurseBulletCurtain,
    spawnBlackPool,
    spawnBlackBeam,
    spawnBlackClonePair,
    spawnBloodSlavePool,
    startBloodSlaveClaw,
    startBloodSlavePound,
    stepBloodSlave: (dt = 1 / 60, count = 1) => {
      if (!state.boss || state.boss.kind !== 'blood_slave') return false;
      const hp = headPosition(new THREE.Vector3());
      for (let index = 0; index < count && !state.over; index++) {
        updateBloodSlave(state.boss, dt, hp);
      }
      return true;
    },
    spawnBlackMistClones: () => (
      state.boss?.kind === 'black_mist_servant' ? spawnBlackMistClones(state.boss) : false
    ),
    clearBlackMistClones: (announce = false) => {
      if (state.boss?.kind === 'black_mist_servant') clearBlackMistClones(state.boss, announce);
    },
    registerBlackMistBossHit,
    stepBlackMist: (dt = 1 / 60, count = 1) => {
      if (!state.boss || state.boss.kind !== 'black_mist_servant') return false;
      const hp = headPosition(new THREE.Vector3());
      for (let index = 0; index < count && !state.over; index++) {
        updateBlackMistServant(state.boss, dt, hp);
      }
      return true;
    },
    stepBullets: (dt = 1 / 60, count = 1) => {
      for (let index = 0; index < count && !state.over; index++) updateBullets(dt);
    },
    spawnBlackWizardCurseField: (x, z) => {
      if (state.boss?.kind !== 'black_wizard') return false;
      spawnBlackWizardCurseField(state.boss, { x, z });
      return true;
    },
    fireBlackWizardShadowArrows: (x, z) => {
      if (state.boss?.kind !== 'black_wizard') return false;
      fireBlackWizardShadowArrows(state.boss, { x, z });
      return true;
    },
    spawnBlackWizardSummon: () => (
      state.boss?.kind === 'black_wizard'
        ? (spawnBlackWizardSummon(state.boss), state.blackWizardSummon)
        : null
    ),
    damageBlackWizardSummon: (amount = 1) => (
      state.blackWizardSummon
        ? damageBlackWizardSummon(state.blackWizardSummon, amount)
        : false
    ),
    addBlackWizardCurse: (layers = 1) => (
      state.boss?.kind === 'black_wizard'
        ? addBlackWizardCurse(state.boss, layers)
        : false
    ),
    stepBlackWizard: (dt = 1 / 60, count = 1) => {
      if (!state.boss || state.boss.kind !== 'black_wizard') return false;
      const hp = headPosition(new THREE.Vector3());
      for (let index = 0; index < count && !state.over; index++) {
        updateBlackWizard(state.boss, dt, hp);
      }
      return true;
    },
    getBlackGorgeArena: () => ({
      theme: ROOMS[state.level]?.theme || null,
      bossKind: state.boss?.kind || null,
      bossState: state.boss?.blackState || null,
      bossPhase: state.boss?.blackPhase || null,
      invulnerable: blackBossInvulnerable(),
      runes: state.blackRunes.map(({ i, j, age, delay }) => ({ i, j, age, delay })),
      curseRunes: state.blackCurseRunes.map(({ x, z, age, warning, hit }) => ({
        x,
        z,
        age,
        warning,
        hit,
        size: BLACK_CURSE_RUNE_SIZE,
      })),
      bulletTimer: state.boss?.blackCurseBulletTimer ?? null,
      runeTimer: state.boss?.blackCurseRuneTimer ?? null,
      lockTimer: state.boss?.blackCurseLockTimer ?? null,
      bloodState: state.boss?.bloodState ?? null,
      bloodFilmTimer: state.boss?.bloodFilmTimer ?? null,
      bloodFilmCooldown: state.boss?.bloodFilmCooldown ?? null,
      bloodClawCooldown: state.boss?.bloodClawCooldown ?? null,
      bloodPoolCooldown: state.boss?.bloodPoolCooldown ?? null,
      bloodRageTimer: state.boss?.bloodRageTimer ?? null,
      bloodRageStacks: state.boss?.bloodRageStacks ?? null,
      bloodPools: state.bloodSlavePools.map(({ x, z, life, rageTriggered }) => ({
        x,
        z,
        life,
        rageTriggered,
      })),
      bloodClaws: state.bloodSlaveClaws.length,
      mistState: state.boss?.blackState ?? null,
      mistTeleportInterval: BLACK_MIST_TELEPORT_INTERVAL,
      mistSplitTimer: state.boss?.blackMistSplitTimer ?? null,
      mistCloneHits: state.boss?.blackMistCloneHits ?? null,
      mistClones: state.blackMistClones.map(({ x, z, mistState, stateTimer, teleported }) => ({
        x,
        z,
        mistState,
        stateTimer,
        teleported,
      })),
      wizardCurseLayers: state.boss?.blackWizardCurseLayers ?? null,
      wizardCurseDecay: state.boss?.blackWizardCurseDecayTimer ?? null,
      wizardPose: state.boss?.blackWizardPose ?? null,
      wizardFields: state.blackWizardCurseFields.map(({ x, z, life, warningTimer }) => ({
        x,
        z,
        life,
        warningTimer,
        warningVisible: warningTimer > 0,
      })),
      wizardArrows: state.blackWizardArrows.map(({ x, z, angle, life }) => ({
        x,
        z,
        angle,
        life,
      })),
      wizardSummon: state.blackWizardSummon
        ? {
          kind: state.blackWizardSummon.kind,
          hp: state.blackWizardSummon.hp,
          life: state.blackWizardSummon.life,
          x: state.blackWizardSummon.x,
          z: state.blackWizardSummon.z,
        }
        : null,
      pools: state.blackPools.map(({ i, j, life }) => ({ i, j, life })),
      beams: state.blackBeamEffects.map(({ x, z, angle, age }) => ({ x, z, angle, age })),
      clones: state.blackClones.length,
      obstacleCount: obstacles.size / 4,
    }),
    getIceObstacles: () => [...new Set(dynamicIce.values())].map(({ i, j, cells }) => ({
      i,
      j,
      cells: [
        { i: cells[0], j: cells[1] },
        { i: cells[2], j: cells[3] },
      ],
    })),
  };
  window.startDevour = (levelIndex = DEBUG_START_LEVEL) => {
    resetGame(levelIndex);
    showHelp();
    clock.getDelta(); // 清掉暂停期间累积的 delta
    state.paused = false;
  };
  renderer.setAnimationLoop(tick);
})();
