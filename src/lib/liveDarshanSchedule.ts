export interface DarshanScheduleSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  label?: string | null;
}

export interface DarshanWindowStatus {
  currentSlot: DarshanScheduleSlot | null;
  nextSlot: DarshanScheduleSlot | null;
  isInSchedule: boolean;
  currentTime: string;
  dayOfWeek: number;
}

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatScheduleTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  const hour = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const getDarshanWindowStatus = (
  now: Date,
  slots: DarshanScheduleSlot[]
): DarshanWindowStatus => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const dayOfWeek = ist.getUTCDay();
  const hours = ist.getUTCHours().toString().padStart(2, "0");
  const minutes = ist.getUTCMinutes().toString().padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;
  const currentMinutes = toMinutes(currentTime);

  const activeSlots = slots.filter((slot) => slot.is_active && slot.day_of_week === dayOfWeek);
  const currentSlot = activeSlots.find((slot) => {
    const start = toMinutes(slot.start_time);
    const end = toMinutes(slot.end_time);
    return currentMinutes >= start && currentMinutes < end;
  }) ?? null;

  const nextSlot = activeSlots
    .filter((slot) => toMinutes(slot.start_time) > currentMinutes)
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))[0] ?? null;

  return {
    currentSlot,
    nextSlot,
    isInSchedule: Boolean(currentSlot),
    currentTime,
    dayOfWeek,
  };
};
