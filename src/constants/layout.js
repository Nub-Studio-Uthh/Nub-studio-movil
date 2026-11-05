import { useWindowDimensions } from 'react-native';
import { getLayout } from '../utils/layout';

export {
  getLayout,
  itemsToFill,
  SCREEN_MARGIN,
  DETAIL_MARGIN,
  GRID_GAP,
  GRID_ROW_GAP,
} from '../utils/layout';

/** Medidas de la pantalla actual; cambia si gira o cambia la escala de letra. */
export function useLayout() {
  const { width, fontScale } = useWindowDimensions();
  return getLayout(width, fontScale);
}
