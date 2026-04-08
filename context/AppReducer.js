/**
 * @typedef {Object} Habit
 * @property {string} id
 * @property {string} name
 * @property {'quran' | 'athkar' | 'custom'} type
 * @property {'daily' | 'specific_days'} frequency
 * @property {number[]} specificDays
 * @property {boolean} reminderEnabled
 * @property {string | null} reminderTime
 * @property {string} createdAt
 * @property {boolean} isPremium
 */

/**
 * @typedef {Object} HabitLog
 * @property {string} habitId
 * @property {string} date
 * @property {boolean} completed
 * @property {string | null} completedAt
 */

/**
 * @typedef {Object} AthkarSession
 * @property {'morning' | 'evening' | 'night'} type
 * @property {string} date
 * @property {boolean} completed
 * @property {string | null} completedAt
 */

/**
 * @typedef {Object} QuranLog
 * @property {string} date
 * @property {number} pagesRead
 * @property {string} surahFrom
 * @property {number} ayahFrom
 * @property {string} surahTo
 * @property {number} ayahTo
 * @property {string} notes
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {boolean} isPremium
 * @property {string | null} premiumSince
 * @property {string} joinedAt
 * @property {string} timezone
 */

/**
 * @typedef {Object} AppState
 * @property {Habit[]} habits
 * @property {HabitLog[]} habitLogs
 * @property {AthkarSession[]} athkarSessions
 * @property {QuranLog[]} quranLogs
 * @property {UserProfile} userProfile
 * @property {boolean} onboarded
 * @property {boolean} masterNotificationsEnabled
 * @property {boolean} hydrated
 */

/** @type {UserProfile} */
export const defaultUserProfile = {
  name: '',
  isPremium: false,
  premiumSince: null,
  joinedAt: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

/** @type {AppState} */
export const initialState = {
  habits: [],
  habitLogs: [],
  athkarSessions: [],
  quranLogs: [],
  userProfile: { ...defaultUserProfile },
  onboarded: false,
  masterNotificationsEnabled: true,
  hydrated: false,
};

export const ActionTypes = {
  HYDRATE: 'HYDRATE',
  SET_ONBOARDED: 'SET_ONBOARDED',
  SET_USER_NAME: 'SET_USER_NAME',
  SET_PREMIUM: 'SET_PREMIUM',
  SET_MASTER_NOTIFICATIONS: 'SET_MASTER_NOTIFICATIONS',
  SET_HABITS: 'SET_HABITS',
  ADD_HABIT: 'ADD_HABIT',
  UPDATE_HABIT: 'UPDATE_HABIT',
  DELETE_HABIT: 'DELETE_HABIT',
  SET_HABIT_LOGS: 'SET_HABIT_LOGS',
  TOGGLE_HABIT_LOG: 'TOGGLE_HABIT_LOG',
  SET_ATHKAR_SESSIONS: 'SET_ATHKAR_SESSIONS',
  COMPLETE_ATHKAR_SESSION: 'COMPLETE_ATHKAR_SESSION',
  SET_QURAN_LOGS: 'SET_QURAN_LOGS',
  UPSERT_QURAN_LOG: 'UPSERT_QURAN_LOG',
  RESET_ALL: 'RESET_ALL',
};

/**
 * @param {AppState} state
 * @param {{ type: string, payload?: unknown }} action
 * @returns {AppState}
 */
export function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.HYDRATE: {
      /** @type {Partial<AppState>} */
      const p = action.payload || {};
      return {
        ...state,
        ...p,
        userProfile: p.userProfile
          ? { ...defaultUserProfile, ...p.userProfile }
          : state.userProfile,
        hydrated: true,
      };
    }
    case ActionTypes.SET_ONBOARDED: {
      const ob = Boolean(action.payload);
      return {
        ...state,
        onboarded: ob,
        userProfile:
          ob && !state.userProfile.joinedAt
            ? { ...state.userProfile, joinedAt: new Date().toISOString() }
            : state.userProfile,
      };
    }
    case ActionTypes.SET_USER_NAME:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          name: String(action.payload || ''),
        },
      };
    case ActionTypes.SET_PREMIUM: {
      const on = Boolean(action.payload);
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          isPremium: on,
          premiumSince: on ? state.userProfile.premiumSince || new Date().toISOString() : null,
        },
      };
    }
    case ActionTypes.SET_MASTER_NOTIFICATIONS:
      return { ...state, masterNotificationsEnabled: Boolean(action.payload) };
    case ActionTypes.SET_HABITS:
      return { ...state, habits: Array.isArray(action.payload) ? action.payload : [] };
    case ActionTypes.ADD_HABIT:
      return { ...state, habits: [...state.habits, action.payload] };
    case ActionTypes.UPDATE_HABIT: {
      /** @type {Habit} */
      const h = action.payload;
      return {
        ...state,
        habits: state.habits.map((x) => (x.id === h.id ? h : x)),
      };
    }
    case ActionTypes.DELETE_HABIT:
      return {
        ...state,
        habits: state.habits.filter((x) => x.id !== action.payload),
        habitLogs: state.habitLogs.filter((l) => l.habitId !== action.payload),
      };
    case ActionTypes.SET_HABIT_LOGS:
      return { ...state, habitLogs: Array.isArray(action.payload) ? action.payload : [] };
    case ActionTypes.TOGGLE_HABIT_LOG: {
      /** @type {{ habitId: string, date: string, completed: boolean }} */
      const { habitId, date, completed } = action.payload;
      const idx = state.habitLogs.findIndex((l) => l.habitId === habitId && l.date === date);
      const next = [...state.habitLogs];
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        };
      } else {
        next.push({
          habitId,
          date,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        });
      }
      return { ...state, habitLogs: next };
    }
    case ActionTypes.SET_ATHKAR_SESSIONS:
      return {
        ...state,
        athkarSessions: Array.isArray(action.payload) ? action.payload : [],
      };
    case ActionTypes.COMPLETE_ATHKAR_SESSION: {
      /** @type {{ type: 'morning'|'evening'|'night', date: string }} */
      const { type, date } = action.payload;
      const idx = state.athkarSessions.findIndex((s) => s.type === type && s.date === date);
      const next = [...state.athkarSessions];
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          completed: true,
          completedAt: new Date().toISOString(),
        };
      } else {
        next.push({
          type,
          date,
          completed: true,
          completedAt: new Date().toISOString(),
        });
      }
      return { ...state, athkarSessions: next };
    }
    case ActionTypes.SET_QURAN_LOGS:
      return { ...state, quranLogs: Array.isArray(action.payload) ? action.payload : [] };
    case ActionTypes.UPSERT_QURAN_LOG: {
      /** @type {QuranLog} */
      const log = action.payload;
      const idx = state.quranLogs.findIndex((q) => q.date === log.date);
      const next = [...state.quranLogs];
      if (idx >= 0) next[idx] = log;
      else next.push(log);
      return { ...state, quranLogs: next };
    }
    case ActionTypes.RESET_ALL:
      return {
        ...initialState,
        userProfile: {
          ...defaultUserProfile,
        },
        hydrated: true,
      };
    default:
      return state;
  }
}
