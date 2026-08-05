import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import PropTypes from "prop-types";
import Icon from "./Icon";

export default function CodeChip({ code }) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

  if (!code) return <span className="dcm-cell-soft">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      shopify.toast.show("Discount code copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      shopify.toast.show("Could not copy code", { isError: true });
    }
  };

  return (
    <span className="dcm-code">
      {code}
      <button
        type="button"
        className="dcm-code-btn"
        onClick={copy}
        aria-label="Copy code"
        title="Copy code"
      >
        <Icon name={copied ? "check" : "copy"} />
      </button>
    </span>
  );
}

CodeChip.propTypes = {
  code: PropTypes.string,
};
