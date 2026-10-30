// Colour theme: light, dark, or auto (dark between sunset and sunrise).
// Kept in a cookie per browser, like privacy mode, so a shared second screen
// and a phone can differ - and so the server renders the right theme on the
// first paint instead of flashing light before switching. Shared by the
// root layout (server) and ThemeController (client), so no server imports.

export const THEME_COOKIE = "duenext_theme";

export type ThemePreference = "light" | "dark" | "auto";

export function parseThemePreference(value: string | undefined): ThemePreference {
  return value === "dark" || value === "auto" ? value : "light";
}

/** Where the sun is computed for, in degrees. */
export interface SunLocation {
  latitude: number;
  longitude: number;
}

// Representative city per time zone. Auto mode uses the app's
// REMINDER_TIMEZONE, which is a good enough stand-in for the user's location
// (sunset is off by a few minutes across a zone) and needs no permission prompt.
const TIMEZONE_LOCATIONS: Record<string, SunLocation> = {
  "Asia/Tokyo": { latitude: 35.68, longitude: 139.77 },
  "Asia/Seoul": { latitude: 37.57, longitude: 126.98 },
  "Asia/Shanghai": { latitude: 31.23, longitude: 121.47 },
  "Asia/Hong_Kong": { latitude: 22.32, longitude: 114.17 },
  "Asia/Taipei": { latitude: 25.03, longitude: 121.57 },
  "Asia/Manila": { latitude: 14.6, longitude: 120.98 },
  "Asia/Singapore": { latitude: 1.35, longitude: 103.82 },
  "Asia/Bangkok": { latitude: 13.76, longitude: 100.5 },
  "Asia/Jakarta": { latitude: -6.2, longitude: 106.85 },
  "Asia/Kolkata": { latitude: 19.08, longitude: 72.88 },
  "Asia/Dubai": { latitude: 25.2, longitude: 55.27 },
  "Australia/Sydney": { latitude: -33.87, longitude: 151.21 },
  "Europe/London": { latitude: 51.51, longitude: -0.13 },
  "Europe/Paris": { latitude: 48.86, longitude: 2.35 },
  "Europe/Berlin": { latitude: 52.52, longitude: 13.4 },
  "America/New_York": { latitude: 40.71, longitude: -74.01 },
  "America/Chicago": { latitude: 41.88, longitude: -87.63 },
  "America/Denver": { latitude: 39.74, longitude: -104.99 },
  "America/Los_Angeles": { latitude: 34.05, longitude: -118.24 },
  "UTC": { latitude: 51.48, longitude: 0 },
};

export function sunLocationForTimeZone(timeZone: string): SunLocation {
  return TIMEZONE_LOCATIONS[timeZone] ?? TIMEZONE_LOCATIONS["Asia/Tokyo"];
}

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;
const SUNRISE_ALTITUDE = RAD * -0.833; // upper limb at the horizon, with refraction

/**
 * Sunrise and sunset for the solar day around `date` (the standard
 * low-precision solar position formulas - accurate to a minute or two).
 * In polar day/night both are null and `alwaysUp` says which.
 */
export function sunTimes(
  date: Date,
  { latitude, longitude }: SunLocation
): { sunrise: Date | null; sunset: Date | null; alwaysUp: boolean } {
  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const days = date.getTime() / DAY_MS - 0.5 + J1970 - J2000;

  const cycle = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const transit = 0.0009 + lw / (2 * Math.PI) + cycle;

  const meanAnomaly = RAD * (357.5291 + 0.98560028 * transit);
  const center =
    RAD * (1.9148 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly));
  const eclipticLongitude = meanAnomaly + center + RAD * 102.9372 + Math.PI;
  const declination = Math.asin(Math.sin(OBLIQUITY) * Math.sin(eclipticLongitude));

  const solarCorrection = (j: number) =>
    J2000 + j + 0.0053 * Math.sin(meanAnomaly) - 0.0069 * Math.sin(2 * eclipticLongitude);
  const noon = solarCorrection(transit);

  const cosHourAngle =
    (Math.sin(SUNRISE_ALTITUDE) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination));
  if (cosHourAngle < -1) return { sunrise: null, sunset: null, alwaysUp: true };
  if (cosHourAngle > 1) return { sunrise: null, sunset: null, alwaysUp: false };

  const set = solarCorrection(0.0009 + (Math.acos(cosHourAngle) + lw) / (2 * Math.PI) + cycle);
  const rise = noon - (set - noon);
  const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY_MS);
  return { sunrise: fromJulian(rise), sunset: fromJulian(set), alwaysUp: false };
}

/** Whether the sun is down at `now` (auto mode goes dark then). */
export function isAfterSunset(now: Date, location: SunLocation): boolean {
  const { sunrise, sunset, alwaysUp } = sunTimes(now, location);
  if (!sunrise || !sunset) return !alwaysUp;
  return now < sunrise || now >= sunset;
}

export function resolveDark(preference: ThemePreference, now: Date, location: SunLocation): boolean {
  if (preference === "auto") return isAfterSunset(now, location);
  return preference === "dark";
}
