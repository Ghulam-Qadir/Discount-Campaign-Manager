import { useLoaderData, useOutletContext, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getDashboardStats } from "../services/analytics.service";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DCMButton from "../components/DCMButton";
import Icon from "../components/Icon";
import { CAMPAIGN_TYPES } from "../utils/constants";
import { formatCurrency, formatNumber, formatDate } from "../utils/format";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getDashboardStats(session.shop);
};

export default function Dashboard() {
  const { shop, campaigns, stats } = useLoaderData();
  const { shop: layoutShop } = useOutletContext();
  const currency = shop?.currency ?? layoutShop?.currency ?? "USD";

  const activeRate =
    stats.totalCampaigns > 0
      ? Math.round((stats.active / stats.totalCampaigns) * 100)
      : 0;

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <h1 className="dcm-title dcm-title--gradient">Dashboard</h1>
          <p className="dcm-subtitle">
            Real-time overview of your discount campaigns for {shop.domain}
          </p>
        </div>
        <div className="dcm-head-actions">
          <Link to="/app/campaigns">
            <DCMButton variant="ghost" icon="list">
              All campaigns
            </DCMButton>
          </Link>
          <Link to="/app/campaigns/new">
            <DCMButton variant="primary" icon="plus">
              New campaign
            </DCMButton>
          </Link>
        </div>
      </div>

      <div className="dcm-hero">
        <div className="dcm-hero-grid" />
        <div className="dcm-hero-inner">
          <div>
            <div className="dcm-hero-eyebrow">
              <span className="dcm-live-dot" />
              Campaign engine online
            </div>
            <h2>
              {stats.active > 0
                ? `${stats.active} campaign${stats.active === 1 ? "" : "s"} live right now`
                : stats.totalCampaigns > 0
                  ? "Let's go live"
                  : "Launch your first campaign"}
            </h2>
            <p>
              {stats.active > 0
                ? "Your active discounts are driving revenue at checkout. Track usage, orders and performance from here."
                : "Design, schedule and publish discount campaigns that convert. Start with a percentage or fixed-amount deal."}
            </p>
            <div className="dcm-actions" style={{ marginTop: 20 }}>
              <Link to="/app/campaigns/new">
                <DCMButton variant="primary" size="lg" icon="sparkles">
                  Create campaign
                </DCMButton>
              </Link>
            </div>
          </div>
          <div className="dcm-hero-stats">
            <div className="dcm-hero-stat">
              <b>{formatNumber(stats.active)}</b>
              <span>Active</span>
            </div>
            <div className="dcm-hero-stat">
              <b>{formatNumber(stats.scheduled)}</b>
              <span>Scheduled</span>
            </div>
            <div className="dcm-hero-stat">
              <b>{formatNumber(stats.totalUses)}</b>
              <span>Uses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dcm-grid dcm-grid--stats dcm-stagger">
        <StatCard
          label="Revenue generated"
          value={formatCurrency(stats.revenue, currency)}
          icon="coin"
          tone="emerald"
          detail={`${formatNumber(stats.orderCount)} orders tracked`}
        />
        <StatCard
          label="Total coupon uses"
          value={formatNumber(stats.totalUses)}
          icon="zap"
          tone="indigo"
          detail={`${activeRate}% of campaigns live`}
        />
        <StatCard
          label="Average order value"
          value={formatCurrency(stats.averageOrderValue, currency)}
          icon="chart"
          tone="pink"
          detail="Per campaign order"
        />
        <StatCard
          label="Total campaigns"
          value={formatNumber(stats.totalCampaigns)}
          icon="megaphone"
          tone="sky"
          detail={`${formatNumber(stats.byStatus.DRAFT)} drafts ready`}
        />
      </div>

      <div className="dcm-grid dcm-grid--2 dcm-stagger">
        <div className="dcm-card">
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="chart" />
              </span>
              Campaign status
            </h3>
          </div>
          <div className="dcm-chip-row">
            <span className="dcm-chip active">
              Active · {stats.active}
            </span>
            <span className="dcm-chip">Scheduled · {stats.scheduled}</span>
            <span className="dcm-chip">Draft · {stats.byStatus.DRAFT}</span>
            <span className="dcm-chip">Expired · {stats.byStatus.EXPIRED}</span>
            <span className="dcm-chip">Cancelled · {stats.byStatus.CANCELLED}</span>
          </div>

          {stats.topCampaign && (
            <>
              <hr className="dcm-divider" />
              <div className="dcm-card-title" style={{ marginBottom: 10 }}>
                <span className="dcm-card-chip">
                  <Icon name="trendingUp" />
                </span>
                <span>Top performer</span>
              </div>
              <div className="dcm-inline">
                <StatusBadge status={stats.topCampaign.status} />
                <span style={{ fontWeight: 700 }}>{stats.topCampaign.name}</span>
              </div>
              <p className="dcm-note" style={{ marginTop: 8 }}>
                {formatNumber(stats.topCampaign.totalUses)} uses ·{" "}
                {CAMPAIGN_TYPES[stats.topCampaign.type]?.label ??
                  stats.topCampaign.type}
              </p>
            </>
          )}
        </div>

        <div className="dcm-card dcm-card--hover">
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="calendar" />
              </span>
              Next up
            </h3>
            <Link to="/app/campaigns" className="dcm-meta">
              View all
            </Link>
          </div>
          {stats.scheduled === 0 ? (
            <p className="dcm-note">
              No scheduled campaigns. Schedule a campaign to auto-activate on
              its start date.
            </p>
          ) : (
            <div className="dcm-stack">
              {campaigns
                .filter((c) => c.status === "SCHEDULED")
                .slice(0, 3)
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/app/campaigns/${c.id}`}
                    style={{ color: "inherit" }}
                  >
                    <div className="dcm-inline" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span className="dcm-cell-mono" style={{ color: "var(--dcm-indigo)" }}>
                        {c.couponCode}
                      </span>
                    </div>
                    <p className="dcm-note" style={{ margin: "4px 0 0" }}>
                      Starts {formatDate(c.startDate, { withTime: true })}
                    </p>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="dcm-card" style={{ marginTop: 20 }}>
        <div className="dcm-card-head">
          <h3 className="dcm-card-title">
            <span className="dcm-card-chip">
              <Icon name="megaphone" />
            </span>
            Recent campaigns
          </h3>
          <Link to="/app/campaigns" className="dcm-meta">
            View all →
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="dcm-empty">
            <div className="dcm-empty-icon">
              <Icon name="sparkles" />
            </div>
            <h3>No campaigns yet</h3>
            <p>
              Create your first campaign to generate a discount code your
              customers can redeem at checkout.
            </p>
            <Link to="/app/campaigns/new">
              <DCMButton variant="primary" icon="plus">
                Create your first campaign
              </DCMButton>
            </Link>
          </div>
        ) : (
          <div className="dcm-table-wrap">
            <table className="dcm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Uses</th>
                  <th>Starts</th>
                  <th>Ends</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 5).map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Link
                        to={`/app/campaigns/${campaign.id}`}
                        className="dcm-cell-link"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="dcm-cell-soft">
                      {CAMPAIGN_TYPES[campaign.type]?.label ?? campaign.type}
                    </td>
                    <td>
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td>{formatNumber(campaign.totalUses)}</td>
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

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
