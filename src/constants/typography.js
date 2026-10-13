// Tipografía del UI Kit. Las fuentes de marca (SolveraLorvane y Nexa Heavy) todavía no están
// en el repositorio; mientras llegan, `display` y `numeric` usan Outfit.
export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  display: 'Outfit_400Regular', // SolveraLorvane (pendiente)
  numeric: 'Outfit_700Bold', // Nexa Heavy (pendiente)
};

// Tamaños medidos en las pantallas aprobadas de Figma.
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 32, lineHeight: 40, letterSpacing: -1 },
  screenTitle: { fontFamily: fonts.numeric, fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  section: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16 },
  metaBold: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 16 },
  price: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15 },
  button: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2 },
  badge: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  tab: { fontFamily: fonts.bold, fontSize: 11 },
};
