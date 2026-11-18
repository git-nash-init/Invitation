/** Rupees with two decimals from paise. */
export const inr = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Whole rupees, for prices. */
export const inrWhole = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

/** "18 Nov, 3:42 pm" in India time, from unix seconds. */
export const istTime = (unix: number) =>
  unix
    ? new Date(unix * 1000).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
    : "";

export const ago = (unix: number, nowUnix: number) => {
  const s = Math.max(0, nowUnix - unix);
  if (s < 90) return `${s}s ago`;
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};
