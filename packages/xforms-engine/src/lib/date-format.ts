import { Temporal } from "temporal-polyfill";

/**
 * @returns The current datetime including local timezone, eg: "2025-11-25T15:00:34.89-07:00"
 */
export const now = () => {
  const timeZone = Temporal.Now.timeZoneId();
  return Temporal.Now.instant().toString({ timeZone });
};

/**
 * @returns The current date, eg: "2025-11-25"
 */
export const today = () => {
  return Temporal.Now.plainDateISO().toString();
};
