// Tipografía del UI Kit: Outfit para todo el texto, SolveraLorvane para la marca y títulos hero,
// y Nexa Heavy para títulos de pantalla y cifras. Las dos de marca son de un solo peso:
// no se les pone fontWeight. Se cargan en App.js desde assets/fonts/.
export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  display: 'SolveraLorvane',
  numeric: 'NexaHeavy',
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
