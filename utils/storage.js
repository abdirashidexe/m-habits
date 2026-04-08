import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  habits: 'nur_habits',
  habitLogs: 'nur_habit_logs',
  athkarSessions: 'nur_athkar_sessions',
  quranLogs: 'nur_quran_logs',
  userProfile: 'nur_user_profile',
  onboarded: 'nur_onboarded',
  masterNotifications: 'nur_master_notifications',
};

/**
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {Promise<T>}
 */
export async function readJson(key, defaultValue) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 * @returns {Promise<void>}
 */
export async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/**
 * @returns {Promise<void>}
 */
export async function clearAllNurKeys() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
