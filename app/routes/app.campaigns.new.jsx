import { useState } from "react";
import {
  useLoaderData,
  useFetcher,
  redirect,
  useOutletContext,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import PropTypes from "prop-types";
import { authenticate } from "../shopify.server";
import {
  createCampaign,
  activateCampaign,
} from "../services/campaign.service";
import { getOrCreateShop } from "../services/shop.service";
import CampaignForm from "../components/CampaignForm";
import DCMButton from "../components/DCMButton";
import StatusBadge from "../components/StatusBadge";
import Icon from "../components/Icon";
import { CAMPAIGN_TYPES } from "../utils/constants";
import { formatDate, formatCurrency, formatNumber } from "../utils/format";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  return { shop };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  if (intent === "create") {
    const result = await createCampaign({
      shopId: shop.id,
      admin,
      input: {
        name: formData.get("name"),
        type: formData.get("type"),
        value: formData.get("value"),
        appliesTo: formData.get("appliesTo"),
        productIds: formData.getAll("productIds"),
        collectionIds: formData.getAll("collectionIds"),
        customerEligibility: formData.get("customerEligibility"),
        customerTags: formData.get("customerTags"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        usageLimit: formData.get("usageLimit"),
        status: "DRAFT",
      },
    });

    if (result.errors) {
      return { errors: result.errors, shopifyError: null };
    }
    if (result.shopifyError) {
      return { errors: null, shopifyError: result.shopifyError };
    }
    return { campaign: result.campaign };
  }

  if (intent === "activate" && id) {
    const result = await activateCampaign({ id, shopId: shop.id, admin });
    if (result.shopifyError) {
      return { errors: null, shopifyError: result.shopifyError, campaign: null };
    }
    return redirect(`/app/campaigns/${result.campaign.id}`);
  }

  if (intent === "save-draft" && id) {
    return redirect(`/app/campaigns/${id}`);
  }

  return { errors: null, shopifyError: "Unknown action" };
};

function submitReview(fetcher, intent, id) {
  const formData = new FormData();
  formData.set("intent", intent);
  formData.set("id", id);
  fetcher.submit(formData, { method: "post" });
}

function ReviewDraft({ campaign, currency, fetcher }) {
  const isPublishing = fetcher.state !== "idle";

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <h1 className="dcm-title dcm-title--gradient">Review your campaign</h1>
          <p className="dcm-subtitle">Confirm before publishing to Shopify</p>
        </div>
        <StatusBadge status="DRAFT" />
      </div>

      {fetcher.data?.shopifyError && (
        <div className="dcm-banner-zone">
          <p className="dcm-meta" style={{ color: "var(--dcm-critical)" }}>
            Shopify could not be updated: {fetcher.data.shopifyError}
          </p>
        </div>
      )}

      <div className="dcm-grid dcm-grid--2 dcm-stagger" style={{ alignItems: "start" }}>
        <div className="dcm-stack">
          <div className="dcm-card dcm-card--hover">
            <div className="dcm-card-head">
              <h3 className="dcm-card-title">
                <span className="dcm-card-chip">
                  <Icon name="sparkles" />
                </span>
                Draft created
              </h3>
            </div>
            <p className="dcm-note" style={{ fontSize: 14, color: "var(--dcm-text-2)" }}>
              A discount code has been generated. Publish it to Shopify so
              customers can redeem it at checkout, or keep it as a draft.
            </p>
          </div>

          <div className="dcm-card">
            <div className="dcm-card-head">
              <h3 className="dcm-card-title">
                <span className="dcm-card-chip">
                  <Icon name="tag" />
                </span>
                Discount code
              </h3>
            </div>
            <div className="dcm-code" style={{ fontSize: 18, padding: "12px 14px 12px 20px" }}>
              {campaign.couponCode}
            </div>
            <p className="dcm-note" style={{ marginTop: 12 }}>
              Share this code with your customers. It becomes redeemable as soon
              as the campaign is published.
            </p>
          </div>

          <div className="dcm-card">
            <div className="dcm-card-head">
              <h3 className="dcm-card-title">
                <span className="dcm-card-chip">
                  <Icon name="chart" />
                </span>
                Draft summary
              </h3>
            </div>
            <div className="dcm-stack" style={{ gap: 10 }}>
              <div className="dcm-inline">
                <span className="dcm-chip active">
                  {CAMPAIGN_TYPES[campaign.type]?.label ?? campaign.type}
                </span>
                <span className="dcm-chip">{formatValue(campaign, currency)}</span>
                <span className="dcm-chip">{formatAppliesTo(campaign)}</span>
                <span className="dcm-chip">{formatEligibility(campaign)}</span>
              </div>
              <hr className="dcm-divider" />
              <p className="dcm-note">
                Starts {formatDate(campaign.startDate, { withTime: true })} — Ends{" "}
                {formatDate(campaign.endDate, { withTime: true })}
              </p>
              <p className="dcm-note">
                Usage limit:{" "}
                {campaign.usageLimit ? formatNumber(campaign.usageLimit) : "Unlimited"}
              </p>
            </div>
          </div>
        </div>

        <div className="dcm-card" style={{ alignSelf: "start" }}>
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="zap" />
              </span>
              Ready to go live?
            </h3>
          </div>
          <p className="dcm-note" style={{ color: "var(--dcm-text-2)", marginBottom: 18 }}>
            Publishing creates a real discount in your Shopify admin that
            customers can redeem at checkout.
          </p>
          <div className="dcm-actions">
            <DCMButton
              variant="primary"
              size="lg"
              icon="play"
              onClick={() => submitReview(fetcher, "activate", campaign.id)}
              loading={isPublishing}
            >
              Publish to Shopify
            </DCMButton>
            <DCMButton
              variant="secondary"
              size="lg"
              onClick={() => submitReview(fetcher, "save-draft", campaign.id)}
            >
              Save as draft
            </DCMButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatValue(campaign, currency) {
  if (campaign.type === "PERCENTAGE" || campaign.type === "BOGO") {
    return `${campaign.value}%`;
  }
  if (campaign.type === "FIXED_AMOUNT") {
    return formatCurrency(campaign.value, currency);
  }
  return "Free shipping";
}

function formatAppliesTo(campaign) {
  if (campaign.appliesTo === "products") {
    return `${campaign.products.length} product${campaign.products.length === 1 ? "" : "s"}`;
  }
  if (campaign.appliesTo === "collections") {
    return `${campaign.collections.length} collection${campaign.collections.length === 1 ? "" : "s"}`;
  }
  return "Entire order";
}

function formatEligibility(campaign) {
  if (campaign.customerEligibility === "tagged") {
    return `Customers tagged ${campaign.customerTags}`;
  }
  if (campaign.customerEligibility === "vip") {
    return "VIP customers";
  }
  return "All customers";
}

ReviewDraft.propTypes = {
  campaign: PropTypes.object.isRequired,
  currency: PropTypes.string,
  fetcher: PropTypes.object.isRequired,
};

export default function NewCampaign() {
  const { shop } = useLoaderData();
  const { shop: layoutShop } = useOutletContext();
  const currency = shop?.currency ?? layoutShop?.currency ?? "USD";
  const [draft, setDraft] = useState(null);
  const fetcher = useFetcher();

  if (draft) {
    return <ReviewDraft campaign={draft} currency={currency} fetcher={fetcher} />;
  }

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <h1 className="dcm-title dcm-title--gradient">New campaign</h1>
          <p className="dcm-subtitle">
            Set up a discount, target products and customers, then schedule it.
          </p>
        </div>
      </div>
      <div className="dcm-card">
        <CampaignForm currency={currency} onSuccess={setDraft} />
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
