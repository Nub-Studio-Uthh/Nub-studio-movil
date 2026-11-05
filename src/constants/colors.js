// Paleta del UI Kit (docs/paleta-ui-kit.md) + colores de skeleton (docs/skeletons/README.md).
export const colors = {
  primary: '#E8640C',
  secondary: '#A83B90',
  tertiary: '#6028AA',

  bgScreen: '#FFFFFF',
  bgSurface: '#F9F8FC',
  bgInput: '#F5F5F2',
  bgDark: '#0D0B14',

  textPrimary: '#14121E',
  textSecondary: '#5A5870',
  textMuted: '#9896A8',
  textOnDark: '#FFFFFF',

  borderDefault: '#E6E4EF',
  borderSubtle: 'rgba(0,0,0,0.05)',

  success: '#0E8A50',
  error: '#C4304A',
  warning: '#A87006',
  info: '#2D6FBE',

  favorite: '#E80C7E',

  skeletonBase: '#E6E4EF',
  skeletonHighlight: '#F9F8FC',
  skeletonBaseDark: '#1C1926',
  skeletonHighlightDark: '#2A2635',
};

// Fondo suave de badges y estados: color al 8 % (UI Kit, "Badges de estado").
export const tint = (hex, alpha = 0.08) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};
