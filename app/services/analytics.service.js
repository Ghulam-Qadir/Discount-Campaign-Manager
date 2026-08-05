import db from "../db.server";
import { getOrCreateShop } from "./shop.service";

export async function getDashboardStats(domain) {
  const shop = await getOrCreateShop(domain);

  const [campaigns, orderAgg] = await Promise.all([
    db.campaign.findMany({
      where: { shopId: shop.id },
      include: {
        products: true,
        collections: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.campaignOrder.aggregate({
      where: { campaign: { shopId: shop.id } },
      _sum: { totalPrice: true },
      _count: true,
    }),
  ]);

  const byStatus = {
    DRAFT: 0,
    SCHEDULED: 0,
    ACTIVE: 0,
    EXPIRED: 0,
    CANCELLED: 0,
  };
  for (const campaign of campaigns) {
    if (byStatus[campaign.status] !== undefined) {
      byStatus[campaign.status] += 1;
    }
  }

  const totalUses = campaigns.reduce((sum, c) => sum + c.totalUses, 0);
  const revenue = orderAgg._sum.totalPrice ?? 0;
  const orderCount = orderAgg._count ?? 0;
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  const topCampaign = campaigns.reduce(
    (top, c) => (!top || c.totalUses > top.totalUses ? c : top),
    null,
  );

  return {
    shop,
    campaigns,
    stats: {
      byStatus,
      totalCampaigns: campaigns.length,
      active: byStatus.ACTIVE,
      scheduled: byStatus.SCHEDULED,
      revenue,
      totalUses,
      orderCount,
      averageOrderValue,
      topCampaign,
    },
  };
}
