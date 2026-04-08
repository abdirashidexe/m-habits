import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  appReducer,
  initialState,
  ActionTypes,
  defaultUserProfile,
} from './AppReducer';
import * as storage from '../utils/storage';
import { setDevDateOverride } from '../utils/now';
import {
  cancelHabitReminder,
  requestNotificationPermissions,
  rescheduleAllHabitReminders,
  setupAndroidNotificationChannel,
  cancelAllLocalNotifications,
} from '../utils/notifications';

/**
 * @param {unknown[]} raw
 * @returns {{ date: string, completed: true }[]}
 */
function normalizeQuranLogs(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const q of raw) {
    if (!q || typeof q !== 'object' || typeof q.date !== 'string') continue;
    const completed =
      q.completed === true ||
      (typeof q.pagesRead === 'number' && q.pagesRead >= 1);
    if (!completed) continue;
    if (seen.has(q.date)) continue;
    seen.add(q.date);
    out.push({ date: q.date, completed: true });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

/**
 * @param {unknown} p
 * @returns {import('./AppReducer').UserProfile}
 */
function normalizeUserProfile(p) {
  const base = { ...defaultUserProfile, ...(p && typeof p === 'object' ? p : {}) };
  const g = Number(base.quranDailyGoal);
  base.quranDailyGoal = Number.isFinite(g) ? Math.min(604, Math.max(1, Math.floor(g))) : 1;
  return base;
}

/** @type {React.Context<null | ReturnType<typeof buildContextValue>>} */
const AppContext = createContext(null);

function buildContextValue(state, dispatch) {
  return { state, dispatch };
}

/**
 * @returns {{ state: import('./AppReducer').AppState, dispatch: React.Dispatch<any> }}
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [habits, habitLogs, quranLogsRaw, userProfileRaw, onboardedRaw, masterRaw, devDateRaw] =
        await Promise.all([
          storage.readJson(storage.KEYS.habits, []),
          storage.readJson(storage.KEYS.habitLogs, []),
          storage.readJson(storage.KEYS.quranLogs, []),
          storage.readJson(storage.KEYS.userProfile, null),
          storage.readJson(storage.KEYS.onboarded, 'false'),
          storage.readJson(storage.KEYS.masterNotifications, 'true'),
          storage.readJson(storage.KEYS.devDate, null),
        ]);
      if (cancelled) return;
      const quranLogs = normalizeQuranLogs(quranLogsRaw);
      const userProfile = normalizeUserProfile(userProfileRaw);
      const devDateOverride = typeof devDateRaw === 'string' ? devDateRaw : null;
      setDevDateOverride(devDateOverride);
      dispatch({
        type: ActionTypes.HYDRATE,
        payload: {
          habits,
          habitLogs,
          quranLogs,
          userProfile,
          onboarded: onboardedRaw === 'true',
          masterNotificationsEnabled: masterRaw !== 'false',
          devDateOverride,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.writeJson(storage.KEYS.habits, state.habits);
  }, [state.habits, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.writeJson(storage.KEYS.habitLogs, state.habitLogs);
  }, [state.habitLogs, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.writeJson(storage.KEYS.quranLogs, state.quranLogs);
  }, [state.quranLogs, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.writeJson(storage.KEYS.userProfile, state.userProfile);
  }, [state.userProfile, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.writeJson(storage.KEYS.onboarded, state.onboarded ? 'true' : 'false');
  }, [state.onboarded, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.writeJson(
      storage.KEYS.masterNotifications,
      state.masterNotificationsEnabled ? 'true' : 'false'
    );
  }, [state.masterNotificationsEnabled, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    setDevDateOverride(state.devDateOverride);
    storage.writeJson(storage.KEYS.devDate, state.devDateOverride);
  }, [state.devDateOverride, state.hydrated]);

  const syncReminders = useCallback(async () => {
    await setupAndroidNotificationChannel();
    if (!state.masterNotificationsEnabled || !state.onboarded) {
      await cancelAllLocalNotifications();
      return;
    }
    await rescheduleAllHabitReminders(state.habits);
  }, [state.habits, state.masterNotificationsEnabled, state.onboarded]);

  useEffect(() => {
    if (!state.hydrated) return;
    syncReminders();
  }, [state.hydrated, syncReminders]);

  const value = useMemo(() => buildContextValue(state, dispatch), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Call after onboarding completes.
 * @returns {Promise<void>}
 */
export async function runPostOnboardingNotificationSetup() {
  await setupAndroidNotificationChannel();
  await requestNotificationPermissions();
}

export { ActionTypes, cancelHabitReminder };
