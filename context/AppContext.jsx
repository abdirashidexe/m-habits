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
import {
  cancelHabitReminder,
  requestNotificationPermissions,
  rescheduleAllHabitReminders,
  setupAndroidNotificationChannel,
  cancelAllLocalNotifications,
} from '../utils/notifications';

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
      const [
        habits,
        habitLogs,
        athkarSessions,
        quranLogs,
        userProfile,
        onboardedRaw,
        masterRaw,
      ] = await Promise.all([
        storage.readJson(storage.KEYS.habits, []),
        storage.readJson(storage.KEYS.habitLogs, []),
        storage.readJson(storage.KEYS.athkarSessions, []),
        storage.readJson(storage.KEYS.quranLogs, []),
        storage.readJson(storage.KEYS.userProfile, null),
        storage.readJson(storage.KEYS.onboarded, 'false'),
        storage.readJson(storage.KEYS.masterNotifications, 'true'),
      ]);
      if (cancelled) return;
      const profile = userProfile
        ? { ...defaultUserProfile, ...userProfile }
        : { ...defaultUserProfile };
      dispatch({
        type: ActionTypes.HYDRATE,
        payload: {
          habits,
          habitLogs,
          athkarSessions,
          quranLogs,
          userProfile: profile,
          onboarded: onboardedRaw === 'true',
          masterNotificationsEnabled: masterRaw !== 'false',
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
    storage.writeJson(storage.KEYS.athkarSessions, state.athkarSessions);
  }, [state.athkarSessions, state.hydrated]);

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
