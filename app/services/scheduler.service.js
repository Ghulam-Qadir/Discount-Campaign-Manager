import db from "../db.server";
import { activateCampaign, expireCampaign } from "./campaign.service";

export async function processCampaigns({ shopId, admin }) {
  const now = new Date();

  const scheduled = await db.campaign.findMany({
    where: { shopId, status: "SCHEDULED", startDate: { lte: now } },
  });

  const toActivate = [];
  const toExpire = [];

  for (const campaign of scheduled) {
    toActivate.push(campaign.id);
  }

  const active = await db.campaign.findMany({
    where: { shopId, status: "ACTIVE" },
  });

  for (const campaign of active) {
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      toExpire.push(campaign.id);
    }
  }

  for (const id of toActivate) {
    try {
      await activateCampaign({ id, shopId, admin });
    } catch (error) {
      console.error(`Failed to activate campaign ${id}:`, error.message);
    }
  }

  for (const id of toExpire) {
    try {
      await expireCampaign({ id, shopId, admin });
    } catch (error) {
      console.error(`Failed to expire campaign ${id}:`, error.message);
    }
  }

  return {
    activated: toActivate.length,
    expired: toExpire.length,
  };
}
