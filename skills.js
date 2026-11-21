/* Persisted boss-core skills and the settings skill loadout. */
(() => {
  'use strict';

  const STORAGE_KEY = 'devour-skills-v2';
  const SKILLS = {
    green: {
      id: 'green',
      slot: 'e',
      color: '#68e7b8',
      name: '翠核疾射',
      subtitle: 'GREEN CORE · E',
      desc: '按 E 发射普通獠牙弹，消耗 1 格身体。',
    },
    yellow: {
      id: 'yellow',
      slot: 'q',
      color: '#f0c66c',
      name: '金核壁垒',
      subtitle: 'YELLOW CORE · Q',
      desc: '按 Q 消耗 1 格身体，获得持续 2 秒的全身护盾，冷却 5 秒。',
    },
    red: {
      id: 'red',
      slot: 'e',
      color: '#ff6542',
      name: '赤核烈焰',
      subtitle: 'RED CORE · E',
      desc: '按 E 消耗 2 格身体，发射伤害 2、覆盖 2×2 格并灼烧 Boss 的烈焰弹。',
    },
  };

  const tabs = [...document.querySelectorAll('[data-settings-tab]')];
  const panels = [...document.querySelectorAll('[data-settings-panel]')];
  const skillList = document.getElementById('skillSettingsList');
  const settingsScreen = document.getElementById('settingsScreen');
  let activeTab = 'audio';
  let data = load();

  function freshData() {
    return {
      version: 2,
      unlocked: { green: false, yellow: false, red: false },
      equipped: { e: null, q: null },
    };
  }

  function load() {
    const fresh = freshData();
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return fresh;
      for (const id of Object.keys(SKILLS)) {
        fresh.unlocked[id] = Boolean(saved.unlocked && saved.unlocked[id]);
      }
      for (const slot of ['e', 'q']) {
        const id = saved.equipped && saved.equipped[slot];
        if (id && SKILLS[id] && fresh.unlocked[id] && SKILLS[id].slot === slot) {
          fresh.equipped[slot] = id;
        }
      }
      return fresh;
    } catch (err) {
      return fresh;
    }
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      /* The in-memory loadout still works when local storage is unavailable. */
    }
  }

  function notify() {
    render();
    document.dispatchEvent(new CustomEvent('devour:skills-changed', {
      detail: snapshot(),
    }));
  }

  function snapshot() {
    return {
      version: data.version,
      unlocked: { ...data.unlocked },
      equipped: { ...data.equipped },
    };
  }

  function equip(id) {
    const skill = SKILLS[id];
    if (!skill || !data.unlocked[id]) return false;
    data.equipped[skill.slot] = id;
    save();
    notify();
    return true;
  }

  function unequip(id) {
    const skill = SKILLS[id];
    if (!skill) return false;
    if (data.equipped[skill.slot] === id) data.equipped[skill.slot] = null;
    save();
    notify();
    return true;
  }

  function toggle(id) {
    const skill = SKILLS[id];
    if (!skill || !data.unlocked[id]) return false;
    return data.equipped[skill.slot] === id ? unequip(id) : equip(id);
  }

  function unlock(id) {
    const skill = SKILLS[id];
    if (!skill) return false;
    const firstUnlock = !data.unlocked[id];
    data.unlocked[id] = true;

    // A newly found core is immediately useful. Red intentionally replaces green
    // on the shared E slot; replaying green must not overwrite a chosen red loadout.
    if (skill.slot === 'q') {
      data.equipped.q = id;
    } else if (id === 'red' || !data.equipped.e) {
      data.equipped.e = id;
    }

    save();
    notify();
    return firstUnlock;
  }

  function isUnlocked(id) {
    return Boolean(SKILLS[id] && data.unlocked[id]);
  }

  function isInstalled(id) {
    return Boolean(SKILLS[id] && data.equipped[SKILLS[id].slot] === id);
  }

  function getEquipped(slot) {
    const id = data.equipped[slot];
    return id && data.unlocked[id] ? id : null;
  }

  function getSkill(id) {
    return SKILLS[id] ? { ...SKILLS[id] } : null;
  }

  function skillCardMarkup(skill) {
    return `
      <article class="skill-card" data-skill-card="${skill.id}" style="--skill-color:${skill.color}">
        <div class="skill-orb" aria-hidden="true"><i></i></div>
        <div class="skill-card-copy">
          <span class="skill-card-kicker">${skill.subtitle}</span>
          <h3>${skill.name}</h3>
          <p>${skill.desc}</p>
        </div>
        <div class="skill-card-state">
          <span class="skill-status" data-skill-status="${skill.id}">未解锁</span>
          <button class="skill-install" type="button" data-skill-install="${skill.id}" disabled>吞噬核心后解锁</button>
        </div>
      </article>`;
  }

  function render() {
    if (skillList && !skillList.dataset.ready) {
      skillList.innerHTML = Object.values(SKILLS).map(skillCardMarkup).join('');
      skillList.dataset.ready = 'true';
      skillList.querySelectorAll('[data-skill-install]').forEach((button) => {
        button.addEventListener('click', () => toggle(button.dataset.skillInstall));
      });
    }

    for (const skill of Object.values(SKILLS)) {
      const card = document.querySelector(`[data-skill-card="${skill.id}"]`);
      const status = document.querySelector(`[data-skill-status="${skill.id}"]`);
      const button = document.querySelector(`[data-skill-install="${skill.id}"]`);
      if (!card || !status || !button) continue;
      const unlocked = isUnlocked(skill.id);
      const installed = isInstalled(skill.id);
      card.classList.toggle('is-locked', !unlocked);
      card.classList.toggle('is-equipped', installed);
      status.textContent = !unlocked ? '未解锁' : (installed ? '已安装' : '已解锁');
      button.disabled = !unlocked;
      if (!unlocked) {
        button.textContent = '吞噬核心后解锁';
      } else if (installed) {
        button.textContent = '卸下';
      } else if (skill.slot === 'e') {
        button.textContent = '替换 E 技能';
      } else {
        button.textContent = '安装 Q 技能';
      }
    }
  }

  function activateTab(name, focus = false) {
    if (name !== 'audio' && name !== 'skills') return;
    activeTab = name;
    tabs.forEach((tab) => {
      const selected = tab.dataset.settingsTab === name;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.settingsPanel === name;
      panel.hidden = !selected;
      panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
    });
    if (name === 'skills') render();
    if (focus) {
      const target = name === 'skills'
        ? skillList?.querySelector('.skill-install:not(:disabled)')
        : document.getElementById('musicVolumeSlider');
      target?.focus({ preventScroll: true });
    }
  }

  function getSettingsFocusTarget() {
    if (activeTab === 'skills') {
      return skillList?.querySelector('.skill-install:not(:disabled)') ||
        tabs.find((tab) => tab.dataset.settingsTab === 'skills');
    }
    return document.getElementById('musicVolumeSlider');
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.settingsTab, true));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
      activateTab(tabs[next].dataset.settingsTab, true);
    });
  });

  document.addEventListener('devour:settings-open', () => {
    render();
    activateTab(activeTab);
  });

  // The skill UI is created here so locked cards can still explain their reward.
  render();
  if (settingsScreen) activateTab(activeTab);

  window.DevourSkills = {
    skills: SKILLS,
    showTab: (name) => activateTab(name),
    unlock,
    equip,
    unequip,
    toggle,
    isUnlocked,
    isInstalled,
    getEquipped,
    getSkill,
    getState: snapshot,
    getSettingsFocusTarget,
  };
})();
