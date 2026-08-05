import PropTypes from "prop-types";

const TONE = {
  ACTIVE: "active",
  SCHEDULED: "scheduled",
  DRAFT: "draft",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

const LABELS = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  DRAFT: "Draft",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status }) {
  const tone = TONE[status] ?? "draft";
  const label = LABELS[status] ?? status ?? "Unknown";

  return (
    <span className={`dcm-status dcm-status--${tone}`}>
      <span className="dcm-status-dot" />
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};
