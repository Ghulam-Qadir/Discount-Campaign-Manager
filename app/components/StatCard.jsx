import PropTypes from "prop-types";
import Icon from "./Icon";

export default function StatCard({ label, value, icon = "sparkles", tone = "indigo", detail, trend, trendDirection = "up" }) {
  return (
    <div className="dcm-stat dcm-stagger">
      <div className="dcm-stat-top">
        <div className={`dcm-stat-icon dcm-stat-icon--${tone}`}>
          <Icon name={icon} />
        </div>
        {trend ? (
          <span className={trendDirection === "up" ? "dcm-trend-up" : "dcm-trend-down"}>
            <Icon name={trendDirection === "up" ? "trendingUp" : "trendingDown"} size={13} />
            {trend}
          </span>
        ) : null}
      </div>
      <div className="dcm-stat-value">{value}</div>
      <div className="dcm-stat-label">{label}</div>
      {detail ? <div className="dcm-stat-detail">{detail}</div> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
  icon: PropTypes.string,
  tone: PropTypes.string,
  detail: PropTypes.node,
  trend: PropTypes.node,
  trendDirection: PropTypes.oneOf(["up", "down"]),
};
