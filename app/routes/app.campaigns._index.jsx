import { useLoaderData, useSearchParams, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCampaigns } from "../services/campaign.service";
import { getOrCreateShop } from "../services/shop.service";
import StatusBadge from "../components/StatusBadge";
import CodeChip from "../components/CodeChip";
import DCMButton from "../components/DCMButton";
import Icon from "../components/Icon";
import { CAMPAIGN_TYPES, CAMPAIGN_STATUS } from "../utils/constants";
import { formatDate, formatCurrency } from "../utils/format";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const campaigns = await listCampaigns(shop.id);
  const url = new URL(request.url);
  const filter = url.searchParams.get("status") ?? "ALL";
  const filtered = filter === "ALL" ? campaigns : campaigns.filter((c) => c.status === filter);

  const counts = { ALL: campaigns.length };
  for (const status of Object.keys(CAMPAIGN_STATUS)) {
    counts[status] = campaigns.filter((c) => c.status === status).length;
  }

  return { campaigns: filtered, counts, shop, filter };
};

export default function CampaignsIndex() {
  const { campaigns, counts, shop, filter } = useLoaderData();
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <h1 className="dcm-title dcm-title--gradient">Campaigns</h1>
          <p className="dcm-subtitle">
            {counts.ALL} campaign{counts.ALL === 1 ? "" : "s"} for {shop.domain}
          </p>
        </div>
        <div className="dcm-head-actions">
          <Link to="/app/campaigns/new">
            <DCMButton variant="primary" icon="plus">
              New campaign
            </DCMButton>
          </Link>
        </div>
      </div>

      <div className="dcm-stack">
        <div className="dcm-card" style={{ padding: "14px 18px" }}>
          <div className="dcm-chip-row">
            {["ALL", ...Object.keys(CAMPAIGN_STATUS)].map((status) => (
              <button
                key={status}
                type="button"
                className={`dcm-chip${filter === status ? " active" : ""}`}
                onClick={() =>
                  setSearchParams(
                    status === "ALL" ? {} : { status },
                    { preventScrollReset: true },
                  )
                }
              >
                {status === "ALL" ? "All" : CAMPAIGN_STATUS[status].label}
                {status === "ALL" ? ` · ${counts.ALL}` : ""}
              </button>
            ))}
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="dcm-card">
            <div className="dcm-empty">
              <div className="dcm-empty-icon">
                <Icon name="megaphone" />
              </div>
              <h3>{filter === "ALL" ? "No campaigns yet" : `No ${CAMPAIGN_STATUS[filter]?.label.toLowerCase()} campaigns`}</h3>
              <p>
                Create your first campaign to generate a discount code that your
                customers can redeem at checkout.
              </p>
              <Link to="/app/campaigns/new">
                <DCMButton variant="primary" icon="plus">
                  New campaign
                </DCMButton>
              </Link>
            </div>
          </div>
        ) : (
          <div className="dcm-table-wrap">
            <table className="dcm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Uses</th>
                  <th>Starts</th>
                  <th>Ends</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Link
                        to={`/app/campaigns/${campaign.id}`}
                        className="dcm-cell-link"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td>
                      <CodeChip code={campaign.couponCode} />
                    </td>
                    <td className="dcm-cell-soft">
                      {CAMPAIGN_TYPES[campaign.type]?.label ?? campaign.type}
                    </td>
                    <td>{formatValue(campaign, shop.currency)}</td>
                    <td>
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td>{campaign.totalUses}</td>
                    <td className="dcm-cell-soft">{formatDate(campaign.startDate)}</td>
                    <td className="dcm-cell-soft">{formatDate(campaign.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  return <span className="dcm-cell-soft">—</span>;
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
