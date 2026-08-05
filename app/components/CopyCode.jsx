import { useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import PropTypes from "prop-types";

export default function CopyCode({ code, size = "page" }) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    shopify.toast.show("Discount code copied");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const isPage = size === "page";

  return (
    <s-stack direction="inline" gap="base" alignItems="center" inlineWrap>
      {isPage && <s-icon name="discount-code" />}
      <s-text
        style={{
          fontFamily: "monospace",
          fontWeight: 600,
          letterSpacing: "0.05em",
          wordBreak: "break-all",
          fontSize: isPage ? "1.25rem" : "0.875rem",
        }}
      >
        {code}
      </s-text>
      <s-button
        variant="tertiary"
        icon={copied ? "clipboard-check" : "clipboard"}
        onClick={copy}
      >
        {copied ? "Copied" : "Copy"}
      </s-button>
    </s-stack>
  );
}

CopyCode.propTypes = {
  code: PropTypes.string,
  size: PropTypes.oneOf(["page", "inline"]),
};
