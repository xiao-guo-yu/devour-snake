/* Background music routing and persisted music-volume settings. */
(() => {
  'use strict';

  const STORAGE_KEY = 'devour-music-volume';
  const DEFAULT_VOLUME = 55;
  const TRACK_GAIN = { menu: 0.94, gameplay: 0.7 };
  const FADE_MS = 650;

  const tracks = {
    menu: new Audio('assets/audio/music/menu-theme.mp3'),
    gameplay: new Audio('assets/audio/music/gameplay-theme.mp3'),
  };
  for (const audio of Object.values(tracks)) {
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0;
  }

  const settingsScreen = document.getElementById('settingsScreen');
  const settingsButton = document.getElementById('btnSettings');
  const closeButton = document.getElementById('btnSettingsClose');
  const slider = document.getElementById('musicVolumeSlider');
  const valueLabel = document.getElementById('musicVolumeValue');

  let musicLevel = loadVolume();
  let requestedMode = 'menu';
  let activeMode = null;
  let previousFocus = null;
  const fadeFrames = new WeakMap();

  function clampVolume(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }

  function loadVolume() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === null ? DEFAULT_VOLUME : clampVolume(saved);
    } catch (err) {
      return DEFAULT_VOLUME;
    }
  }

  function saveVolume(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch (err) {
      /* Local files and private browsing may disable storage. */
    }
  }

  function targetVolume(mode) {
    const normalized = musicLevel / 100;
    return normalized * normalized * (TRACK_GAIN[mode] || 1);
  }

  function cancelFade(audio) {
    const frame = fadeFrames.get(audio);
    if (frame) window.cancelAnimationFrame(frame);
    fadeFrames.delete(audio);
  }

  function fadeTo(audio, target, duration = FADE_MS) {
    cancelFade(audio);
    const from = audio.volume;
    const end = Math.max(0, Math.min(1, target));
    if (duration <= 0 || Math.abs(from - end) < 0.002) {
      audio.volume = end;
      return Promise.resolve();
    }
    const startedAt = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        const t = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        audio.volume = Math.max(0, Math.min(1, from + (end - from) * eased));
        if (t < 1) {
          fadeFrames.set(audio, window.requestAnimationFrame(step));
        } else {
          fadeFrames.delete(audio);
          resolve();
        }
      };
      fadeFrames.set(audio, window.requestAnimationFrame(step));
    });
  }

  function playMode(mode) {
    if (!tracks[mode]) return Promise.resolve();
    requestedMode = mode;
    const incoming = tracks[mode];
    const outgoingMode = activeMode && activeMode !== mode ? activeMode : null;
    const outgoing = outgoingMode ? tracks[outgoingMode] : null;
    activeMode = mode;

    const playAttempt = incoming.play();
    if (!playAttempt || typeof playAttempt.then !== 'function') {
      fadeTo(incoming, targetVolume(mode));
      return Promise.resolve();
    }

    return playAttempt.then(() => {
      fadeTo(incoming, targetVolume(mode));
      if (outgoing) {
        fadeTo(outgoing, 0).then(() => {
          if (activeMode !== outgoingMode) outgoing.pause();
        });
      }
      return true;
    }).catch(() => {
      activeMode = requestedMode;
      return false;
    });
  }

  function unlockAndResume() {
    playMode(requestedMode);
  }

  function openSettings() {
    if (!settingsScreen) return;
    previousFocus = document.activeElement;
    settingsScreen.hidden = false;
    settingsScreen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('settings-open');
    slider.value = String(musicLevel);
    updateVolumeUi();
    window.setTimeout(() => slider.focus({ preventScroll: true }), 30);
  }

  function closeSettings() {
    if (!settingsScreen || settingsScreen.hidden) return;
    settingsScreen.hidden = true;
    settingsScreen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('settings-open');
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus({ preventScroll: true });
    }
  }

  function updateVolumeUi() {
    valueLabel.textContent = musicLevel === 0 ? '静音' : `${musicLevel}%`;
    slider.setAttribute('aria-valuetext', valueLabel.textContent);
    slider.style.setProperty('--range-progress', `${musicLevel}%`);
  }

  function setVolume(value, persist = true) {
    musicLevel = clampVolume(value);
    updateVolumeUi();
    if (persist) saveVolume(musicLevel);
    if (activeMode) fadeTo(tracks[activeMode], targetVolume(activeMode), 90);
  }

  if (slider) {
    slider.value = String(musicLevel);
    updateVolumeUi();
    slider.addEventListener('input', () => setVolume(slider.value));
  }
  settingsButton?.addEventListener('click', openSettings);
  closeButton?.addEventListener('click', closeSettings);
  settingsScreen?.addEventListener('pointerdown', (event) => {
    if (event.target === settingsScreen) closeSettings();
  });
  document.addEventListener('keydown', (event) => {
    if (!settingsScreen || settingsScreen.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSettings();
    } else if (event.key === 'Tab') {
      const focusable = [closeButton, slider].filter((element) => element && !element.disabled);
      if (focusable.length < 2) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  }, true);

  document.addEventListener('pointerdown', unlockAndResume, { passive: true });
  document.addEventListener('keydown', unlockAndResume);
  window.addEventListener('focus', unlockAndResume);

  window.DevourAudio = {
    playMenu: () => playMode('menu'),
    playGameplay: () => playMode('gameplay'),
    setVolume,
    getVolume: () => musicLevel,
    getMode: () => activeMode,
    isPlaying: (mode = activeMode) => Boolean(tracks[mode] && !tracks[mode].paused),
    getTrackState: (mode = activeMode) => tracks[mode] ? {
      paused: tracks[mode].paused,
      volume: tracks[mode].volume,
      currentTime: tracks[mode].currentTime,
    } : null,
  };

  playMode('menu');
})();
