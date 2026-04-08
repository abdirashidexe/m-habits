/**
 * Nur design tokens — import from this module only; do not hardcode hex values in UI.
 */

export const colors = {
  overlay: 'rgba(44, 44, 44, 0.35)',
  background: '#F5F0E8',
  surface: '#EDE8DC',
  surfaceElevated: '#E8E0D0',
  primary: '#5C7A5F',
  primaryLight: '#7A9E7E',
  accent: '#C4954A',
  textPrimary: '#2C2C2C',
  textSecondary: '#7A7060',
  textMuted: '#B0A898',
  divider: '#D8D0C0',
  success: '#5C7A5F',
  danger: '#C4614A',
  premiumGold: '#C4954A',
};

export const typography = {
  displayLarge: { fontSize: 28, fontWeight: '700' },
  displayMedium: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  subheading: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

const shadowColor = colors.textPrimary;

export const shadows = {
  card: {
    elevation: 2,
    shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  modal: {
    elevation: 8,
    shadowColor,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
};
