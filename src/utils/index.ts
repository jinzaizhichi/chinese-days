import dayjs, { type Dayjs, type ConfigType } from '../utils/dayjs';

// wrapDate 将日期规范化为当天的开始
export const wrapDate = (date: ConfigType): Dayjs => {
  return dayjs(date).startOf('day');
};

export const getDates = (start: ConfigType, end: ConfigType): Dayjs[] => {
  start = wrapDate(start);
  end = wrapDate(end);
  const deltaDays = end.diff(start, 'day');
  return Array.from({ length: deltaDays + 1 }, (_, i) => start.add(i, 'day'));
};
