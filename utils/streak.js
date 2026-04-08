import { startOfDay, subDays, isBefore, isAfter, parseISO, isValid } from 'date-fns';
import { getDayIndex, toLocalDateString, eachDayInclusive, parseYmd } from './dates';

/**
 * @typedef {{ id: string, name: string, frequency: string, specificDays: number[], createdAt: string }} Habit
 * @typedef {{ habitId: string, date: string, completed: boolean }} HabitLog
 */

/**
 * @param {Habit} habit
 * @param {Date} date
 * @returns {boolean}
 */
export function isHabitDueOnDate(habit, date) {
  if (!habit) return false;
  if (habit.frequency === 'daily') return true;
  const idx = getDayIndex(date);
  return Array.isArray(habit.specificDays) && habit.specificDays.length > 0 && habit.specificDays.includes(idx);
}

/**
 * @param {string} habitId
 * @param {string} dateStr YYYY-MM-DD
 * @param {HabitLog[]} logs
 * @returns {boolean}
 */
function isCompletedOnDate(habitId, dateStr, logs) {
  const entry = logs.find((l) => l.habitId === habitId && l.date === dateStr);
  return Boolean(entry?.completed);
}

/**
 * @param {Habit} habit
 * @param {HabitLog[]} logs
 * @param {Date} [refDate]
 * @returns {{ currentStreak: number, longestStreak: number, completedToday: boolean, dueToday: boolean, atRisk: boolean }}
 */
export function calculateStreak(habitId, logs, habit, refDate = new Date()) {
  const today = startOfDay(refDate);
  const todayStr = toLocalDateString(today);

  const dueToday = isHabitDueOnDate(habit, today);
  const completedToday = dueToday && isCompletedOnDate(habitId, todayStr, logs);

  const yesterday = subDays(today, 1);
  const yesterdayStr = toLocalDateString(yesterday);
  const dueYesterday = isHabitDueOnDate(habit, yesterday);
  const completedYesterday = dueYesterday && isCompletedOnDate(habitId, yesterdayStr, logs);

  if (dueYesterday && !completedYesterday) {
    if (dueToday && !completedToday) {
      return {
        currentStreak: 0,
        longestStreak: longestStreakEverForHabit(habitId, habit, logs),
        completedToday: false,
        dueToday: true,
        atRisk: true,
      };
    }
    return {
      currentStreak: 0,
      longestStreak: longestStreakEverForHabit(habitId, habit, logs),
      completedToday: Boolean(completedToday),
      dueToday,
      atRisk: dueToday && !completedToday,
    };
  }

  let currentStreak = 0;
  let i = 0;
  const maxDays = 3650;

  while (i < maxDays) {
    const d = subDays(today, i);
    if (!isHabitDueOnDate(habit, d)) {
      i += 1;
      continue;
    }
    const ds = toLocalDateString(d);
    const done = isCompletedOnDate(habitId, ds, logs);
    if (i === 0) {
      if (!done) {
        i += 1;
        continue;
      }
      currentStreak += 1;
      i += 1;
      continue;
    }
    if (done) {
      currentStreak += 1;
      i += 1;
      continue;
    }
    break;
  }

  return {
    currentStreak,
    longestStreak: longestStreakEverForHabit(habitId, habit, logs),
    completedToday: Boolean(completedToday),
    dueToday,
    atRisk: dueToday && !completedToday,
  };
}

/**
 * @param {string} habitId
 * @param {Habit} habit
 * @param {HabitLog[]} logs
 * @returns {number}
 */
export function longestStreakEverForHabit(habitId, habit, logs) {
  const habitLogs = logs.filter((l) => l.habitId === habitId);
  if (habitLogs.length === 0) return 0;

  let minD = todayStrFromIso(habit.createdAt);
  for (const l of habitLogs) {
    const t = parseYmd(l.date);
    const c = parseYmd(minD);
    if (isBefore(t, c)) minD = l.date;
  }

  const maxD = toLocalDateString(new Date());
  const days = eachDayInclusive(parseYmd(minD), parseYmd(maxD));

  let run = 0;
  let best = 0;
  for (const day of days) {
    if (!isHabitDueOnDate(habit, day)) continue;
    const ds = toLocalDateString(day);
    if (isCompletedOnDate(habitId, ds, logs)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * @param {string} iso
 * @returns {string}
 */
function todayStrFromIso(iso) {
  const d = parseISO(iso);
  if (!isValid(d)) return toLocalDateString(new Date());
  return toLocalDateString(d);
}

/**
 * Daily activity: "completed" if predicate true for that calendar day.
 * @param {(dateStr: string) => boolean} isCompletedOnDateStr
 * @param {Date} [refDate]
 * @returns {{ currentStreak: number, longestStreak: number, completedToday: boolean, dueToday: boolean, atRisk: boolean }}
 */
export function calculateDailyStreak(isCompletedOnDateStr, refDate = new Date()) {
  const today = startOfDay(refDate);
  const todayStr = toLocalDateString(today);
  const dueToday = true;
  const completedToday = isCompletedOnDateStr(todayStr);

  const yesterdayStr = toLocalDateString(subDays(today, 1));
  const completedYesterday = isCompletedOnDateStr(yesterdayStr);

  if (!completedYesterday) {
    if (!completedToday) {
      return {
        currentStreak: 0,
        longestStreak: longestDailyStreakFromPredicate(isCompletedOnDateStr, refDate),
        completedToday: false,
        dueToday: true,
        atRisk: true,
      };
    }
  }

  let currentStreak = 0;
  let i = 0;
  const maxDays = 3650;
  while (i < maxDays) {
    const d = subDays(today, i);
    const ds = toLocalDateString(d);
    const done = isCompletedOnDateStr(ds);
    if (i === 0) {
      if (!done) {
        i += 1;
        continue;
      }
      currentStreak += 1;
      i += 1;
      continue;
    }
    if (done) {
      currentStreak += 1;
      i += 1;
      continue;
    }
    break;
  }

  return {
    currentStreak,
    longestStreak: longestDailyStreakFromPredicate(isCompletedOnDateStr, refDate),
    completedToday,
    dueToday: true,
    atRisk: !completedToday,
  };
}

/**
 * @param {(dateStr: string) => boolean} isCompletedOnDateStr
 * @param {Date} refDate
 * @returns {number}
 */
export function longestDailyStreakFromPredicate(isCompletedOnDateStr, refDate) {
  const end = startOfDay(refDate);
  const start = subDays(end, 365 * 5);
  const days = eachDayInclusive(start, end);
  let run = 0;
  let best = 0;
  for (const day of days) {
    const ds = toLocalDateString(day);
    if (isCompletedOnDateStr(ds)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * @typedef {{ date: string, pagesRead: number }} QuranLog
 * @param {QuranLog[]} quranLogs
 * @param {Date} [refDate]
 */
export function calculateQuranStreakState(quranLogs, refDate = new Date()) {
  const byDate = new Map(quranLogs.map((q) => [q.date, q]));
  return calculateDailyStreak((ds) => {
    const log = byDate.get(ds);
    return Boolean(log && log.pagesRead >= 1);
  }, refDate);
}

/**
 * @typedef {{ type: string, date: string, completed: boolean }} AthkarSession
 * @param {'morning' | 'evening' | 'night'} type
 * @param {AthkarSession[]} sessions
 * @param {Date} [refDate]
 */
export function calculateAthkarSessionStreakState(type, sessions, refDate = new Date()) {
  const byDate = new Map();
  for (const s of sessions) {
    if (s.type !== type) continue;
    byDate.set(s.date, s);
  }
  return calculateDailyStreak((ds) => {
    const s = byDate.get(ds);
    return Boolean(s?.completed);
  }, refDate);
}

/**
 * At least one athkar session completed that day.
 * @param {AthkarSession[]} sessions
 * @param {Date} [refDate]
 */
export function calculateAnyAthkarStreakState(sessions, refDate = new Date()) {
  const datesDone = new Set();
  for (const s of sessions) {
    if (s.completed) datesDone.add(s.date);
  }
  return calculateDailyStreak((ds) => datesDone.has(ds), refDate);
}

/**
 * @param {Habit[]} habits
 * @param {HabitLog[]} logs
 * @returns {number} Max of longestStreak ever across custom habits
 */
export function maxLongestStreakAcrossHabits(habits, logs) {
  let m = 0;
  for (const h of habits) {
    const ls = longestStreakEverForHabit(h.id, h, logs);
    if (ls > m) m = ls;
  }
  return m;
}

/**
 * Overall "longest streak" badge: max among habits, quran longest, any-athkar longest.
 * @param {Habit[]} habits
 * @param {HabitLog[]} logs
 * @param {QuranLog[]} quranLogs
 * @param {AthkarSession[]} athkarSessions
 */
export function overallLongestStreakRecord(habits, logs, quranLogs, athkarSessions) {
  let m = maxLongestStreakAcrossHabits(habits, logs);
  const qLong = longestDailyStreakFromPredicate((ds) => {
    const log = quranLogs.find((q) => q.date === ds);
    return Boolean(log && log.pagesRead >= 1);
  }, new Date());
  if (qLong > m) m = qLong;
  const datesDone = new Set();
  for (const s of athkarSessions) {
    if (s.completed) datesDone.add(s.date);
  }
  const aLong = longestDailyStreakFromPredicate((ds) => datesDone.has(ds), new Date());
  if (aLong > m) m = aLong;
  return m;
}

/**
 * @param {string} ymd
 * @param {Date} ref
 * @returns {boolean}
 */
export function isDateInFutureYmd(ymd, ref = new Date()) {
  const d = parseYmd(ymd);
  return isAfter(startOfDay(d), startOfDay(ref));
}
