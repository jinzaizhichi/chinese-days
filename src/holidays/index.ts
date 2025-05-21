import dayjs, { Dayjs, type ConfigType } from "../utils/dayjs";
import { wrapDate, getDates } from '../utils'
import generate from './generate';

const { holidays, workdays, inLieuDays } = generate()

// Simplified to handle only a single date argument
const _validateDate = (dateInput: ConfigType): Dayjs => {
  // The wrapDate function handles potential Dayjs instances vs other types for dayjs()
  const date = wrapDate(dateInput); 
  if (!date.isValid()) {
    // Note: The error message uses `typeof dateInput` to reflect the original type passed.
    // `typeof date` would be 'object' for the Dayjs instance.
    throw new Error(`unsupported type ${typeof dateInput}, expected type is Date or Dayjs`);
  }
  return date; // Already a Dayjs object from wrapDate
}

/** 是否节假日 */
const isHoliday = (date: ConfigType): boolean => {
  return !isWorkday(date);
}

/** 是否工作日 */
const isWorkday = (date: ConfigType): boolean => {
  const validDate = _validateDate(date); // No longer needs 'as Dayjs' due to simplified _validateDate return type
  const weekday = validDate.day();
  const formattedDate = validDate.format('YYYY-MM-DD');

  return !!(workdays[formattedDate] || (weekday >= 1 && weekday <= 5 && !holidays[formattedDate]));
}

/** 是否调休日 - 是节假日，但后续有需要补班 */
const isInLieu = (date: ConfigType): boolean => {
  const validDate = _validateDate(date); // Use a new variable to avoid reassigning parameter
  return !!inLieuDays[validDate.format('YYYY-MM-DD')];
}

/** 获取工作日详情 */
const getDayDetail = (date: ConfigType): { work: boolean, name: string, date: string } => {
  const validDate = _validateDate(date); // Use a new variable
  const formattedDate = validDate.format('YYYY-MM-DD')
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
    const weekday = validDate.day(); // Use validDate
    return {
      date: formattedDate,
      work: weekday !== 0 && weekday !== 6,
      name: validDate.format('dddd') // Use validDate
    }
  }
}

/** 获取节假日 */
const getHolidaysInRange = (startInput: ConfigType, endInput: ConfigType, includeWeekends: boolean = true): string[] => {
  const start = _validateDate(startInput); // No longer needs 'as Dayjs'
  const end = _validateDate(endInput);     // No longer needs 'as Dayjs'
  if (includeWeekends) {
    return getDates(start, end).filter(isHoliday).map(date => date.format('YYYY-MM-DD'));
  }
  return getDates(start, end).filter(date => holidays[date.format('YYYY-MM-DD')]).map(date => date.format('YYYY-MM-DD'));
}

/** 获取工作日 */
const getWorkdaysInRange = (startInput: ConfigType, endInput: ConfigType, includeWeekends: boolean = true): string[] => {
  const start = _validateDate(startInput); // No longer needs 'as Dayjs'
  const end = _validateDate(endInput);     // No longer needs 'as Dayjs'
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
  isHoliday,
  isWorkday,
  isInLieu,
  getDayDetail,
  getHolidaysInRange,
  getWorkdaysInRange,
  findWorkday,
}