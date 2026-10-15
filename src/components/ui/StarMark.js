import { Image } from 'expo-image';

const estrella = require('../../../assets/Estrella1jpeg.jpeg');

/** Estrella decorativa de la marca (Login y Mi cuenta). */
export function StarMark({ size = 24 }) {
  return <Image source={estrella} style={{ width: size, height: size }} contentFit="contain" />;
}
