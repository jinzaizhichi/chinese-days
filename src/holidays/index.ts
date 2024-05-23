import dayjs, { Dayjs, type ConfigType } from "../utils/dayjs";
import { wrapDate, getDates } from '../utils'
import { holidays as compressedHolidays, workdays as compressedWorkdays, inLieuDays as compressedInLieuDays } from './constants';
import { Holiday } from './arrangement';

const getOriginal = (dates: Record<string, number[]>) => {
  const dateMap: Map<string, Holiday> = new Map();
  Object.keys(dates).forEach((key) => {
    const days = dates[key];
    days.forEach(n => {
      dateMap.set(dayjs('2000-01-01').add(n, 'day').format('YYYY-MM-DD'), Holiday[key as keyof typeof Holiday]);
    })
  });
  return Object.fromEntries(dateMap);
}

const holidays = getOriginal(compressedHolidays);
const workdays = getOriginal(compressedWorkdays);
const inLieuDays = getOriginal(compressedInLieuDays);

const _validateDate = (...dates: ConfigType[]): Dayjs | Dayjs[] => {
  if (dates.length !== 1) {
    return dates.map(date => _validateDate(date)) as Dayjs[];
  }
  const date = wrapDate(dates[0]);
  if (!date.isValid()) {
    throw new Error(`unsupported type ${typeof date}, expected type is Date or Dayjs`);
  }
  const allHolidays = Object.keys(holidays).sort()
  const minYear = dayjs(allHolidays[0]).year();
  const maxYear = dayjs(allHolidays.slice(-1)[0]).year();
  if (!(minYear <= date.year() && date.year() <= maxYear)) {
    throw new Error(`no available data for year ${date.year()}, only year between [${minYear}, ${maxYear}] supported`);
  }
  return date;
}

/** 是否节假日 */
const isHoliday = (date: ConfigType): boolean => {
  return !isWorkday(date);
}

/** 是否工作日 */
const isWorkday = (date: ConfigType): boolean => {
  const validDate = _validateDate(date) as Dayjs;
  const weekday = validDate.day();
  const formattedDate = validDate.format('YYYY-MM-DD');

  return !!(workdays[formattedDate] || (weekday >= 1 && weekday <= 5 && !holidays[formattedDate]));
}

/** 是否调休日 - 是节假日，但后续有需要补班 */
const isInLieu = (date: ConfigType): boolean => {
  date = _validateDate(date) as Dayjs;
  return !!inLieuDays[date.format('YYYY-MM-DD')];
}

/** 获取工作日详情 */
const getDayDetail = (date: ConfigType): { work: boolean, name: string, date: string } => {
  date = _validateDate(date) as Dayjs;
  const formattedDate = date.format('YYYY-MM-DD')
  if (workdays[formattedDate]) {
    return {
      date: formattedDate,
      work: true,
      name: workdays[formattedDate]
    }
  } else if (holidays[formattedDate]) {
    return {
      date: formattedDate,
      work: false,
      name: holidays[formattedDate]
    }
  } else {
    const weekday = date.day();
    return {
      date: formattedDate,
      work: weekday !== 0 && weekday !== 6,
      name: date.format('dddd')
    }
  }
}

/** 获取节假日 */
const getHolidaysInRange = (start: ConfigType, end: ConfigType, includeWeekends: boolean = true): string[] => {
  start = _validateDate(start) as Dayjs;
  end = _validateDate(end) as Dayjs;
  if (includeWeekends) {
    return getDates(start, end).filter(isHoliday).map(date => date.format('YYYY-MM-DD'));
  }
  return getDates(start, end).filter(date => holidays[date.format('YYYY-MM-DD')]).map(date => date.format('YYYY-MM-DD'));
}

/** 获取工作日 */
const getWorkdaysInRange = (start: ConfigType, end: ConfigType, includeWeekends: boolean = true): string[] => {
  start = _validateDate(start) as Dayjs;
  end = _validateDate(end) as Dayjs;
  if (includeWeekends) {
    return getDates(start, end).filter(isWorkday).map(date => date.format('YYYY-MM-DD'));
  }
  return getDates(start, end).filter(date => isWorkday(date) && date.day() >= 1 && date.day() <= 5).map(date => date.format('YYYY-MM-DD'));
}

/* 查找从 date 开始 第 n 个工作日, 0 为当天 */
const findWorkday = (deltaDays: number = 0, date: ConfigType = dayjs()): string => {
  date = wrapDate(date);

  if (deltaDays === 0) {
    if (isWorkday(date)) {
      return date.format('YYYY-MM-DD');
    }
    deltaDays = 1;
  }

  const sign = deltaDays > 0 ? 1 : -1;
  let daysToAdd = Math.abs(deltaDays);

  while (daysToAdd > 0) {
    date = date.add(sign, 'day');
    if (isWorkday(date)) {
      daysToAdd--;
    }
  }

  return date.format('YYYY-MM-DD');
}

export {
  Holiday,
  isHoliday,
  isWorkday,
  isInLieu,
  getDayDetail,
  getHolidaysInRange,
  getWorkdaysInRange,
  findWorkday,
}