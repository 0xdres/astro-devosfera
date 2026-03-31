type IntroAudioConfig = {
  src: string;
  label: string;
  isStream: boolean;
  durationHint: number;
};

type IntroAudioStore = IntroAudioConfig & {
  audio: HTMLAudioElement;
  hasStarted: boolean;
  listenersBound: boolean;
};

export type IntroAudioState = {
  src: string;
  label: string;
  isStream: boolean;
  playing: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
};

export const INTRO_AUDIO_STATE_EVENT = "intro-audio:state";

declare global {
  interface Window {
    __introAudioStore?: IntroAudioStore;
  }
}

const getEffectiveDuration = (store: IntroAudioStore) => {
  if (store.isStream) return 0;
  const mediaDuration = store.audio.duration;

  if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
    return Math.floor(mediaDuration);
  }

  return Math.max(0, Math.floor(store.durationHint));
};

const readState = (store: IntroAudioStore): IntroAudioState => ({
  src: store.src,
  label: store.label,
  isStream: store.isStream,
  playing: !store.audio.paused,
  hasStarted: store.hasStarted,
  currentTime: store.isStream ? 0 : store.audio.currentTime,
  duration: getEffectiveDuration(store),
});

export const emitIntroAudioState = (store: IntroAudioStore) => {
  window.dispatchEvent(
    new CustomEvent<IntroAudioState>(INTRO_AUDIO_STATE_EVENT, {
      detail: readState(store),
    })
  );
};

const bindStoreListeners = (store: IntroAudioStore) => {
  if (store.listenersBound) return;

  const emit = () => emitIntroAudioState(store);

  store.audio.addEventListener("play", () => {
    store.hasStarted = true;
    emit();
  });
  store.audio.addEventListener("pause", emit);
  store.audio.addEventListener("ended", emit);
  store.audio.addEventListener("timeupdate", emit);
  store.audio.addEventListener("loadedmetadata", emit);
  store.audio.addEventListener("durationchange", emit);

  store.listenersBound = true;
};

const configureStore = (store: IntroAudioStore, next: IntroAudioConfig) => {
  const sourceChanged = store.src !== next.src;

  store.label = next.label;
  store.isStream = next.isStream;
  store.durationHint = next.durationHint;

  if (!sourceChanged) {
    store.audio.preload = next.isStream ? "none" : "metadata";
    return;
  }

  const shouldResume = !store.audio.paused;
  store.audio.pause();
  store.audio.src = next.src;
  store.audio.preload = next.isStream ? "none" : "metadata";
  store.audio.load();
  store.src = next.src;
  store.hasStarted = false;

  if (shouldResume) {
    void store.audio.play().catch(() => {
      /* playback blocked by browser */
    });
  }
};

export const getIntroAudioStore = (config: IntroAudioConfig) => {
  const existing = window.__introAudioStore;

  if (existing) {
    configureStore(existing, config);
    bindStoreListeners(existing);
    emitIntroAudioState(existing);
    return existing;
  }

  const audio = new Audio(config.src);
  audio.preload = config.isStream ? "none" : "metadata";

  const store: IntroAudioStore = {
    ...config,
    audio,
    hasStarted: false,
    listenersBound: false,
  };

  bindStoreListeners(store);
  window.__introAudioStore = store;
  emitIntroAudioState(store);

  return store;
};
