import db from "../db.server";
import { generateCouponCode, toIsoDate } from "../utils/format";
import { createDiscount, deleteDiscount } from "./discount.service";

const VALID_TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING", "BOGO"];
const VALID_APPLIES_TO = ["entire_order", "products", "collections"];
const VALID_ELIGIBILITY = ["all", "tagged", "vip"];
const VALID_STATUSES = ["DRAFT", "SCHEDULED", "ACTIVE", "EXPIRED", "CANCELLED"];

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function validateCampaignInput(input) {
  const errors = {};

  const name = String(input.name ?? "").trim();
  if (!name) errors.name = "Campaign name is required";
  else if (name.length > 100) errors.name = "Campaign name must be 100 characters or fewer";

  const type = String(input.type ?? "").toUpperCase();
  if (!VALID_TYPES.includes(type)) errors.type = "Please choose a campaign type";

  const isFreeShipping = type === "FREE_SHIPPING";
  const value = Number(input.value);
  if (isFreeShipping) {
    // Free shipping has no value field; it always covers shipping in full.
  } else if (input.value === "" || input.value === null || input.value === undefined || Number.isNaN(value)) {
    errors.value = "Discount value is required";
  } else if (value <= 0) {
    errors.value = "Discount value must be positive";
  } else if ((type === "PERCENTAGE" || type === "BOGO") && value > 100) {
    errors.value = "Percentage discount cannot exceed 100%";
  }

  const appliesTo = String(input.appliesTo ?? "entire_order");
  if (!VALID_APPLIES_TO.includes(appliesTo)) {
    errors.appliesTo = "Please choose what the discount applies to";
  }

  const productIds = toArray(input.productIds).filter(Boolean);
  const collectionIds = toArray(input.collectionIds).filter(Boolean);
  if (appliesTo === "products" && productIds.length === 0) {
    errors.productIds = "Select at least one product";
  }
  if (appliesTo === "collections" && collectionIds.length === 0) {
    errors.collectionIds = "Select at least one collection";
  }

  const customerEligibility = String(input.customerEligibility ?? "all");
  if (!VALID_ELIGIBILITY.includes(customerEligibility)) {
    errors.customerEligibility = "Please choose customer eligibility";
  }
  const customerTags = String(input.customerTags ?? "").trim();
  if (customerEligibility === "tagged" && !customerTags) {
    errors.customerTags = "Enter at least one customer tag";
  }

  const startDate = toIsoDate(input.startDate);
  const endDate = toIsoDate(input.endDate);
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    errors.endDate = "End date must be after the start date";
  }

  let usageLimit = null;
  if (input.usageLimit !== "" && input.usageLimit !== null && input.usageLimit !== undefined) {
    usageLimit = Number(input.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit < 0) {
      errors.usageLimit = "Usage limit must be a positive whole number";
    }
  }

  const status = String(input.status ?? "DRAFT").toUpperCase();
  if (!VALID_STATUSES.includes(status)) {
    errors.status = "Invalid status";
  }
  if (status === "SCHEDULED" && !startDate) {
    errors.startDate = "A start date is required for scheduled campaigns";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors };
  }

  return {
    data: {
      name,
      type,
      value: isFreeShipping ? 0 : value,
      appliesTo,
      productIds,
      collectionIds,
      customerEligibility,
      customerTags: customerTags || null,
      startDate,
      endDate,
      usageLimit,
      status,
    },
    errors: null,
  };
}

function loadCampaign(id, shopId) {
  return db.campaign.findFirst({
    where: { id, shopId },
    include: { products: true, collections: true },
  });
}

export async function addLog(campaignId, action, message = "") {
  return db.campaignLog.create({ data: { campaignId, action, message } });
}

async function activateInShopify(campaign, admin) {
  let code = campaign.couponCode;
  if (!code) {
    code = generateCouponCode(campaign.name);
    await db.campaign.update({
      where: { id: campaign.id },
      data: { couponCode: code },
    });
    campaign = { ...campaign, couponCode: code };
  }
  const { discountId, couponCode } = await createDiscount(admin, campaign);
  const updated = await db.campaign.update({
    where: { id: campaign.id },
    data: { status: "ACTIVE", discountId, couponCode },
  });
  await addLog(
    campaign.id,
    "ACTIVATED",
    `Published in Shopify with code ${couponCode}`,
  );
  return updated;
}

async function deactivateInShopify(campaign, admin, status, action, message) {
  if (campaign.discountId) {
    await deleteDiscount(admin, campaign.discountId);
  }
  const updated = await db.campaign.update({
    where: { id: campaign.id },
    data: { status, discountId: null, couponCode: null },
  });
  await addLog(campaign.id, action, message);
  return updated;
}

export async function createCampaign({ shopId, input, admin }) {
  const { data, errors } = validateCampaignInput(input);
  if (errors) return { campaign: null, errors };

  const productIds = data.appliesTo === "products" ? data.productIds : [];
  const collectionIds = data.appliesTo === "collections" ? data.collectionIds : [];

  let campaign = await db.campaign.create({
    data: {
      shopId,
      name: data.name,
      type: data.type,
      value: data.value,
      appliesTo: data.appliesTo,
      customerEligibility: data.customerEligibility,
      customerTags: data.customerTags,
      startDate: data.startDate,
      endDate: data.endDate,
      usageLimit: data.usageLimit,
      status: data.status === "ACTIVE" ? "DRAFT" : data.status,
      couponCode: generateCouponCode(data.name),
      products: {
        create: productIds.map((productId) => ({ productId })),
      },
      collections: {
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: { products: true, collections: true },
  });

  if (data.status === "ACTIVE") {
    try {
      campaign = await activateInShopify(campaign, admin);
    } catch (error) {
      await addLog(campaign.id, "ERROR", `Publishing to Shopify failed: ${error.message}`);
      return { campaign, errors: null, shopifyError: error.message };
    }
  } else {
    await addLog(campaign.id, "CREATED", "Campaign draft created");
  }

  return { campaign, errors: null };
}

export async function updateCampaign({ id, shopId, input, admin }) {
  const { data, errors } = validateCampaignInput(input);
  if (errors) return { campaign: null, errors };

  const existing = await loadCampaign(id, shopId);
  if (!existing) return { campaign: null, errors: { id: "Campaign not found" } };

  const productIds = data.appliesTo === "products" ? data.productIds : [];
  const collectionIds = data.appliesTo === "collections" ? data.collectionIds : [];

  const wasActive = existing.status === "ACTIVE";
  const targetStatus = data.status === "ACTIVE" ? "DRAFT" : data.status;
  let shouldActivate = data.status === "ACTIVE" && !wasActive;

  let campaign = await db.campaign.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      value: data.value,
      appliesTo: data.appliesTo,
      customerEligibility: data.customerEligibility,
      customerTags: data.customerTags,
      startDate: data.startDate,
      endDate: data.endDate,
      usageLimit: data.usageLimit,
      status: shouldActivate ? "DRAFT" : targetStatus,
      products: { deleteMany: {}, create: productIds.map((productId) => ({ productId })) },
      collections: { deleteMany: {}, create: collectionIds.map((collectionId) => ({ collectionId })) },
    },
    include: { products: true, collections: true },
  });

  // Leaving the ACTIVE state removes the Shopify discount.
  if (wasActive && data.status !== "ACTIVE") {
    campaign = await deactivateInShopify(
      campaign,
      admin,
      targetStatus,
      targetStatus === "SCHEDULED" ? "SCHEDULED" : "UPDATED",
      targetStatus === "SCHEDULED" ? "Campaign scheduled" : "Discount removed from Shopify",
    );
  } else if (shouldActivate) {
    try {
      campaign = await activateInShopify(campaign, admin);
    } catch (error) {
      await addLog(campaign.id, "ERROR", `Publishing to Shopify failed: ${error.message}`);
      return { campaign, errors: null, shopifyError: error.message };
    }
  } else if (wasActive) {
    // Active campaign edited while staying active: recreate the discount with new settings.
    try {
      await deleteDiscount(admin, existing.discountId);
      campaign = await activateInShopify(campaign, admin);
      await addLog(campaign.id, "UPDATED", "Campaign settings updated");
    } catch (error) {
      await addLog(campaign.id, "ERROR", `Updating the Shopify discount failed: ${error.message}`);
      return { campaign, errors: null, shopifyError: error.message };
    }
  } else {
    await addLog(campaign.id, "UPDATED", "Campaign settings updated");
  }

  return { campaign, errors: null };
}

export async function deleteCampaign({ id, shopId, admin }) {
  const campaign = await loadCampaign(id, shopId);
  if (!campaign) return { success: false, error: "Campaign not found" };

  if (campaign.status === "ACTIVE" && campaign.discountId) {
    await deleteDiscount(admin, campaign.discountId);
  }

  await db.campaign.delete({ where: { id } });
  return { success: true };
}

export async function activateCampaign({ id, shopId, admin }) {
  let campaign = await loadCampaign(id, shopId);
  if (!campaign) return { campaign: null, shopifyError: "Campaign not found" };

  if (campaign.status === "ACTIVE") {
    return { campaign, shopifyError: null };
  }

  if (campaign.status === "EXPIRED" || campaign.status === "CANCELLED") {
    campaign = await db.campaign.update({
      where: { id },
      data: { status: "DRAFT" },
      include: { products: true, collections: true },
    });
  }

  try {
    campaign = await activateInShopify(campaign, admin);
  } catch (error) {
    return { campaign, shopifyError: error.message };
  }
  return { campaign, shopifyError: null };
}

export async function cancelCampaign({ id, shopId, admin }) {
  const campaign = await loadCampaign(id, shopId);
  if (!campaign) return { campaign: null, shopifyError: "Campaign not found" };

  if (campaign.status === "ACTIVE" && campaign.discountId) {
    await deleteDiscount(admin, campaign.discountId);
  }
  const updated = await db.campaign.update({
    where: { id },
    data: { status: "CANCELLED", discountId: null, couponCode: null },
  });
  await addLog(campaign.id, "CANCELLED", "Campaign cancelled");
  return { campaign: updated, shopifyError: null };
}

export async function expireCampaign({ id, shopId, admin }) {
  const campaign = await loadCampaign(id, shopId);
  if (!campaign) return;

  if (campaign.status === "ACTIVE" && campaign.discountId) {
    await deleteDiscount(admin, campaign.discountId);
  }
  const updated = await db.campaign.update({
    where: { id },
    data: { status: "EXPIRED", discountId: null, couponCode: null },
  });
  await addLog(campaign.id, "EXPIRED", "Campaign reached its end date");
  return updated;
}

export async function listCampaigns(shopId) {
  return db.campaign.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    include: {
      products: true,
      collections: true,
      _count: { select: { orders: true, logs: true } },
    },
  });
}

export async function getCampaign(id, shopId) {
  return db.campaign.findFirst({
    where: { id, shopId },
    include: {
      products: true,
      collections: true,
      logs: { orderBy: { createdAt: "desc" }, take: 50 },
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}
