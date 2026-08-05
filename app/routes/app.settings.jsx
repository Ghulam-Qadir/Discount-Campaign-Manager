import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getShopByDomain,
  updateShopSettings,
} from "../services/shop.service";
import { TIMEZONES, CURRENCIES } from "../utils/constants";
import Icon from "../components/Icon";
import DCMButton from "../components/DCMButton";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await getShopByDomain(session.shop);
  return { shop };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const shop = await updateShopSettings(session.shop, {
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    emailNotifications: formData.get("emailNotifications") === "true",
  });
  return { shop, saved: true };
};

export default function Settings() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const updatedShop = fetcher.data?.shop ?? shop;

  const [timezone, setTimezone] = useState(updatedShop?.timezone ?? "UTC");
  const [currency, setCurrency] = useState(updatedShop?.currency ?? "USD");
  const [emailNotifications, setEmailNotifications] = useState(
    updatedShop?.emailNotifications ?? true,
  );

  const save = () => {
    const formData = new FormData();
    formData.set("timezone", timezone);
    formData.set("currency", currency);
    formData.set("emailNotifications", String(emailNotifications));
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="dcm-page">
      <div className="dcm-page-head">
        <div>
          <h1 className="dcm-title dcm-title--gradient">Settings</h1>
          <p className="dcm-subtitle">Store preferences for your dashboard</p>
        </div>
      </div>

      <div className="dcm-grid dcm-grid--2 dcm-stagger" style={{ alignItems: "start" }}>
        <div className="dcm-card">
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="settings" />
              </span>
              Store preferences
            </h3>
          </div>

          {fetcher.data?.saved && (
            <div className="dcm-inline" style={{ marginBottom: 16 }}>
              <span className="dcm-live-dot" />
              <span className="dcm-trend-up">Settings saved</span>
            </div>
          )}

          <div className="dcm-stack" style={{ gap: 18 }}>
            <div>
              <p className="dcm-meta" style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "var(--dcm-text-2)" }}>
                Store timezone
              </p>
              <s-select
                label="Store timezone"
                value={timezone}
                onInput={(event) => setTimezone(event.currentTarget.value)}
              >
                {TIMEZONES.map((tz) => (
                  <s-option key={tz} value={tz}>
                    {tz}
                  </s-option>
                ))}
              </s-select>
              <p className="dcm-note" style={{ marginTop: 6 }}>
                Used to schedule campaign start and end times.
              </p>
            </div>

            <div>
              <p className="dcm-meta" style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "var(--dcm-text-2)" }}>
                Currency
              </p>
              <s-select
                label="Currency"
                value={currency}
                onInput={(event) => setCurrency(event.currentTarget.value)}
              >
                {CURRENCIES.map((c) => (
                  <s-option key={c} value={c}>
                    {c}
                  </s-option>
                ))}
              </s-select>
              <p className="dcm-note" style={{ marginTop: 6 }}>
                Used to display revenue and discount values.
              </p>
            </div>

            <div>
              <s-checkbox
                label="Email notifications"
                checked={emailNotifications}
                onChange={(event) =>
                  setEmailNotifications(event.currentTarget.checked)
                }
                details="Receive an email when a campaign is activated or expires."
              />
            </div>

            <DCMButton variant="primary" onClick={save} loading={fetcher.state !== "idle"}>
              Save settings
            </DCMButton>
          </div>
        </div>

        <div className="dcm-card dcm-card--hover" style={{ alignSelf: "start" }}>
          <div className="dcm-card-head">
            <h3 className="dcm-card-title">
              <span className="dcm-card-chip">
                <Icon name="sparkles" />
              </span>
              Pro tips
            </h3>
          </div>
          <div className="dcm-stack" style={{ gap: 14 }}>
            {[
              {
                icon: "calendar",
                title: "Schedule campaigns",
                body: "Set a start date and status 'Scheduled' to auto-publish without touching the dashboard.",
              },
              {
                icon: "users",
                title: "Target VIPs",
                body: "Tag customers with 'VIP' and pick VIP eligibility to reward your best buyers.",
              },
              {
                icon: "trendingUp",
                title: "Track revenue",
                body: "The orders/updated webhook attributes revenue to campaigns automatically.",
              },
            ].map((tip) => (
              <div className="dcm-inline" key={tip.title} style={{ alignItems: "flex-start" }}>
                <span className="dcm-card-chip" style={{ marginTop: 2 }}>
                  <Icon name={tip.icon} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{tip.title}</div>
                  <p className="dcm-note" style={{ margin: "2px 0 0" }}>
                    {tip.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
