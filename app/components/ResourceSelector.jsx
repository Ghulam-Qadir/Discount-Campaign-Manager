import { useAppBridge } from "@shopify/app-bridge-react";
import PropTypes from "prop-types";
import DCMButton from "./DCMButton";

const RESOURCE_LABELS = {
  product: "products",
  collection: "collections",
};

export default function ResourceSelector({
  type,
  selection = [],
  onSelectionChange,
}) {
  const shopify = useAppBridge();
  const label = RESOURCE_LABELS[type] ?? "resources";

  const openPicker = async () => {
    const result = await shopify.resourcePicker({
      type,
      multiple: true,
      selectionIds: selection.map((item) => ({ id: item.id })),
    });
    if (result) {
      onSelectionChange(
        result.map((item) => ({ id: item.id, title: item.title ?? item.id })),
      );
    }
  };

  const remove = (id) => {
    onSelectionChange(selection.filter((item) => item.id !== id));
  };

  return (
    <div className="dcm-stack" style={{ gap: 8 }}>
      <DCMButton onClick={openPicker} variant="secondary" icon={selection.length > 0 ? "settings" : "plus"} size="sm">
        {selection.length > 0
          ? `Manage ${label} (${selection.length})`
          : `Select ${label}`}
      </DCMButton>
      {selection.length > 0 && (
        <div className="dcm-stack" style={{ gap: 6 }}>
          {selection.map((item) => (
            <div
              key={item.id}
              className="dcm-inline"
              style={{
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--dcm-gradient-soft)",
                border: "1px solid var(--dcm-border)",
              }}
            >
              <span style={{ fontSize: 13 }}>{item.title}</span>
              <DCMButton variant="ghost" size="sm" icon="trash" onClick={() => remove(item.id)}>
                Remove
              </DCMButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ResourceSelector.propTypes = {
  type: PropTypes.oneOf(["product", "collection"]).isRequired,
  selection: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, title: PropTypes.string }),
  ),
  onSelectionChange: PropTypes.func.isRequired,
};
