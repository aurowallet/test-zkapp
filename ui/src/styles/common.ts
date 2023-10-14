const sizes = {
  mobile: "576px",
  tablet: "768px",
  tabletL: "992px",
  desktop: "1200px",
};

export const devices = {
  mobile: `(min-width: ${sizes.mobile})`,
  tablet: `(min-width: ${sizes.tablet})`,
  tabletL: `(min-width: ${sizes.tabletL})`,
  desktop: `(min-width: ${sizes.desktop})`,
};
