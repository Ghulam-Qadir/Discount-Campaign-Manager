const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

export function formatDate(value, { withTime = false } = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return withTime ? dateFormatter.format(date) : dateOnlyFormatter.format(date);
}

export function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `$${Number(value).toFixed(2)}`;
  }
}

export function formatNumber(value) {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en").format(Number(value));
}

export function formatPercent(value) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function couponCodeSlug(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);
}

export function generateCouponCode(name = "") {
  const slug = couponCodeSlug(name);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const base = slug || "DCM";
  return `${base}-${random}`.toUpperCase();
}

export function previewCouponCode(name = "") {
  const slug = couponCodeSlug(name);
  const base = slug || "DCM";
  return `${base}-XXXX`.toUpperCase();
}

export function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
