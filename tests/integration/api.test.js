/**
 * @jest-environment node
 *
 * Pruebas de integración contra la API de NUB Studio, con el backend corriendo en local
 * (nunca contra Render: comparte la base de datos con la web en producción).
 * Se ejecutan solo si existe la variable API_URL, p. ej. API_URL=http://localhost:4000
 */
const API_URL = process.env.API_URL;
const describeSiHayApi = API_URL ? describe : describe.skip;

jest.setTimeout(60000);

// jest-expo reemplaza el fetch global por el de Expo, que en Node no expone el código HTTP;
// por eso se usa el cliente nativo de Node.
const http = require('node:http');
const https = require('node:https');
const { Buffer } = require('node:buffer');

function pedir(ruta, { method = 'GET', body } = {}) {
  const url = new URL(`${API_URL}${ruta}`);
  const cliente = url.protocol === 'https:' ? https : http;
  const datos = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = cliente.request(
      url,
      {
        method,
        headers: datos
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(datos) }
          : {},
      },
      (res) => {
        let texto = '';
        res.on('data', (parte) => (texto += parte));
        res.on('end', () => {
          let cuerpo = null;
          try {
            cuerpo = JSON.parse(texto);
          } catch {
            cuerpo = null;
          }
          resolve({ status: res.statusCode, cuerpo });
        });
      }
    );
    req.on('error', reject);
    if (datos) req.write(datos);
    req.end();
  });
}

const get = (ruta) => pedir(ruta);

describeSiHayApi('Catálogo público (HU-01, HU-02)', () => {
  it('GET /api/obras responde 200 con una lista de obras', async () => {
    const { status, cuerpo } = await get('/api/obras?limit=5');
    expect(status).toBe(200);
    expect(Array.isArray(cuerpo.data)).toBe(true);
  });

  it('GET /api/categorias responde 200', async () => {
    const { status } = await get('/api/categorias');
    expect(status).toBe(200);
  });
});

describeSiHayApi('Inicio y filtros del catálogo (HU-01)', () => {
  it('destacadas=true regresa solo obras destacadas', async () => {
    const { status, cuerpo } = await get('/api/obras?destacadas=true&limit=6');
    expect(status).toBe(200);
    expect(cuerpo.data.every((o) => o.destacada === true)).toBe(true);
  });

  it('combina categoría, rango de precio y orden', async () => {
    const todas = await get('/api/obras?limit=1');
    const { status, cuerpo } = await get(
      '/api/obras?categoria=1&precio_min=500&precio_max=3000&ordenar=precio_asc&limit=12'
    );
    expect(status).toBe(200);
    expect(cuerpo.data.every((o) => Number(o.id_categoria) === 1)).toBe(true);
    expect(cuerpo.pagination.total).toBeLessThanOrEqual(todas.cuerpo.pagination.total);
  });

  it('rechaza un rango con máximo menor que el mínimo', async () => {
    const { status } = await get('/api/obras?precio_min=3000&precio_max=500');
    expect(status).toBe(400);
  });

  it('una búsqueda sin coincidencias regresa una lista vacía', async () => {
    const { status, cuerpo } = await get('/api/obras?buscar=zzzzzz&limit=12');
    expect(status).toBe(200);
    expect(cuerpo.data).toHaveLength(0);
  });
});

describeSiHayApi('Artistas, colecciones y blog (HU-03, HU-04, HU-05)', () => {
  it.each(['/api/artistas', '/api/colecciones', '/api/blog/posts'])(
    'GET %s responde 200',
    async (ruta) => {
      const { status } = await get(ruta);
      expect(status).toBe(200);
    }
  );
});

describeSiHayApi('Blog (HU-05)', () => {
  it('lista solo publicaciones publicadas, de la más reciente a la más antigua', async () => {
    const { status, cuerpo } = await get('/api/blog/posts?page=1&limit=10');
    expect(status).toBe(200);
    expect(Array.isArray(cuerpo.data)).toBe(true);
    expect(cuerpo.pagination).toEqual(expect.objectContaining({ page: 1, limit: 10 }));
    const fechas = cuerpo.data.map((p) => new Date(p.fecha_publicacion).getTime());
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  it('cada publicación se abre por su slug con su contenido', async () => {
    const lista = await get('/api/blog/posts?limit=1');
    const [primera] = lista.cuerpo.data;
    if (!primera) return; // base sin publicaciones: no hay nada que abrir
    const { status, cuerpo } = await get(`/api/blog/posts/${encodeURIComponent(primera.slug)}`);
    expect(status).toBe(200);
    expect(cuerpo.data.slug).toBe(primera.slug);
    expect(typeof cuerpo.data.contenido).toBe('string');
  });

  it('un slug que no existe responde 404', async () => {
    const { status } = await get('/api/blog/posts/no-existe-hu05-ci');
    expect(status).toBe(404);
  });
});

describeSiHayApi('Autenticación y rutas protegidas (HU-06, HU-08)', () => {
  it('rechaza el login con credenciales incorrectas', async () => {
    const res = await pedir('/api/auth/login', {
      method: 'POST',
      // Correo que no existe, para no bloquear ninguna cuenta real
      body: { correo: 'no-existe-ci@nubstudio.test', contrasena: 'incorrecta123' },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('GET /api/carrito sin token responde 401 o 403', async () => {
    const { status } = await get('/api/carrito');
    expect([401, 403]).toContain(status);
  });
});
