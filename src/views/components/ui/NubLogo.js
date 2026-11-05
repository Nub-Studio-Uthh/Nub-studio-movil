import { Image } from 'expo-image';

const logo = require('../../../../assets/logo.png');

/** Logo de NU-B. Ajusta width/height a la proporción real del archivo si se ve estirado. */
export function NubLogo({ width = 140, height = 64 }) {
  return (
    <Image
      source={logo}
      style={{ width, height }}
      contentFit="contain"
      accessible
      accessibilityLabel="NU-B Studio"
    />
  );
}
