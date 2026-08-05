import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Clean up shop-scoped data (campaigns, logs and orders cascade via FK).
  const shopRecord = await db.shop.findUnique({ where: { domain: shop } });
  if (shopRecord) {
    await db.shop.delete({ where: { id: shopRecord.id } });
  }

  return new Response();
};
