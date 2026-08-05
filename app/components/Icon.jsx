import PropTypes from "prop-types";

const PATHS = {
  dashboard:
    "M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 8h7v10h-7V11zM3 15h7v6H3v-6z",
  megaphone:
    "M13 4.5a1 1 0 0 0-1.62-.78L6.6 7.5H4A2 2 0 0 0 2 9.5v1a2 2 0 0 0 2 2h2.6l4.78 3.78A1 1 0 0 0 13 15.5v-11zM3.5 17l.7-2.5M9 19l1.5-2M19 8.5a5 5 0 0 1 0 7M22 5.5a9 9 0 0 1 0 13",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  settings:
    "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5zM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09c0 .67.4 1.28 1.03 1.56a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87c.28.63.89 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.02z",
  sparkles:
    "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM5 15l.8 1.7L7.5 17.5l-1.7.8L5 20l-.8-1.7L2.5 17.5l1.7-.8L5 15z",
  coin:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-13.5h-2v1.2A3.5 3.5 0 0 0 9.5 11a1.5 1.5 0 0 0 1.5 1.5h2a.5.5 0 0 1 0 1h-2v1.5a3.5 3.5 0 0 0 1.5 1.3v1.2h2v-1.2a3.5 3.5 0 0 0 1.5-1.3 1.5 1.5 0 0 0-1.5-1.5h-2a.5.5 0 0 1 0-1h2v-1.5A3.5 3.5 0 0 0 13 8V6.5z",
  chart:
    "M3 21h18M7 17V9m5 8V4m5 13v-7",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.6",
  calendar:
    "M6 2h12v4H6V2zm-2 6h16v14H4V8zm4 4h2v2H8v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm-6 4h2v2H8v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2z",
  tag: "M20.6 12.7l-7.9 7.9a2 2 0 0 1-2.8 0L2 12.8V3h9.8l8.8 8.8a2 2 0 0 1 0 2.9zM7 7h.01",
  zap: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  trash:
    "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6",
  play: "M8 5v14l11-7L8 5z",
  pause: "M7 5h4v14H7V5zm6 0h4v14h-4V5z",
  refresh:
    "M20 12a8 8 0 1 1-2.34-5.66M20 3v6h-6",
  check: "M4 12l5 5L20 7",
  copy: "M9 9h11v11H9V9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  plus: "M12 5v14M5 12h14",
  chevronRight: "M9 6l6 6-6 6",
  arrowUp: "M12 19V5m-6 6l6-6 6 6",
  trendingUp: "M3 17l6-6 4 4 8-8M21 7v6m0-6h-6",
  trendingDown: "M3 7l6 6 4-4 8 8m0-6v6m0 0h-6",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
  shoppingBag:
    "M6 7h12l1 14H5L6 7zM9 10V6a3 3 0 0 1 6 0v4",
  gift: "M20 12v9H4v-9M2 7h20v5H2V7zm10 5v9M12 7s-1-4 2-4 3 3-1 4c3 0 4-1 4-4-3-2-5 2-5 4z",
  clock: "M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
};

export default function Icon({ name, size = 20, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name] ?? PATHS.sparkles} />
    </svg>
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
};
