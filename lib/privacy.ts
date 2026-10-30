// Privacy mode: blurs appointment details on the dashboard (and hides items
// not due soon), for a screen other people can see. Kept in a cookie (per
// browser, not per account) so a shared second screen can stay private while
// your phone doesn't, and so the server renders it hidden from the first
// paint rather than flashing the details before the page loads.
export const PRIVACY_COOKIE = "duenext_privacy";
