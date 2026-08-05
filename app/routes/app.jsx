import {
  Outlet,
  useLoaderData,
  useLocation,
  useRouteError,
  Link,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.service";
import { processCampaigns } from "../services/scheduler.service";
import Icon from "../components/Icon";
import PropTypes from "prop-types";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  try {
    await processCampaigns({
      shopId: shop.id,
      admin,
    });
  } catch (error) {
    console.error("Scheduler error:", error.message);
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "", shop };
};

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/app/campaigns", label: "Campaigns", icon: "megaphone" },
  { to: "/app/logs", label: "Activity log", icon: "list" },
  { to: "/app/settings", label: "Settings", icon: "settings" },
];

function Sidebar({ shop }) {
  const location = useLocation();
  const domain = shop?.domain ?? "";
  const initial = domain ? domain.charAt(0).toUpperCase() : "S";
  return (
    <aside className="dcm-sidebar">
      <div className="dcm-brand">
        <div className="dcm-brand-logo">
          <Icon name="zap" size={20} />
        </div>
        <div>
          <div className="dcm-brand-name">Discount Studio</div>
          <div className="dcm-brand-sub">Campaign manager</div>
        </div>
      </div>

      <nav className="dcm-nav">
        <div className="dcm-nav-label">Workspace</div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`dcm-nav-item${isActive ? " active" : ""}`}
            >
              <Icon name={item.icon} className="dcm-nav-icon" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="dcm-sidebar-footer">
        <div className="dcm-shop-avatar">{initial}</div>
        <div style={{ minWidth: 0 }}>
          <div className="dcm-shop-name">{domain}</div>
          <div className="dcm-shop-plan">Pro store</div>
        </div>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  shop: PropTypes.shape({ domain: PropTypes.string }),
};

function MobileBar({ shop }) {
  return (
    <div className="dcm-mobilebar">
      <div className="dcm-mobilebar-logo">
        <Icon name="zap" size={16} />
      </div>
      <div className="dcm-mobilebar-name">Discount Studio</div>
      <div className="dcm-mobilebar-shop">{shop?.domain}</div>
    </div>
  );
}

MobileBar.propTypes = {
  shop: PropTypes.shape({ domain: PropTypes.string }),
};

export default function App() {
  const { apiKey, shop } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <MobileBar shop={shop} />
      <div className="dcm-shell">
        <Sidebar shop={shop} />
        <main className="dcm-main">
          <Outlet context={{ shop }} />
        </main>
      </div>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
