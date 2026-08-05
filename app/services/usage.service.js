import db from "../db.server";
import { getOrCreateShop } from "./shop.service";

function orderCodes(order) {
  const codes = [];
  if (Array.isArray(order.discount_codes)) {
    for (const dc of order.discount_codes) {
      if (dc.code) codes.push(dc.code);
    }
  }
  if (Array.isArray(order.discount_applications)) {
    for (const app of order.discount_applications) {
      if (app.code) codes.push(app.code);
    }
  }
  return codes;
}

export async function recordOrderUsage(shopDomain, order) {
  const shop = await getOrCreateShop(shopDomain);
  const codes = orderCodes(order);
  if (codes.length === 0) return { matched: 0 };

  const campaigns = await db.campaign.findMany({
    where: {
      shopId: shop.id,
      status: { in: ["ACTIVE", "EXPIRED"] },
      couponCode: { in: codes },
    },
  });

  let matched = 0;
  for (const campaign of campaigns) {
    const orderId = String(order.id);
    const existing = await db.campaignOrder.findUnique({
      where: {
        campaignId_orderId: { campaignId: campaign.id, orderId },
      },
    });

    if (!existing) {
      await db.campaignOrder.create({
        data: {
          campaignId: campaign.id,
          orderId,
          totalPrice: Number(order.total_price ?? order.subtotal_price ?? 0),
        },
      });
      await db.campaign.update({
        where: { id: campaign.id },
        data: { totalUses: { increment: 1 } },
      });
      await db.campaignLog.create({
        data: {
          campaignId: campaign.id,
          action: "USED",
          message: `Order #${order.order_number ?? order.name ?? orderId} used the discount code`,
        },
      });
    }
    matched += 1;
  }

  return { matched };
}
