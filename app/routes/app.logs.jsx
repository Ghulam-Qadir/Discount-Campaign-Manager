import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.service";
import db from "../db.server";
import Icon from "../components/Icon";
import { formatDate } from "../utils/format";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const logs = await db.campaignLog.findMany({
    where: { campaign: { shopId: shop.id } },
    include: { campaign: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { logs, shop };
};

export default function Logs() {
  const { logs, shop } = useLoaderData();

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <h1 className="dcm-title dcm-title--gradient">Activity log</h1>
          <p className="dcm-subtitle">
            Recent actions across your campaigns for {shop.domain}
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="dcm-card">
          <div className="dcm-empty">
            <div className="dcm-empty-icon">
              <Icon name="list" />
            </div>
            <h3>No activity yet</h3>
            <p>
              Actions like creating, publishing and expiring campaigns will
              appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="dcm-table-wrap">
          <table className="dcm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Campaign</th>
                <th>Action</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="dcm-cell-soft">
                    {formatDate(log.createdAt, { withTime: true })}
                  </td>
                  <td>
                    {log.campaignId ? (
                      <Link
                        to={`/app/campaigns/${log.campaignId}`}
                        className="dcm-cell-link"
                      >
                        {log.campaign?.name ?? "Deleted campaign"}
                      </Link>
                    ) : (
                      <span className="dcm-cell-soft">—</span>
                    )}
                  </td>
                  <td>
                    <span className="dcm-chip">{log.action}</span>
                  </td>
                  <td className="dcm-cell-soft">{log.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
