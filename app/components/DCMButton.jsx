import PropTypes from "prop-types";
import Icon from "./Icon";

export default function DCMButton({
  children,
  variant = "secondary",
  size,
  icon,
  loading = false,
  className,
  type = "button",
  disabled,
  ...rest
}) {
  const classes = [
    "dcm-btn",
    `dcm-btn--${variant}`,
    size ? `dcm-btn--${size}` : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="dcm-btn-spinner" /> : icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}

DCMButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "danger"]),
  size: PropTypes.oneOf(["sm", "lg"]),
  icon: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
  disabled: PropTypes.bool,
};
