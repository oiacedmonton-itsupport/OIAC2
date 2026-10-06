// Prayer times export (admin "Download" dialog): spreadsheet (.xlsx) and image (.png).
// Pure helpers first (no DOM; unit-testable), then the browser-only download functions.
// Times are written exactly as stored — the permanent UTC-6 shift is already applied in the data.

import type { Sheet, SheetData, Cell } from 'write-excel-file/browser';

export type PrayerTimeKey =
  | 'fajrBegins' | 'fajrJamah' | 'sunrise' | 'zuhrBegins' | 'zuhrJamah' | 'asrBegins' | 'asrJamah'
  | 'maghribBegins' | 'maghribJamah' | 'ishaBegins' | 'ishaJamah';

/** Loose shape of what GET /api/cms/prayer-times returns (day may arrive as a string). */
export type PrayerTimeApiRecord = { month: number | string; day: number | string } & Partial<Record<PrayerTimeKey, string | null>>;

export type ExportRow = {
  day: number;
  dateLabel: string; // "Oct 6"
  weekday: string;   // "Tuesday"
  isFriday: boolean;
  times: Record<PrayerTimeKey, string>; // '' when missing
  missing: boolean;  // no record for this day
};

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_SHORT = MONTH_NAMES.map(m => m.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TIME_KEYS: PrayerTimeKey[] = ['fajrBegins', 'fajrJamah', 'sunrise', 'zuhrBegins', 'zuhrJamah',
  'asrBegins', 'asrJamah', 'maghribBegins', 'maghribJamah', 'ishaBegins', 'ishaJamah'];

export const SPREADSHEET_HEADERS = ['Date', 'Day', 'Fajr Begins', 'Fajr Iqamah', 'Sunrise', 'Zuhr Begins', 'Zuhr Iqamah',
  'Asr Begins', 'Asr Iqamah', 'Maghrib Begins', 'Maghrib Iqamah', 'Isha Begins', 'Isha Iqamah'];

export const SITE_URL = 'oiacedmonton.ca';
export const CENTRE_NAME = 'Omar Ibn Al-Khattab Centre';

/** Current year in Edmonton (Alberta is on permanent UTC-6). */
export function currentEdmontonYear(now: Date = new Date()): number {
  return Number(now.toLocaleDateString('en-CA', { timeZone: 'Etc/GMT+6' }).slice(0, 4));
}

/**
 * Year a month's timetable is for: months already behind us this year refer to next year
 * (e.g. exporting January in December), so weekdays and Fridays line up with the dates handed out.
 */
export function exportYearForMonth(month: number, now: Date = new Date()): number {
  const [y, m] = now.toLocaleDateString('en-CA', { timeZone: 'Etc/GMT+6' }).split('-').map(Number);
  return month < m ? y + 1 : y;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** One row per calendar day of `month` in `year`, sorted by day; days without a record are flagged `missing`. */
export function buildMonthRows(records: PrayerTimeApiRecord[], month: number, year: number): ExportRow[] {
  const byDay = new Map<number, PrayerTimeApiRecord>();
  for (const r of records || []) {
    if (Number(r.month) === month) byDay.set(Number(r.day), r);
  }
  const rows: ExportRow[] = [];
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const rec = byDay.get(day);
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const times = {} as Record<PrayerTimeKey, string>;
    TIME_KEYS.forEach(k => { times[k] = rec && rec[k] ? String(rec[k]).trim() : ''; });
    rows.push({
      day,
      dateLabel: `${MONTH_SHORT[month - 1]} ${day}`,
      weekday: WEEKDAYS[dow],
      isFriday: dow === 5,
      times,
      missing: !rec,
    });
  }
  return rows;
}

/** "oiac-prayer-times-2026-10-october.xlsx" or "oiac-prayer-times-2026-full-year.xlsx". */
export function exportFilename(year: number, month: number | null, ext: 'xlsx' | 'png'): string {
  const part = month === null ? 'full-year' : `${String(month).padStart(2, '0')}-${MONTH_NAMES[month - 1].toLowerCase()}`;
  return `oiac-prayer-times-${year}-${part}.${ext}`;
}

const XLSX_COLUMNS = [{ width: 10 }, { width: 12 }, ...TIME_KEYS.map(() => ({ width: 15 }))];
const XLSX_HEADER_BG = '#8f4843'; // terracottaRed
const XLSX_FRIDAY_BG = '#eef0e0'; // sageGreen-lighter

export function buildSheet(rows: ExportRow[], sheetName: string): Sheet<Blob> {
  const header: Cell[] = SPREADSHEET_HEADERS.map(h => ({
    value: h, fontWeight: 'bold', textColor: '#ffffff', backgroundColor: XLSX_HEADER_BG, align: 'center',
  }));
  const data: SheetData = [header];
  rows.forEach(r => {
    const style = r.isFriday ? { backgroundColor: XLSX_FRIDAY_BG } : {};
    data.push([
      { value: r.dateLabel, ...style },
      { value: r.weekday, ...style, ...(r.isFriday ? { fontWeight: 'bold' as const } : {}) },
      ...TIME_KEYS.map((k): Cell => ({ value: r.times[k] || undefined, align: 'center', ...style })),
    ]);
  });
  return { data, sheet: sheetName, columns: XLSX_COLUMNS, stickyRowsCount: 1 };
}

/** Sheets for a single month (one sheet) or the whole year (one sheet per month, Jan..Dec). */
export function buildSheets(records: PrayerTimeApiRecord[], year: number, month: number | null): Sheet<Blob>[] {
  if (month !== null) return [buildSheet(buildMonthRows(records, month, year), `${MONTH_NAMES[month - 1]} ${year}`)];
  return MONTH_NAMES.map((name, i) => buildSheet(buildMonthRows(records, i + 1, year), name));
}

// ---------------- Browser-only ----------------

export async function fetchPrayerTimes(month: number | null): Promise<PrayerTimeApiRecord[]> {
  const res = await fetch('/api/cms/prayer-times' + (month === null ? '' : `?month=${month}`), { cache: 'no-store' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Could not load prayer times (HTTP ${res.status})`);
  if (!Array.isArray(data)) throw new Error('Unexpected response from the server');
  return data;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function createXlsxBlob(records: PrayerTimeApiRecord[], year: number, month: number | null): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser'); // lazy: only loaded on first spreadsheet download
  return writeXlsxFile(buildSheets(records, year, month), { fontFamily: 'Calibri', fontSize: 11 }).toBlob();
}

// ---- Image (Canvas 2D) ----

const C = {
  bg: '#faf4ec',            // softBeige-lightest
  headerRule: '#c3b6a4',    // softBeige-dark
  brand: '#8f4843',         // terracottaRed
  brandDark: '#723a36',     // terracottaRed-darker
  brandDarkest: '#5a2d2a',  // terracottaRed-darkest
  subHeaderBg: '#e1d5c5',   // softBeige-lighter
  rowAlt: '#f3ebe0',
  rowBase: '#ffffff',
  friday: '#eef0e0',        // sageGreen-lighter
  fridayAccent: '#5b5f32',  // sageGreen-dark
  text: '#2b2321',
  muted: '#7a6f66',
  grid: '#e6dccf',
};
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

function loadImage(src: string, timeoutMs = 5000): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}

/** Draws a branded one-month timetable and returns it as a PNG blob (2x scale). */
export async function createImageBlob(records: PrayerTimeApiRecord[], year: number, month: number, logoUrl: string): Promise<Blob> {
  const rows = buildMonthRows(records, month, year);
  const [logo] = await Promise.all([loadImage(logoUrl), document.fonts ? document.fonts.ready : Promise.resolve()]);

  const W = 1200, PAD = 48, SCALE = 2;
  const HEADER_H = 190, GROUP_H = 38, SUB_H = 28, ROW_H = 28, FOOTER_H = 84;
  const tableTop = HEADER_H + 16;
  const bodyTop = tableTop + GROUP_H + SUB_H;
  const H = bodyTop + rows.length * ROW_H + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser');
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'middle';

  // Background + top accent bar
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.brand;
  ctx.fillRect(0, 0, W, 8);

  // Header: logo, centre name, month title, subtitle
  const LOGO = 150;
  let textX = PAD;
  if (logo) {
    ctx.drawImage(logo, PAD - 10, 22, LOGO, LOGO);
    textX = PAD + LOGO + 12;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = C.brand;
  ctx.font = font(600, 18);
  ctx.fillText(CENTRE_NAME.toUpperCase(), textX, 62);
  ctx.fillStyle = C.brandDarkest;
  ctx.font = font(800, 54);
  ctx.fillText(`${MONTH_NAMES[month - 1]} ${year}`, textX - 2, 108, W - PAD - textX);
  ctx.fillStyle = C.fridayAccent;
  ctx.font = font(500, 22);
  ctx.fillText('Prayer Times  ·  Edmonton, AB', textX, 150);

  ctx.fillStyle = C.headerRule;
  ctx.fillRect(PAD, HEADER_H, W - PAD * 2, 1);

  // Column layout: Date, Day, then 11 time columns
  const tableW = W - PAD * 2;
  const DATE_W = 66, DAY_W = 84;
  const timeW = (tableW - DATE_W - DAY_W) / TIME_KEYS.length;
  const colX: number[] = [PAD, PAD + DATE_W];
  for (let i = 0; i <= TIME_KEYS.length; i++) colX.push(PAD + DATE_W + DAY_W + i * timeW);
  // colX[2 + i] = left edge of time column i; colX[13] = right edge of the table
  const timeColX = (i: number) => colX[2 + i];

  // Groups: [label, first time-col index, span]
  const groups: [string, number, number][] = [
    ['Fajr', 0, 2], ['Sunrise', 2, 1], ['Zuhr', 3, 2], ['Asr', 5, 2], ['Maghrib', 7, 2], ['Isha', 9, 2],
  ];

  // Group header row (Date / Day / Sunrise span both header rows)
  ctx.fillStyle = C.brand;
  ctx.fillRect(PAD, tableTop, tableW, GROUP_H);
  ctx.fillStyle = C.subHeaderBg;
  ctx.fillRect(PAD, tableTop + GROUP_H, tableW, SUB_H);
  ctx.fillStyle = C.brand;
  ctx.fillRect(PAD, tableTop + GROUP_H, DATE_W + DAY_W, SUB_H);
  ctx.fillRect(timeColX(2), tableTop + GROUP_H, timeW, SUB_H);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(700, 17);
  ctx.textAlign = 'center';
  const twoRowMid = tableTop + (GROUP_H + SUB_H) / 2;
  ctx.fillText('Date', PAD + DATE_W / 2, twoRowMid);
  ctx.fillText('Day', PAD + DATE_W + DAY_W / 2, twoRowMid);
  groups.forEach(([label, start, span]) => {
    const x = timeColX(start) + (span * timeW) / 2;
    ctx.fillText(label, x, span === 1 ? twoRowMid : tableTop + GROUP_H / 2);
  });

  ctx.fillStyle = C.brandDark;
  ctx.font = font(600, 13);
  groups.forEach(([, start, span]) => {
    if (span !== 2) return;
    ctx.fillText('BEGINS', timeColX(start) + timeW / 2, tableTop + GROUP_H + SUB_H / 2);
    ctx.fillText('IQAMAH', timeColX(start + 1) + timeW / 2, tableTop + GROUP_H + SUB_H / 2);
  });

  // Body rows
  rows.forEach((r, idx) => {
    const y = bodyTop + idx * ROW_H;
    ctx.fillStyle = r.isFriday ? C.friday : idx % 2 === 0 ? C.rowBase : C.rowAlt;
    ctx.fillRect(PAD, y, tableW, ROW_H);
    if (r.isFriday) {
      ctx.fillStyle = C.fridayAccent;
      ctx.fillRect(PAD, y, 4, ROW_H);
    }
    const midY = y + ROW_H / 2 + 0.5;

    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.font = font(700, 15);
    ctx.fillText(String(r.day), PAD + 18, midY);
    ctx.fillStyle = r.isFriday ? C.fridayAccent : C.muted;
    ctx.font = font(r.isFriday ? 700 : 500, 15);
    ctx.fillText(r.isFriday ? "Jumu'ah" : r.weekday.slice(0, 3), PAD + DATE_W + 4, midY, DAY_W - 8);

    ctx.textAlign = 'center';
    TIME_KEYS.forEach((k, i) => {
      const value = r.times[k];
      const isIqamah = k.endsWith('Jamah');
      ctx.fillStyle = value ? (isIqamah ? C.brandDarkest : C.text) : C.muted;
      ctx.font = font(isIqamah ? 700 : 400, 15);
      ctx.fillText(value || '—', timeColX(i) + timeW / 2, midY, timeW - 8);
    });
  });

  // Grid: vertical separators between groups, outer border
  const tableBottom = bodyTop + rows.length * ROW_H;
  ctx.fillStyle = C.grid;
  [colX[2], ...groups.slice(1).map(([, s]) => timeColX(s))].forEach(x => ctx.fillRect(Math.round(x), bodyTop, 1, tableBottom - bodyTop));
  groups.forEach(([, start, span]) => {
    if (span === 2) ctx.fillRect(Math.round(timeColX(start + 1)), tableTop + GROUP_H + 6, 1, SUB_H - 12);
  });
  ctx.strokeStyle = C.headerRule;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD + 0.5, tableTop + 0.5, tableW - 1, tableBottom - tableTop - 1);

  // Footer
  const footY = tableBottom + FOOTER_H / 2;
  ctx.fillStyle = C.friday;
  ctx.fillRect(PAD, footY - 9, 18, 18);
  ctx.fillStyle = C.fridayAccent;
  ctx.fillRect(PAD, footY - 9, 4, 18);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.muted;
  ctx.font = font(500, 15);
  ctx.fillText("Friday (Jumu'ah)   ·   Bold = Iqamah", PAD + 28, footY);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.brand;
  ctx.font = font(700, 20);
  ctx.fillText(SITE_URL, W - PAD, footY);

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png');
  });
}
