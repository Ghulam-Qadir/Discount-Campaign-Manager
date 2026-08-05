export const CAMPAIGN_TYPES = {
  PERCENTAGE: { label: "Percentage discount", unit: "%" },
  FIXED_AMOUNT: { label: "Fixed amount discount", unit: "currency" },
  FREE_SHIPPING: { label: "Free shipping", unit: "" },
  BOGO: { label: "Buy X Get Y", unit: "%" },
};

export const CAMPAIGN_STATUS = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SCHEDULED: { label: "Scheduled", tone: "caution" },
  ACTIVE: { label: "Active", tone: "success" },
  EXPIRED: { label: "Expired", tone: "critical" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const APPLIES_TO_OPTIONS = [
  { value: "entire_order", label: "Entire order" },
  { value: "products", label: "Specific products" },
  { value: "collections", label: "Collections" },
];

export const ELIGIBILITY_OPTIONS = [
  { value: "all", label: "All customers" },
  { value: "tagged", label: "Customers tagged with" },
  { value: "vip", label: "VIP customers (tag: VIP)" },
];

export const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export const CURRENCIES = [
  "USD",
  "CAD",
  "GBP",
  "EUR",
  "AUD",
  "NZD",
  "INR",
  "PKR",
  "AED",
  "SGD",
  "JPY",
];
