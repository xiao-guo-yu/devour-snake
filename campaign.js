/* Campaign region selection and eight-node level maps. */
(() => {
  'use strict';

  const STORAGE_KEY = 'devour-campaign-v2';
  const TEST_UNLOCK_ALL = new URLSearchParams(window.location.search).get('unlock') === 'all';
  const REGIONS = [
    {
      id: 'green',
      name: '腐殖温室',
      en: 'VERDANT RUINS',
      subtitle: '藤蔓吞没了旧日圣所',
      art: 'assets/rootcoil.png',
      accent: '#68e7b8',
      accent2: '#157257',
      base: 0,
      levels: [
        { n: 1, room: 0, name: '温室前厅', icon: 'assets/spore.png' },
        { n: 2, room: 1, name: '根礼拜堂', icon: 'assets/spore.png' },
        { n: 3, room: 2, name: '根之圣所', icon: 'assets/vine.png' },
        { n: 4, room: 3, name: '腐生苗床', icon: 'assets/spore.png' },
        { n: 5, room: 4, name: '根脉交叉', icon: 'assets/trap.png' },
        { n: 6, room: 5, name: '捕食花圃', icon: 'assets/vine.png' },
        { n: 7, room: 6, name: '圣所深处', icon: 'assets/trap.png' },
        { n: 8, room: 7, name: '枯树', boss: true, icon: 'assets/rootcoil.png' },
      ],
    },
    {
      id: 'temple',
      name: '黄沙神庙',
      en: 'SUNKEN TEMPLE',
      subtitle: '沉睡千年的黄金王座',
      art: 'assets/pharaoh.png',
      accent: '#f0c66c',
      accent2: '#88612a',
      base: 8,
      levels: [
        { n: 1, room: 8, name: '神庙柱厅', icon: 'assets/scarab.png' },
        { n: 2, room: 9, name: '供奉长廊', icon: 'assets/scarab.png' },
        { n: 3, room: 10, name: '阿努比斯内殿', icon: 'assets/mummy.png' },
        { n: 4, room: 11, name: '圣甲虫墓道', icon: 'assets/scarab.png' },
        { n: 5, room: 12, name: '王陵中庭', icon: 'assets/anubis.png' },
        { n: 6, room: 13, name: '守墓长廊', icon: 'assets/mummy.png' },
        { n: 7, room: 14, name: '黄金王座', icon: 'assets/anubis.png' },
        { n: 8, room: 15, name: '黄金法老', boss: true, icon: 'assets/pharaoh.png' },
      ],
    },
    {
      id: 'volcano',
      name: '熔火地脉',
      en: 'MOLTEN VEIN',
      subtitle: '岩浆之下仍有东西在呼吸',
      art: 'assets/magma-colossus.png',
      accent: '#ff9a47',
      accent2: '#a63712',
      base: 16,
      levels: [
        { n: 1, room: 16, name: '熔岩裂谷', icon: 'assets/magma-slime.png' },
        { n: 2, room: 17, name: '焦岩长廊', icon: 'assets/magma-slime.png' },
        { n: 3, room: 18, name: '余烬祭坛', icon: 'assets/obsidian-beetle.png' },
        { n: 4, room: 19, name: '熔渣坡道', icon: 'assets/magma-slime.png' },
        { n: 5, room: 20, name: '炽脉交汇', icon: 'assets/ember-wisp.png' },
        { n: 6, room: 21, name: '熔炉深处', icon: 'assets/obsidian-beetle.png' },
        { n: 7, room: 22, name: '火山核心', icon: 'assets/ember-wisp.png' },
        { n: 8, room: 23, name: '熔岩巨像', boss: true, icon: 'assets/magma-colossus.png' },
      ],
    },
    {
      id: 'frozen',
      name: '永冻冰原',
      en: 'FROZEN WASTES',
      subtitle: '穿过火山，冰系军团在荒原列阵',
      art: 'assets/frost-dragon-idle.png',
      accent: '#8bd8ff',
      accent2: '#2f6f9d',
      base: 24,
      levels: [
        { n: 1, room: 24, name: '霜原边缘', icon: 'assets/ice-slug.png' },
        { n: 2, room: 25, name: '裂冰走廊', icon: 'assets/ice-slug.png' },
        { n: 3, room: 26, name: '狼嚎冻谷', icon: 'assets/frost-wolf.png' },
        { n: 4, room: 27, name: '寒晶蛞蝓穴', icon: 'assets/ice-slug.png' },
        { n: 5, room: 28, name: '雾灵回廊', icon: 'assets/frost-wisp.png' },
        { n: 6, room: 29, name: '霜骨荒径', icon: 'assets/frost-wolf.png' },
        { n: 7, room: 30, name: '冰封王座前庭', icon: 'assets/frost-wisp.png' },
        { n: 8, room: 31, name: '凛冬冰龙', boss: true, icon: 'assets/frost-dragon-idle.png' },
      ],
    },
  ];

  const NODE_POSITIONS = [
    { x: 9, y: 83 },
    { x: 24, y: 66 },
    { x: 39, y: 81 },
    { x: 52, y: 59 },
    { x: 66, y: 73 },
    { x: 79, y: 53 },
    { x: 91, y: 70 },
    { x: 50, y: 22 },
  ];

  const campaignScreen = document.getElementById('campaignScreen');
  const levelMapScreen = document.getElementById('levelMapScreen');
  const regionCards = document.getElementById('regionCards');
  const levelNodes = document.getElementById('levelNodes');
  const regionMapTitle = document.getElementById('regionMapTitle');
  const regionMapSubtitle = document.getElementById('regionMapSubtitle');
  const regionMapProgress = document.getElementById('regionMapProgress');
  const campaignTotal = document.getElementById('campaignTotal');
  const btnStart = document.getElementById('btnStart');
  const btnContinue = document.getElementById('btnContinue');
  const startScreen = document.getElementById('startScreen');

  if (!campaignScreen || !levelMapScreen || !regionCards || !levelNodes) return;

  let activeRegion = 0;
  let previousFocus = null;
  let progress = loadProgress();

  function emptyProgress() {
    return {
      version: 2,
      lastRegion: 0,
      regions: Object.fromEntries(REGIONS.map((region) => [region.id, {}])),
    };
  }

  function loadProgress() {
    const fresh = emptyProgress();
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return fresh;
      fresh.lastRegion = Number.isInteger(saved.lastRegion) ? saved.lastRegion : 0;
      for (const region of REGIONS) {
        const source = saved.regions && saved.regions[region.id];
        if (!source || typeof source !== 'object') continue;
        for (const [level, stars] of Object.entries(source)) {
          const n = Number(level);
          const value = Number(stars);
          if (n >= 1 && n <= 8 && value > 0) fresh.regions[region.id][n] = Math.min(3, value);
        }
      }
      return fresh;
    } catch (err) {
      return fresh;
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      /* Local files and private mode may disable storage. */
    }
  }

  function starsFor(regionIndex, level) {
    return progress.regions[REGIONS[regionIndex].id][level] || 0;
  }

  function completedCount(regionIndex) {
    return REGIONS[regionIndex].levels.filter((level) => !level.planned && starsFor(regionIndex, level.n) > 0).length;
  }

  function totalCompleted() {
    return REGIONS.reduce((sum, region, index) => sum + completedCount(index), 0);
  }

  function hasProgress() {
    return totalCompleted() > 0;
  }

  function regionUnlocked(regionIndex) {
    if (TEST_UNLOCK_ALL) return true;
    if (regionIndex <= 0) return true;
    return starsFor(regionIndex - 1, 8) > 0;
  }

  function levelAvailable(regionIndex, level) {
    if (!level || level.planned || !regionUnlocked(regionIndex)) return false;
    if (TEST_UNLOCK_ALL) return true;
    if (level.n === 1) return true;
    return starsFor(regionIndex, level.n - 1) > 0;
  }

  function renderStars(stars, dim = false) {
    return `<span class="node-stars${dim ? ' is-dim' : ''}" aria-label="${stars} 星">${
      [1, 2, 3].map((n) => `<i class="${n <= stars ? 'is-lit' : ''}">★</i>`).join('')
    }</span>`;
  }

  function renderRegions() {
    regionCards.innerHTML = REGIONS.map((region, index) => {
      const unlocked = regionUnlocked(index);
      const complete = completedCount(index);
      const lockedLabel = index > 0 && !unlocked ? `先完成${REGIONS[index - 1].name}` : '';
      const pips = region.levels.map((level) => {
        const done = !level.planned && starsFor(index, level.n) > 0;
        return `<i class="${done ? 'is-done' : ''}${level.planned ? ' is-planned' : ''}"></i>`;
      }).join('');
      return `
        <button class="region-card${unlocked ? '' : ' is-locked'}" type="button"
          data-region="${index}" style="--accent:${region.accent};--accent-2:${region.accent2}"
          aria-label="${region.name}，已通关 ${complete} / 8${unlocked ? '' : '，未解锁'}" ${unlocked ? '' : 'disabled'}>
          <span class="region-aura" aria-hidden="true"></span>
          <span class="region-moon" aria-hidden="true"></span>
          <span class="region-spire region-spire-a" aria-hidden="true"></span>
          <span class="region-spire region-spire-b" aria-hidden="true"></span>
          <span class="region-spire region-spire-c" aria-hidden="true"></span>
          <span class="region-cliff" aria-hidden="true"></span>
          <span class="region-drift" aria-hidden="true"></span>
          <span class="region-art"><img src="${region.art}" alt="" draggable="false"></span>
          <span class="region-lock" aria-hidden="true">${unlocked ? '' : 'LOCKED'}</span>
          <span class="region-meta">
            <span class="region-en">${region.en}</span>
            <strong>${region.name}</strong>
            <small>${unlocked ? region.subtitle : lockedLabel}</small>
            <span class="region-progress">
              <span class="region-stars">★</span>
              <b>${complete} / 8</b>
              <span class="region-pips" aria-hidden="true">${pips}</span>
            </span>
          </span>
        </button>`;
    }).join('');

    campaignTotal.textContent = `${totalCompleted()} / ${REGIONS.length * 8}`;
    regionCards.querySelectorAll('.region-card:not(:disabled)').forEach((card) => {
      card.addEventListener('click', () => showLevelMap(Number(card.dataset.region)));
    });
  }

  function nodeState(regionIndex, level) {
    if (level.planned) return '待设计';
    if (starsFor(regionIndex, level.n) > 0) return '已完成';
    if (levelAvailable(regionIndex, level)) return level.boss ? '挑战首领' : '进入关卡';
    return '尚未解锁';
  }

  function renderLevelMap() {
    const region = REGIONS[activeRegion];
    const complete = completedCount(activeRegion);
    document.body.dataset.campaignTheme = region.id;
    regionMapTitle.textContent = region.name;
    regionMapSubtitle.textContent = region.subtitle;
    regionMapProgress.textContent = `${complete} / 8`;

    levelNodes.innerHTML = region.levels.map((level, index) => {
      const position = NODE_POSITIONS[index];
      const stars = starsFor(activeRegion, level.n);
      const available = levelAvailable(activeRegion, level);
      const classes = [
        'level-node',
        level.boss ? 'is-boss' : '',
        level.planned ? 'is-planned' : '',
        stars ? 'is-complete' : '',
        available ? 'is-available' : '',
        available ? '' : 'is-locked',
      ].filter(Boolean).join(' ');
      const label = level.planned
        ? `第 ${level.n} 关，待设计`
        : `第 ${level.n} 关，${level.name}，${nodeState(activeRegion, level)}`;
      const art = level.planned
        ? '<span class="planned-mark" aria-hidden="true">◇</span>'
        : `<img src="${level.icon}" alt="" draggable="false">`;
      return `
        <button class="${classes}" type="button" data-level="${level.n}"
          style="--x:${position.x}%;--y:${position.y}%" aria-label="${label}" ${available ? '' : 'disabled'}>
          <span class="node-number">${String(level.n).padStart(2, '0')}</span>
          <span class="node-platform">
            <span class="node-art">${art}</span>
            <span class="node-ring" aria-hidden="true"></span>
          </span>
          ${renderStars(stars, level.planned)}
          <span class="node-label">${level.planned ? '待设计' : level.name}</span>
          <span class="node-state">${nodeState(activeRegion, level)}</span>
        </button>`;
    }).join('');

    levelNodes.querySelectorAll('.level-node:not(:disabled)').forEach((node) => {
      const level = region.levels.find((item) => item.n === Number(node.dataset.level));
      node.addEventListener('click', () => launchLevel(level));
    });
  }

  function showRegions(fromGame = false) {
    if (window.DevourAudio) window.DevourAudio.playMenu();
    previousFocus = fromGame ? null : document.activeElement;
    document.body.classList.add('campaign-open');
    campaignScreen.hidden = false;
    campaignScreen.setAttribute('aria-hidden', 'false');
    levelMapScreen.hidden = true;
    levelMapScreen.setAttribute('aria-hidden', 'true');
    renderRegions();

    const preferred = regionUnlocked(progress.lastRegion) ? progress.lastRegion : 0;
    const card = regionCards.querySelector(`[data-region="${preferred}"]:not(:disabled)`);
    if (card) window.setTimeout(() => card.focus({ preventScroll: true }), 30);
  }

  function showLevelMap(regionIndex) {
    if (!regionUnlocked(regionIndex)) return;
    if (window.DevourAudio) window.DevourAudio.playMenu();
    previousFocus = document.activeElement;
    activeRegion = regionIndex;
    progress.lastRegion = regionIndex;
    saveProgress();
    document.body.classList.add('campaign-open');
    campaignScreen.hidden = true;
    campaignScreen.setAttribute('aria-hidden', 'true');
    levelMapScreen.hidden = false;
    levelMapScreen.setAttribute('aria-hidden', 'false');
    renderLevelMap();

    const target = levelNodes.querySelector('.level-node.is-available, .level-node.is-complete:not(:disabled)');
    if (target) {
      window.setTimeout(() => {
        target.focus({ preventScroll: true });
        const viewport = document.querySelector('.level-map-viewport');
        if (viewport && viewport.scrollHeight > viewport.clientHeight) {
          viewport.scrollTop = Math.max(
            0,
            target.offsetTop - viewport.clientHeight / 2 + target.offsetHeight / 2
          );
        }
      }, 30);
    }
  }

  function hide() {
    campaignScreen.hidden = true;
    levelMapScreen.hidden = true;
    campaignScreen.setAttribute('aria-hidden', 'true');
    levelMapScreen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('campaign-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true });
  }

  function showLastRegion() {
    document.body.classList.add('campaign-open');
    if (hasProgress()) showLevelMap(progress.lastRegion);
    else showRegions();
  }

  function launchLevel(level) {
    if (!level || level.planned || !levelAvailable(activeRegion, level)) return;
    progress.lastRegion = activeRegion;
    saveProgress();
    hide();
    if (startScreen) {
      startScreen.classList.add('gone');
      startScreen.style.display = 'none';
    }
    if (window.DevourAudio) window.DevourAudio.playGameplay();
    if (typeof window.startDevour === 'function') window.startDevour(level.room);
  }

  function refreshEntryState() {
    if (btnContinue) btnContinue.disabled = !hasProgress();
  }

  function onLevelCleared(payload) {
    if (!payload || !Number.isInteger(payload.level)) return;
    const regionIndex = REGIONS.findIndex((region) => region.levels.some((level) => level.room === payload.level));
    if (regionIndex < 0) return;
    const level = REGIONS[regionIndex].levels.find((item) => item.room === payload.level);
    if (!level || level.planned) return;
    const stars = Math.max(1, Math.min(3, Number(payload.stars) || 1));
    const previousStars = starsFor(regionIndex, level.n);
    progress.regions[REGIONS[regionIndex].id][level.n] = Math.max(previousStars, stars);
    progress.lastRegion = regionIndex;
    saveProgress();
    refreshEntryState();
    if (!levelMapScreen.hidden && regionIndex === activeRegion) renderLevelMap();
    if (!campaignScreen.hidden) renderRegions();
  }

  document.getElementById('btnCampaignBack')?.addEventListener('click', () => {
    hide();
    if (startScreen) {
      startScreen.style.display = 'grid';
      window.requestAnimationFrame(() => startScreen.classList.remove('gone'));
    }
    if (btnStart) btnStart.focus({ preventScroll: true });
  });

  document.getElementById('btnRegionMapBack')?.addEventListener('click', showRegions);

  regionCards.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const cards = [...regionCards.querySelectorAll('.region-card:not(:disabled)')];
    const current = cards.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'ArrowRight'
      ? Math.min(cards.length - 1, current + 1)
      : Math.max(0, current - 1);
    cards[next].focus();
  });

  document.addEventListener('keydown', (event) => {
    if (!document.body.classList.contains('campaign-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!levelMapScreen.hidden) showRegions();
      else document.getElementById('btnCampaignBack')?.click();
      return;
    }
    if (event.key !== 'Tab') return;
    const active = levelMapScreen.hidden ? campaignScreen : levelMapScreen;
    const focusable = [...active.querySelectorAll('button:not(:disabled), [tabindex]:not([tabindex="-1"])')];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.DevourCampaign = {
    hide,
    showRegions,
    showLastRegion,
    refreshEntryState,
    hasProgress,
  };
  window.onDevourLevelCleared = onLevelCleared;
  refreshEntryState();
})();
