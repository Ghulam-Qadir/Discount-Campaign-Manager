import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "linear-gradient(160deg,#eef2ff 0%,#f3e8ff 55%,#fce7f3 100%)",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            top: -180,
            right: -140,
            background:
              "radial-gradient(circle, rgba(139,92,246,.25), transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            bottom: -160,
            left: -120,
            background:
              "radial-gradient(circle, rgba(56,189,248,.2), transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,.85)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(15,23,42,.07)",
            borderRadius: 24,
            boxShadow: "0 28px 70px rgba(99,102,241,.18)",
            padding: "38px 36px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 26,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6 50%,#d946ef)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 21,
                boxShadow: "0 10px 26px rgba(139,92,246,.4)",
              }}
            >
              D
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#0b1220" }}>
                Discount Studio
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#8a93a8",
                  fontWeight: 600,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                Campaign manager
              </div>
            </div>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#0b1220",
            }}
          >
            Log in to your store
          </h1>
          <p
            style={{
              margin: "6px 0 24px",
              color: "#4b5568",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Enter your store domain to open the campaign dashboard.
          </p>

          <Form method="post">
            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
              <label
                htmlFor="shop"
                style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}
              >
                Shop domain
              </label>
              <input
                id="shop"
                name="shop"
                type="text"
                value={shop}
                onChange={(e) => setShop(e.currentTarget.value)}
                placeholder="your-store.myshopify.com"
                autoComplete="on"
                style={{
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: `1px solid ${errors?.shop ? "#ef4444" : "rgba(15,23,42,.14)"}`,
                  fontSize: 14.5,
                  fontFamily: "inherit",
                  color: "#0b1220",
                  background: "#fff",
                  outline: "none",
                  transition: "border-color .15s ease, box-shadow .15s ease",
                  boxShadow: "0 1px 2px rgba(15,23,42,.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors?.shop
                    ? "#ef4444"
                    : "rgba(15,23,42,.14)";
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,.05)";
                }}
              />
              <span style={{ fontSize: 12, color: "#8a93a8" }}>
                e.g: my-shop-domain.myshopify.com
              </span>
              {errors?.shop && (
                <span style={{ fontSize: 12.5, color: "#ef4444", fontWeight: 600 }}>
                  {errors.shop}
                </span>
              )}
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6 50%,#d946ef)",
                color: "#fff",
                fontSize: 14.5,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                boxShadow: "0 10px 26px rgba(99,102,241,.4)",
                transition: "transform .2s ease, box-shadow .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 16px 34px rgba(139,92,246,.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 10px 26px rgba(99,102,241,.4)";
              }}
            >
              Log in
            </button>
          </Form>
        </div>
      </div>
    </AppProvider>
  );
}
