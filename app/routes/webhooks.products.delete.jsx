import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { payload, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const productId = payload?.id ?? payload?.legacyResourceId;
  if (!productId) {
    return new Response();
  }

  const gid = `gid://shopify/Product/${productId}`;
  await db.campaignProduct.deleteMany({ where: { productId: gid } });

  return new Response();
};
