import { authenticate } from "../shopify.server";
import { recordOrderUsage } from "../services/usage.service";

export const action = async ({ request }) => {
  const { payload, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    await recordOrderUsage(shop, payload);
  } catch (error) {
    console.error(`Failed to record order usage for ${shop}:`, error.message);
  }

  return new Response();
};
