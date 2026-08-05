import db from "../db.server";

export async function getOrCreateShop(domain) {
  const existing = await db.shop.findUnique({ where: { domain } });
  if (existing) return existing;
  return db.shop.create({ data: { domain } });
}

export async function getShopByDomain(domain) {
  return db.shop.findUnique({ where: { domain } });
}

export async function updateShopSettings(domain, data) {
  const shop = await getOrCreateShop(domain);
  return db.shop.update({
    where: { id: shop.id },
    data: {
      timezone: data.timezone || undefined,
      currency: data.currency || undefined,
      emailNotifications: data.emailNotifications,
    },
  });
}
