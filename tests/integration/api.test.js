/**
 * @jest-environment node
 *
 * Pruebas de integración contra la API de NUB Studio (backend en Render).
 * Se ejecutan solo si existe la variable API_URL (secreto API_URL_STAGING en GitHub).
 */
const API_URL = process.env.API_URL;
const describeSiHayApi = API_URL ? describe : describe.skip;

// Render puede tardar en "despertar" el servidor en el primer request.
jest.setTimeout(60000);

async function get(ruta, opciones = {}) {
  const res = await fetch(`${API_URL}${ruta}`, opciones);
  const cuerpo = await res.json().catch(() => null);
  return { status: res.status, cuerpo };
}

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

describeSiHayApi('Artistas, colecciones y blog (HU-03, HU-04, HU-05)', () => {
  it.each(['/api/artistas', '/api/colecciones', '/api/blog/posts'])(
    'GET %s responde 200',
    async (ruta) => {
      const { status } = await get(ruta);
      expect(status).toBe(200);
    }
  );
});

describeSiHayApi('Autenticación y rutas protegidas (HU-06, HU-08)', () => {
  it('rechaza el login con credenciales incorrectas', async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Correo que no existe, para no bloquear ninguna cuenta real
      body: JSON.stringify({ correo: 'no-existe-ci@nubstudio.test', contrasena: 'incorrecta123' }),
    });
    expect(res.ok).toBe(false);
  });

  it('GET /api/carrito sin token responde 401 o 403', async () => {
    const { status } = await get('/api/carrito');
    expect([401, 403]).toContain(status);
  });
});
