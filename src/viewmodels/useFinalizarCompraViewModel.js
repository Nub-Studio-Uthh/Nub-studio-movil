import { useCarritoViewModel } from './useCarritoViewModel';
import { resumenObras, urlPagoWeb } from '../utils/checkout';

// URL de la web. EXPO_PUBLIC_* queda dentro de la app: aquí nunca van secretos.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

/**
 * Finalizar compra (HU-09). Muestra el mismo carrito que la web (vive en el backend por
 * usuario) y entrega la URL de pago de la web. No captura dirección ni datos de pago:
 * eso se hace en la web.
 */
export function useFinalizarCompraViewModel() {
  const carrito = useCarritoViewModel();
  return {
    ...carrito,
    resumen: resumenObras(carrito.items),
    urlPago: urlPagoWeb(WEB_URL),
  };
}
