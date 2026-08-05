import {
  useLoaderData,
  redirect,
  useOutletContext,
  useFetcher,
  Link,
} from "react-router";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import PropTypes from "prop-types";
import { authenticate } from "../shopify.server";
import {
  getCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  cancelCampaign,
} from "../services/campaign.service";
import { getOrCreateShop } from "../services/shop.service";
import CampaignForm from "../components/CampaignForm";
import StatusBadge from "../components/StatusBadge";
import DCMButton from "../components/DCMButton";
import Icon from "../components/Icon";
import { CAMPAIGN_TYPES } from "../utils/constants";
import {
  formatDate,
  formatCurrency,
  formatNumber,
} from "../utils/format";

const RESOURCE_TITLES = `#graphql
  query ResourceTitles($ids: [ID!]!) {
    nodes(ids: $ids) {
      __typename
      ... on Product {
        id
        title
      }
      ... on Collection {
        id
        title
      }
    }
  }`;

export const loader = async ({ request, params }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const campaign = await getCampaign(params.id, shop.id);

  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }

  const productIds = campaign.products.map((p) => p.productId);
  const collectionIds = campaign.collections.map((c) => c.collectionId);
  const ids = [...productIds, ...collectionIds];

  const titles = {};
  if (ids.length > 0) {
    const response = await admin.graphql(RESOURCE_TITLES, { variables: { ids } });
    const json = await response.json();
    for (const node of json.data?.nodes ?? []) {
      if (node?.id && node?.title) titles[node.id] = node.title;
    }
  }

  const revenue = campaign.orders.reduce((sum, order) => sum + order.totalPrice, 0);

  return { campaign, titles, revenue, shop };
};

export const action = async ({ request, params }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await deleteCampaign({ id: params.id, shopId: shop.id, admin });
    return redirect("/app/campaigns");
  }

  if (intent === "activate") {
    const result = await activateCampaign({
      id: params.id,
      shopId: shop.id,
      admin,
    });
    if (result.shopifyError) {
      return { errors: null, shopifyError: result.shopifyError };
    }
    return { success: "Campaign published to Shopify" };
  }

  if (intent === "cancel") {
    const result = await cancelCampaign({ id: params.id, shopId: shop.id, admin });
    if (result.shopifyError) {
      return { errors: null, shopifyError: result.shopifyError };
    }
    return { success: "Campaign cancelled" };
  }

  if (intent === "save") {
    const result = await updateCampaign({
      id: params.id,
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
        status: formData.get("status"),
      },
    });

    if (result.errors) {
      return { errors: result.errors, shopifyError: null };
    }
    if (result.shopifyError) {
      return { errors: null, shopifyError: result.shopifyError };
    }
    return { success: "Campaign updated" };
  }

  return { errors: null, shopifyError: "Unknown action" };
};

function ActionButton({ fetcher, intent, children, ...rest }) {
  return (
    <DCMButton
      onClick={() => {
        const formData = new FormData();
        formData.set("intent", intent);
        fetcher.submit(formData, { method: "post" });
      }}
      loading={fetcher.state !== "idle"}
      {...rest}
    >
      {children}
    </DCMButton>
  );
}

ActionButton.propTypes = {
  fetcher: PropTypes.object.isRequired,
  intent: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function CodeSection({ campaign }) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

  if (!campaign.couponCode) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(campaign.couponCode);
      setCopied(true);
      shopify.toast.show("Discount code copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      shopify.toast.show("Could not copy code", { isError: true });
    }
  };

  return (
    <div className="dcm-card">
      <div className="dcm-card-head">
        <h3 className="dcm-card-title">
          <span className="dcm-card-chip">
            <Icon name="tag" />
          </span>
          Discount code
        </h3>
      </div>
      {campaign.status === "ACTIVE" && (
        <div className="dcm-inline" style={{ marginBottom: 14 }}>
          <span className="dcm-live-dot" />
          <span className="dcm-trend-up">Live at checkout</span>
          <span className="dcm-note">Customers can redeem this code now.</span>
        </div>
      )}
      {campaign.status === "DRAFT" && (
        <p className="dcm-note" style={{ marginBottom: 14 }}>
          <Icon name="clock" size={13} /> Not live yet — this code becomes
          redeemable when the campaign is published to Shopify.
        </p>
      )}
      {campaign.status === "SCHEDULED" && (
        <p className="dcm-note" style={{ marginBottom: 14 }}>
          <Icon name="calendar" size={13} /> Activating on start date — this code
          becomes redeemable automatically.
        </p>
      )}
      <div className="dcm-code" style={{ fontSize: 16, padding: "10px 12px 10px 18px" }}>
        {campaign.couponCode}
        <button
          type="button"
          className="dcm-code-btn"
          style={{ width: 30, height: 30 }}
          onClick={copy}
          aria-label="Copy code"
        >
          <Icon name={copied ? "check" : "copy"} />
        </button>
      </div>
    </div>
  );
}

CodeSection.propTypes = {
  campaign: PropTypes.object.isRequired,
};

function SummaryRow({ label, children }) {
  return (
    <div className="dcm-inline" style={{ justifyContent: "space-between" }}>
      <span className="dcm-meta">{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

SummaryRow.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
};

export default function CampaignDetail() {
  const { campaign, titles, revenue, shop } = useLoaderData();
  const fetcher = useFetcher();
  const { shop: layoutShop } = useOutletContext();
  const currency = shop?.currency ?? layoutShop?.currency ?? "USD";

  const canActivate = ["DRAFT", "SCHEDULED", "EXPIRED", "CANCELLED"].includes(
    campaign.status,
  );
  const canCancel = ["ACTIVE", "SCHEDULED"].includes(campaign.status);

  const productNames = campaign.products
    .map((p) => titles[p.productId] ?? p.productId)
    .join(", ");
  const collectionNames = campaign.collections
    .map((c) => titles[c.collectionId] ?? c.collectionId)
    .join(", ");

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <div className="dcm-inline" style={{ marginBottom: 8 }}>
            <Link to="/app/campaigns" className="dcm-meta">
              ← Campaigns
            </Link>
          </div>
          <h1 className="dcm-title dcm-title--gradient">{campaign.name}</h1>
          <p className="dcm-subtitle">
            <StatusBadge status={campaign.status} /> · Created{" "}
            {formatDate(campaign.createdAt, { withTime: true })}
          </p>
        </div>
        <div className="dcm-head-actions">
          {canActivate && (
            <ActionButton fetcher={fetcher} intent="activate" variant="primary" icon="play">
              Activate now
            </ActionButton>
          )}
          {canCancel && (
            <ActionButton fetcher={fetcher} intent="cancel" variant="secondary" icon="pause">
              Cancel campaign
            </ActionButton>
          )}
        </div>
      </div>

      {(fetcher.data?.shopifyError || fetcher.data?.success) && (
        <div className="dcm-banner-zone">
          {fetcher.data?.success && (
            <div className="dcm-inline">
              <span className="dcm-live-dot" />
              <span className="dcm-trend-up">{fetcher.data.success}</span>
            </div>
          )}
          {fetcher.data?.shopifyError && (
            <p className="dcm-meta" style={{ color: "var(--dcm-critical)" }}>
              {fetcher.data.shopifyError}
            </p>
          )}
        </div>
      )}

      <div className="dcm-grid dcm-grid--2 dcm-stagger" style={{ alignItems: "start" }}>
        <div className="dcm-stack">
          <div className="dcm-card">
            <div className="dcm-card-head">
              <h3 className="dcm-card-title">
                <span className="dcm-card-chip">
                  <Icon name="chart" />
                </span>
                Summary
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
              <SummaryRow label="Starts">
                {formatDate(campaign.startDate, { withTime: true })}
              </SummaryRow>
              <SummaryRow label="Ends">
                {formatDate(campaign.endDate, { withTime: true })}
              </SummaryRow>
              <SummaryRow label="Usage limit">
                {campaign.usageLimit ? formatNumber(campaign.usageLimit) : "Unlimited"}
              </SummaryRow>
              {campaign.products.length > 0 && (
                <SummaryRow label={`Products (${campaign.products.length})`}>
                  {truncate(productNames)}
                </SummaryRow>
              )}
              {campaign.collections.length > 0 && (
                <SummaryRow label={`Collections (${campaign.collections.length})`}>
                  {truncate(collectionNames)}
                </SummaryRow>
              )}
            </div>
          </div>

          <CodeSection campaign={campaign} />

          <div className="dcm-card">
            <div className="dcm-card-head">
              <h3 className="dcm-card-title">
                <span className="dcm-card-chip">
                  <Icon name="coin" />
                </span>
                Performance
              </h3>
            </div>
            <div className="dcm-grid dcm-grid--stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="dcm-stat" style={{ boxShadow: "none" }}>
                <div className="dcm-stat-value" style={{ color: "var(--dcm-indigo)" }}>
                  {formatNumber(campaign.totalUses)}
                </div>
                <div className="dcm-stat-label">Coupon uses</div>
              </div>
              <div className="dcm-stat" style={{ boxShadow: "none" }}>
                <div className="dcm-stat-value" style={{ color: "var(--dcm-success)" }}>
                  {formatCurrency(revenue, currency)}
                </div>
                <div className="dcm-stat-label">Attributed revenue</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dcm-card">
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="settings" />
              </span>
              Edit campaign
            </h3>
          </div>
          <CampaignForm
            campaign={campaign}
            productTitles={titles}
            collectionTitles={titles}
            currency={currency}
            isUpdate
          />
        </div>
      </div>

      {campaign.orders.length > 0 && (
        <div className="dcm-card" style={{ marginTop: 20 }}>
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="shoppingBag" />
              </span>
              Recent orders
            </h3>
          </div>
          <div className="dcm-table-wrap">
            <table className="dcm-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {campaign.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="dcm-cell-mono">{order.orderId}</td>
                    <td>{formatCurrency(order.totalPrice, currency)}</td>
                    <td className="dcm-cell-soft">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaign.logs.length > 0 && (
        <div className="dcm-card" style={{ marginTop: 20 }}>
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="list" />
              </span>
              Campaign log
            </h3>
          </div>
          <div className="dcm-table-wrap">
            <table className="dcm-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Message</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {campaign.logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="dcm-chip">{log.action}</span>
                    </td>
                    <td className="dcm-cell-soft">{log.message || "—"}</td>
                    <td className="dcm-cell-soft">
                      {formatDate(log.createdAt, { withTime: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dcm-card dcm-card--hover" style={{ marginTop: 20, borderColor: "rgba(239,68,68,.25)" }}>
        <div className="dcm-card-head">
          <h3 className="dcm-card-title">
            <span className="dcm-card-chip" style={{ background: "rgba(239,68,68,.1)", color: "var(--dcm-critical)" }}>
              <Icon name="trash" />
            </span>
            Danger zone
          </h3>
        </div>
        <div className="dcm-actions" style={{ justifyContent: "space-between" }}>
          <p className="dcm-note" style={{ margin: 0 }}>
            Permanently delete this campaign and remove its discount from Shopify.
          </p>
          <ActionButton fetcher={fetcher} intent="delete" variant="danger" icon="trash">
            Delete campaign
          </ActionButton>
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
    return `Tagged ${campaign.customerTags}`;
  }
  if (campaign.customerEligibility === "vip") {
    return "VIP customers";
  }
  return "All customers";
}

function truncate(text, max = 42) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
