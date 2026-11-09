/* global jest */
// Backend falso para las pruebas de integración con jest.mock (#45).
//
// Solo se reemplaza fetch: api.js, los services, los normalizadores, los contextos, los
// viewmodels y las pantallas corren de verdad, igual que en la app. Las respuestas usan el
// mismo formato que el backend real ({ data: [...] }, campos en snake_case, códigos HTTP).
//
// Se importa ANTES que cualquier módulo de src/ para que api.js lea esta URL al cargarse.
process.env.EXPO_PUBLIC_API_URL = 'https://api.prueba.test';

/**
 * Crea un backend falso y lo conecta como fetch global.
 * Las rutas se registran con "MÉTODO /ruta"; los segmentos :param coinciden con cualquier valor.
 *
 *   const api = crearBackend();
 *   api.ruta('GET /api/obras', () => ({ data: [...] }));
 *   api.ruta('POST /api/auth/login', ({ body }) => [401, { message: 'Credenciales inválidas' }]);
 *
 * El manejador regresa el cuerpo (status 200) o [status, cuerpo].
 * api.peticiones guarda cada petición: { metodo, ruta, query, body, token, params }.
 */
export function crearBackend() {
  const rutas = [];
  const peticiones = [];

  const ruta = (firma, manejador) => {
    const [metodo, patron] = firma.split(' ');
    const segmentos = patron.split('/');
    rutas.unshift({ metodo, segmentos, manejador }); // la última registrada gana
  };

  const buscar = (metodo, pathname) => {
    const partes = pathname.split('/');
    for (const r of rutas) {
      if (r.metodo !== metodo || r.segmentos.length !== partes.length) continue;
      const params = {};
      const coincide = r.segmentos.every((s, i) => {
        if (s.startsWith(':')) {
          params[s.slice(1)] = decodeURIComponent(partes[i]);
          return true;
        }
        return s === partes[i];
      });
      if (coincide) return { manejador: r.manejador, params };
    }
    return null;
  };

  global.fetch = jest.fn(async (url, init = {}) => {
    const u = new URL(url);
    const metodo = init.method ?? 'GET';
    const auth = init.headers?.Authorization ?? '';
    const peticion = {
      metodo,
      ruta: u.pathname,
      query: Object.fromEntries(u.searchParams),
      body: init.body ? JSON.parse(init.body) : undefined,
      token: auth.startsWith('Bearer ') ? auth.slice(7) : null,
      params: {},
    };
    peticiones.push(peticion);

    const encontrada = buscar(metodo, u.pathname);
    let status = 404;
    let cuerpo = { message: `Ruta no simulada: ${metodo} ${u.pathname}` };
    if (encontrada) {
      peticion.params = encontrada.params;
      const r = await encontrada.manejador(peticion);
      [status, cuerpo] = Array.isArray(r) ? r : [200, r];
    }
    return { ok: status < 400, status, json: async () => cuerpo };
  });

  /** Peticiones hechas a una ruta (por ejemplo "POST /api/carrito"). */
  const llamadas = (firma) => {
    const [metodo, ruta] = firma.split(' ');
    return peticiones.filter((p) => p.metodo === metodo && p.ruta === ruta);
  };

  return { ruta, peticiones, llamadas };
}

// ── Datos con el formato del backend ─────────────────────────────────────────────

export const CLIENTE = {
  id_usuario: 9,
  nombre: 'Ana López',
  correo: 'ana@mail.com',
  rol: 'cliente',
};

export const obraApi = (id, titulo, extra = {}) => ({
  id_obra: id,
  slug: `obra-${id}`,
  titulo,
  imagen_principal: null,
  artista_alias: 'Mariana Castillo',
  categoria_nombre: 'Pintura',
  precio_base: '1500.00',
  precio_oferta: null,
  destacada: false,
  estado: 'publicada',
  ...extra,
});

export const obraDetalleApi = (id, titulo, extra = {}) => ({
  ...obraApi(id, titulo),
  descripcion: 'Óleo sobre tela.',
  historia: '',
  anio_creacion: 2024,
  imagenes: [],
  permite_marco: false,
  con_certificado: false,
  stock_disponible: 5,
  id_artista: 27,
  artista_foto: null,
  ...extra,
});

export const lineaCarritoApi = (idCarrito, idObra, titulo, precio, cantidad = 1) => ({
  id_carrito: idCarrito,
  id_obra: idObra,
  slug: `obra-${idObra}`,
  titulo,
  imagen_principal: null,
  artista_alias: 'Mariana Castillo',
  cantidad,
  precio_base: String(precio),
  precio_efectivo: String(precio),
  tiene_descuento: false,
  stock_disponible: 5,
});
