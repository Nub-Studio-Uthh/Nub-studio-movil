// Integración (#45): compra. Detalle de obra → carrito → finalizar compra → mis pedidos,
// con AuthContext, viewmodels, services, normalizadores y api.js de verdad. El backend
// simulado guarda el carrito y los pedidos en memoria, así cada pantalla ve lo que dejó la
// anterior, igual que con el backend real.
import { CLIENTE, crearBackend, lineaCarritoApi, obraDetalleApi } from './backendFalso';
import { Alert, Linking, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../src/models/AuthContext';
import { DetalleObraScreen } from '../../../src/views/screens/catalog/DetalleObraScreen';
import { CarritoScreen } from '../../../src/views/screens/cart/CarritoScreen';
import { FinalizarCompraScreen } from '../../../src/views/screens/cart/FinalizarCompraScreen';
import { PedidosScreen } from '../../../src/views/screens/pedidos/PedidosScreen';
import { formatearPrecio } from '../../../src/utils/formatters';
import { almacen } from './secureStoreFalso';

jest.mock('expo-secure-store', () => require('./secureStoreFalso'));

// El primer render de las pantallas puede tardar en el runner de CI.
jest.setTimeout(40000);

const TOKEN = 'tk-cliente';
const OBRAS = {
  51: { titulo: 'Espíritu Navideño', precio: 2150, stock: 5 },
  52: { titulo: 'Xantolo', precio: 1500, stock: 5 },
  // La pantalla la muestra con existencias, pero alguien la compró antes: el backend la rechaza.
  53: { titulo: 'Última pieza', precio: 900, stock: 1, vendidaAntes: true },
};

// ── Backend simulado con estado ──────────────────────────────────────────────────

let api;
let carrito;
let pedidos;

function prepararBackend() {
  api = crearBackend();
  carrito = [];
  pedidos = [];
  let siguienteLinea = 100;
  const conSesion = (manejador) => (peticion) =>
    peticion.token === TOKEN ? manejador(peticion) : [401, { message: 'Token requerido' }];

  api.ruta('GET /api/auth/check-session', () => ({ success: true }));
  api.ruta('GET /api/obras/:id', ({ params }) => {
    const o = OBRAS[params.id];
    if (!o) return [404, { message: 'Obra no encontrada' }];
    return {
      data: obraDetalleApi(Number(params.id), o.titulo, {
        precio_base: String(o.precio),
        stock_disponible: o.stock,
      }),
    };
  });
  api.ruta(
    'GET /api/favoritos/check/:id',
    conSesion(() => ({ esFavorito: false }))
  );

  api.ruta(
    'GET /api/carrito',
    conSesion(() => ({
      data: carrito.map((l) =>
        lineaCarritoApi(l.id, l.idObra, OBRAS[l.idObra].titulo, OBRAS[l.idObra].precio, l.cantidad)
      ),
    }))
  );
  api.ruta(
    'POST /api/carrito',
    conSesion(({ body }) => {
      const obra = OBRAS[body.id_obra];
      if (!obra) return [404, { message: 'Obra no disponible' }];
      if (obra.vendidaAntes) return [400, { message: 'Esta obra está agotada' }];
      let linea = carrito.find((l) => l.idObra === body.id_obra);
      if (linea) linea.cantidad = body.cantidad;
      else {
        linea = { id: siguienteLinea++, idObra: body.id_obra, cantidad: body.cantidad };
        carrito.unshift(linea);
      }
      return [201, { id_carrito: linea.id }];
    })
  );
  api.ruta(
    'DELETE /api/carrito/:id',
    conSesion(({ params }) => {
      carrito = carrito.filter((l) => l.id !== Number(params.id));
      return { success: true };
    })
  );

  api.ruta('GET /api/estados', () => ({ data: [{ id_estado: 13, nombre: 'Hidalgo' }] }));
  api.ruta('GET /api/municipios/:id', () => ({
    data: [{ id_municipio: 28, nombre: 'Huejutla de Reyes' }],
  }));
  api.ruta(
    'POST /api/direcciones',
    conSesion(() => [201, { id_direccion: 55 }])
  );

  // Crea el pedido con las líneas pedidas (o todo el carrito) y las saca del carrito.
  api.ruta(
    'POST /api/ventas/checkout',
    conSesion(({ body }) => {
      const lineas = body.ids_carrito
        ? carrito.filter((l) => body.ids_carrito.includes(l.id))
        : [...carrito];
      if (!lineas.length) return [400, { message: 'Tu carrito está vacío' }];
      const idPedido = 40 + pedidos.length;
      const total = lineas.reduce((t, l) => t + OBRAS[l.idObra].precio * l.cantidad, 0);
      lineas.forEach((l, i) =>
        pedidos.push({
          id_pedido: idPedido,
          id_venta: idPedido * 10 + i,
          titulo: OBRAS[l.idObra].titulo,
          slug: `obra-${l.idObra}`,
          imagen_principal: null,
          artista_alias: 'Mariana Castillo',
          cantidad: l.cantidad,
          precio_unitario: String(OBRAS[l.idObra].precio),
          subtotal: String(OBRAS[l.idObra].precio * l.cantidad),
          total: String(OBRAS[l.idObra].precio * l.cantidad),
          estado_pedido: 'pendiente',
          fecha_pedido: '2026-11-07T15:00:00.000Z',
          total_pedido: String(total),
          descuento_cupon: '0',
          codigo_cupon: null,
          numero_guia: null,
        })
      );
      carrito = carrito.filter((l) => !lineas.includes(l));
      return [201, { id_pedido: idPedido, init_point: `https://mp.test/pagar/${idPedido}` }];
    })
  );
  api.ruta(
    'GET /api/ventas/mis-pedidos',
    conSesion(() => ({ data: pedidos }))
  );
}

// ── Montaje de pantallas con sesión ──────────────────────────────────────────────

function EstadoSesion() {
  return <Text testID="sesion-estado">{useAuth().status}</Text>;
}

const navegacion = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => false),
  addListener: jest.fn(() => jest.fn()),
});

async function abrir(Pantalla, params = {}) {
  const navigation = navegacion();
  const vista = render(
    <AuthProvider>
      <Pantalla navigation={navigation} route={{ params }} />
      <EstadoSesion />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByTestId('sesion-estado')).not.toHaveTextContent('loading'));
  return { navigation, ...vista };
}

const abrirDetalle = async (id) => {
  const r = await abrir(DetalleObraScreen, { id });
  await screen.findByText(OBRAS[id].titulo, {}, { timeout: 10000 });
  return r;
};

async function llenarDireccion() {
  fireEvent.changeText(await screen.findByTestId('dir-calle'), 'Av. Juárez');
  fireEvent.changeText(screen.getByTestId('dir-num-ext'), '12');
  fireEvent.changeText(screen.getByTestId('dir-colonia'), 'Centro');
  fireEvent.changeText(screen.getByTestId('dir-cp'), '43000');
  fireEvent.press(await screen.findByTestId('dir-estado'));
  fireEvent.press(await screen.findByTestId('dir-estado-opcion-13'));
  await waitFor(() =>
    expect(screen.getByTestId('dir-municipio').props.accessibilityState.disabled).toBe(false)
  );
  fireEvent.press(screen.getByTestId('dir-municipio'));
  fireEvent.press(await screen.findByTestId('dir-municipio-opcion-28'));
}

beforeEach(() => {
  // Linking.openURL ya viene simulado por jest-expo: se limpian sus llamadas entre pruebas.
  jest.clearAllMocks();
  almacen.clear();
  almacen.set('nub_token', TOKEN);
  almacen.set('nub_usuario', JSON.stringify(CLIENTE));
  prepararBackend();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

afterEach(() => jest.restoreAllMocks());

// ── Pruebas ─────────────────────────────────────────────────────────────────────

describe('Integración: compra completa', () => {
  it('agrega una obra, la ve en el carrito, paga y la encuentra en Mis pedidos', async () => {
    // 1. Detalle de obra: elige 2 piezas y la agrega al carrito.
    const detalle = await abrirDetalle(51);
    fireEvent.press(screen.getByTestId('detalle-mas'));
    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));
    await waitFor(() =>
      expect(detalle.navigation.navigate).toHaveBeenCalledWith('Tabs', { screen: 'Carrito' })
    );
    const agregado = api.llamadas('POST /api/carrito')[0];
    expect(agregado.body).toEqual({ id_obra: 51, cantidad: 2 });
    expect(agregado.token).toBe(TOKEN);
    detalle.unmount();

    // 2. Carrito: muestra lo que guardó el backend, con el total.
    const carritoPantalla = await abrir(CarritoScreen);
    expect(await screen.findByText('Espíritu Navideño')).toBeTruthy();
    expect(screen.getByTestId('carrito-total')).toHaveTextContent(formatearPrecio(4300));
    fireEvent.press(screen.getByTestId('carrito-pagar'));
    expect(carritoPantalla.navigation.navigate).toHaveBeenCalledWith('FinalizarCompra');
    carritoPantalla.unmount();

    // 3. Finalizar compra: guarda la dirección, crea el pago y abre Mercado Pago.
    const finalizar = await abrir(FinalizarCompraScreen);
    await llenarDireccion();
    fireEvent.press(screen.getByTestId('finalizar-continuar'));

    await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('https://mp.test/pagar/40'));
    expect(finalizar.navigation.replace).toHaveBeenCalledWith('Pedidos');
    expect(api.llamadas('POST /api/direcciones')[0].body).toMatchObject({
      calle: 'Av. Juárez',
      numero_exterior: '12',
      colonia: 'Centro',
      codigo_postal: '43000',
      id_estado: 13,
      id_municipio: 28,
    });
    expect(api.llamadas('POST /api/ventas/checkout')[0].body).toEqual({ id_direccion_envio: 55 });
    finalizar.unmount();

    // 4. Mis pedidos: aparece el pedido nuevo y el carrito quedó vacío.
    await abrir(PedidosScreen);
    expect(await screen.findByTestId('pedido-0')).toBeTruthy();
    expect(screen.getByText(/NUB-00040/)).toBeTruthy();
    expect(carrito).toHaveLength(0);
  });

  it('"Comprar ahora" paga solo esa obra y deja lo demás en el carrito', async () => {
    carrito = [{ id: 7, idObra: 52, cantidad: 1 }];

    const detalle = await abrirDetalle(51);
    fireEvent.press(screen.getByTestId('detalle-comprar'));
    await waitFor(() =>
      expect(detalle.navigation.navigate).toHaveBeenCalledWith('FinalizarCompra', {
        soloObra: 51,
      })
    );
    const idLinea = carrito.find((l) => l.idObra === 51).id;
    detalle.unmount();

    await abrir(FinalizarCompraScreen, { soloObra: 51 });
    await llenarDireccion();
    fireEvent.press(screen.getByTestId('finalizar-continuar'));

    await waitFor(() => expect(Linking.openURL).toHaveBeenCalled());
    expect(api.llamadas('POST /api/ventas/checkout')[0].body).toEqual({
      id_direccion_envio: 55,
      ids_carrito: [idLinea],
    });
    expect(carrito.map((l) => l.idObra)).toEqual([52]);
  });
});

describe('Integración: carrito', () => {
  it('quitar una obra la borra en el backend y baja el total', async () => {
    carrito = [
      { id: 7, idObra: 52, cantidad: 1 },
      { id: 8, idObra: 51, cantidad: 1 },
    ];
    await abrir(CarritoScreen);
    expect(await screen.findByText('Xantolo')).toBeTruthy();
    expect(screen.getByTestId('carrito-total')).toHaveTextContent(formatearPrecio(3650));

    fireEvent.press(screen.getByTestId('carrito-0-quitar'));

    await waitFor(() => expect(screen.queryByText('Xantolo')).toBeNull());
    expect(screen.getByTestId('carrito-total')).toHaveTextContent(formatearPrecio(2150));
    expect(api.llamadas('DELETE /api/carrito/7')).toHaveLength(1);
    expect(carrito.map((l) => l.id)).toEqual([8]);
  });

  it('si otra persona la compró antes, no se agrega y se explica por qué', async () => {
    const detalle = await abrirDetalle(53);
    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));

    // El backend responde 400 con su mensaje y la app lo muestra tal cual.
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'No pudimos agregar la obra',
        'Esta obra está agotada'
      )
    );
    expect(detalle.navigation.navigate).not.toHaveBeenCalled();
    expect(carrito).toHaveLength(0);
  });

  it('sin sesión no llama al carrito del backend y pide iniciar sesión', async () => {
    almacen.clear();
    await abrirDetalle(51);
    fireEvent.press(screen.getByTestId('detalle-agregar-carrito'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Inicia sesión',
      'Para agregar obras a tu carrito necesitas una cuenta.',
      expect.any(Array)
    );
    expect(api.llamadas('POST /api/carrito')).toHaveLength(0);
  });

  it('si el pago falla por falta de stock, avisa y no abre Mercado Pago', async () => {
    carrito = [{ id: 7, idObra: 52, cantidad: 1 }];
    api.ruta('POST /api/ventas/checkout', () => [
      400,
      { message: 'Stock insuficiente para "Xantolo".' },
    ]);
    const finalizar = await abrir(FinalizarCompraScreen);
    await llenarDireccion();
    fireEvent.press(screen.getByTestId('finalizar-continuar'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'No pudimos iniciar el pago',
        'Stock insuficiente para "Xantolo".'
      )
    );
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(finalizar.navigation.replace).not.toHaveBeenCalled();
    expect(carrito).toHaveLength(1);
  });
});
