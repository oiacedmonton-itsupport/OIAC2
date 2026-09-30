import { getJummahTimesFromDB, getPrayerTimeByDay, getPrayerTimesByMonth } from '../db';

// 2026 timetable the DB was seeded from (see api/cms/seed-prayer-times.ts); bundled so it works when the DB is down
const fallbackPrayerTimes = Object.values(
  import.meta.glob<Omit<PrayerTime, 'id' | 'isFallback'>>('../../content/prayer-times/*.json', { eager: true, import: 'default' })
);

export type PrayerTime = {
  id: string;
  month: number;
  day: number;
  fajrBegins: string;
  fajrJamah: string;
  sunrise: string;
  zuhrBegins: string;
  zuhrJamah: string;
  asrBegins: string;
  asrJamah: string;
  maghribBegins: string;
  maghribJamah: string;
  ishaBegins: string;
  ishaJamah: string;
  // True when the DB was unreachable and times came from the bundled src/content/prayer-times snapshot
  isFallback?: boolean;
};

export type JummahTime = {
  name: string;
  time: string;
};

// The server runs in UTC, so using `new Date()` directly would return
// the wrong date for Edmonton users after ~5–7pm MST/MDT.
function getEdmontonMonthAndDay(): { month: number; day: number } {
  const edmontonDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' }); // "YYYY-MM-DD"
  const [, monthStr, dayStr] = edmontonDateStr.split('-');
  return { month: parseInt(monthStr, 10), day: parseInt(dayStr, 10) };
}

function getFallbackPrayerTimes(month: number, day?: number): PrayerTime[] {
  return fallbackPrayerTimes
    .filter(pt => pt.month === month && (day === undefined || pt.day === day))
    .sort((a, b) => a.day - b.day)
    .map(pt => ({ ...pt, id: `fallback-${pt.month}-${pt.day}`, isFallback: true }));
}

export async function getPrayerTimesForCurrentDay(): Promise<PrayerTime | undefined> {
  const { month, day } = getEdmontonMonthAndDay();
  try {
    const record = await getPrayerTimeByDay(month, day);
    if (!record) return undefined;

    return {
      id: record.id,
      month: record.month,
      day: record.day,
      fajrBegins: record.fajrBegins,
      fajrJamah: record.fajrJamah,
      sunrise: record.sunrise,
      zuhrBegins: record.zuhrBegins,
      zuhrJamah: record.zuhrJamah,
      asrBegins: record.asrBegins,
      asrJamah: record.asrJamah,
      maghribBegins: record.maghribBegins,
      maghribJamah: record.maghribJamah,
      ishaBegins: record.ishaBegins,
      ishaJamah: record.ishaJamah,
    };
  } catch (error) {
    console.error('Error fetching prayer times for current day:', error);
    return getFallbackPrayerTimes(month, day)[0];
  }
}

export async function getPrayerTimesForCurrentMonth(): Promise<PrayerTime[]> {
  const { month } = getEdmontonMonthAndDay();
  try {

    const records = await getPrayerTimesByMonth(month);

    return records.map(record => ({
      id: record.id,
      month: record.month,
      day: record.day,
      fajrBegins: record.fajrBegins,
      fajrJamah: record.fajrJamah,
      sunrise: record.sunrise,
      zuhrBegins: record.zuhrBegins,
      zuhrJamah: record.zuhrJamah,
      asrBegins: record.asrBegins,
      asrJamah: record.asrJamah,
      maghribBegins: record.maghribBegins,
      maghribJamah: record.maghribJamah,
      ishaBegins: record.ishaBegins,
      ishaJamah: record.ishaJamah,
    })).sort((a, b) => a.day - b.day);
  } catch (error) {
    console.error('Error fetching prayer times for current month:', error);
    return getFallbackPrayerTimes(month);
  }
}

export async function getJummahTimes(): Promise<JummahTime[]> {
  try {
    const records = await getJummahTimesFromDB();

    return records.map(jt => ({
      name: jt.name,
      time: jt.time,
    }));
  } catch (error) {
    console.error('Error fetching jummah times:', error);
    return [];
  }
}
