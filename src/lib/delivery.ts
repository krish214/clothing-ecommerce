export const isValidPincode = (v: string) => /^[1-9]\d{5}$/.test(v);
export const isValidIndianMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

/**
 * Rough delivery estimate from the warehouse in Chennai, counted in working days (Sundays skipped).
 * Replace with Shiprocket's serviceability API once you want courier-accurate dates.
 */
export function estimateDelivery(pincode: string, from = new Date()) {
  const d = pincode[0];
  const days = pincode.startsWith("600") ? 2 : d === "6" ? 3 : d === "5" ? 4 : ["7", "8", "9"].includes(d) ? 6 : 5;
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) added++;
  }
  return {
    days,
    date,
    label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
  };
}

/** First three digits → city and state, used to pre-fill checkout. */
export const PINCODE_PREFIX: Record<string, [string, string]> = {
  "600": ["Chennai", "Tamil Nadu"],
  "641": ["Coimbatore", "Tamil Nadu"],
  "625": ["Madurai", "Tamil Nadu"],
  "620": ["Tiruchirappalli", "Tamil Nadu"],
  "560": ["Bengaluru", "Karnataka"],
  "500": ["Hyderabad", "Telangana"],
  "682": ["Kochi", "Kerala"],
  "695": ["Thiruvananthapuram", "Kerala"],
  "400": ["Mumbai", "Maharashtra"],
  "411": ["Pune", "Maharashtra"],
  "110": ["New Delhi", "Delhi"],
  "700": ["Kolkata", "West Bengal"],
  "380": ["Ahmedabad", "Gujarat"],
  "302": ["Jaipur", "Rajasthan"],
  "605": ["Puducherry", "Puducherry"],
};

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];
