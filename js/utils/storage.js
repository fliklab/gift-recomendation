const LAST_VERSION_KEY = "lastVersion";
const LAST_SETTINGS_KEY = "lastSettings";

export const storage = {
  getLastVersion() {
    return localStorage.getItem(LAST_VERSION_KEY);
  },

  setLastVersion(version) {
    localStorage.setItem(LAST_VERSION_KEY, version);
  },

  getLastSettings() {
    const settings = localStorage.getItem(LAST_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  },

  setLastSettings(settings) {
    localStorage.setItem(LAST_SETTINGS_KEY, JSON.stringify(settings));
  },

  clearSettings() {
    localStorage.removeItem(LAST_SETTINGS_KEY);
  },
};
