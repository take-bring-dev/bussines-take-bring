/** TBD — Take Bring Dispatching (Design System v1.0) */
export const brand = {
  name: "TBD",
  fullName: "Take Bring Dispatching",
  legalName: "Take & Bring GmbH",
  colors: {
    accent: "#ABC629",
    dark: "#556500",
    hover: "#8FA622",
    light: "#D3EF51",
    lightFixed: "#D4E88A",
    surface: "#F1FDE5",
    surfaceLow: "#ECF8DF",
    surfaceContainer: "#E6F2DA",
    surfaceHigh: "#E0ECD4",
    card: "#FFFFFF",
    ink: "#151E10",
    muted: "#454836",
    outline: "#C6C8B0",
    outlineStrong: "#767964",
    error: "#BA1A1A",
    errorContainer: "#FFDAD6",
    success: "#2C6A3D",
    successContainer: "#D1E8D5",
    // aliases used elsewhere
    primary: "#ABC629",
    primaryDark: "#556500",
    primaryLight: "#D3EF51",
    white: "#FFFFFF",
  },
  radius: 8,
  marketingUrl:
    process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/+$/, "") ??
    "https://take-bring.eu",
} as const;
