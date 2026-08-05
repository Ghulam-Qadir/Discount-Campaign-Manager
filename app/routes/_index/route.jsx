import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.page}>
      <div className={styles.blobOne} />
      <div className={styles.blobTwo} />

      <div className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>D</span>
          <span className={styles.logoName}>Discount Studio</span>
        </div>
        <a className={styles.navLink} href="https://shopify.dev/docs/apps">
          Docs
        </a>
      </div>

      <main className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Shopify discount engine</span>
          <h1 className={styles.heading}>
            Launch campaigns that{" "}
            <span className={styles.headingAccent}>drive sales</span>
          </h1>
          <p className={styles.text}>
            Design, schedule and analyze percentage, fixed-amount, free-shipping
            and BOGO discount campaigns from one beautiful dashboard.
          </p>

          {showForm && (
            <Form className={styles.form} method="post" action="/auth/login">
              <label className={styles.label}>
                <span className={styles.labelText}>Store domain</span>
                <input
                  className={styles.input}
                  type="text"
                  name="shop"
                  placeholder="your-store.myshopify.com"
                />
                <span className={styles.hint}>e.g: my-shop-domain.myshopify.com</span>
              </label>
              <button className={styles.button} type="submit">
                Get started →
              </button>
            </Form>
          )}
        </div>

        <div className={styles.features}>
          <h2 className={styles.featuresHeading}>Everything you need</h2>
          <ul className={styles.list}>
            <li>
              <strong>Smart scheduling</strong> — auto-activate on start date,
              auto-expire when it ends.
            </li>
            <li>
              <strong>Precise targeting</strong> — products, collections, tagged
              or VIP customers.
            </li>
            <li>
              <strong>Real-time analytics</strong> — revenue, uses and average
              order value attributed per campaign.
            </li>
            <li>
              <strong>Full audit trail</strong> — every create, publish and
              expiry recorded in your activity log.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
