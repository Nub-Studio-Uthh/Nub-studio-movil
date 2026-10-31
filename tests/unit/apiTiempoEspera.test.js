// Tiempo de espera del cliente HTTP (#115): el backend de Render (plan gratis) tarda
// unos 50 s en despertar, así que se espera hasta 60 s antes de dar el error.

function cargar() {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.prueba.test';
  let modulos;
  jest.isolateModules(() => {
    modulos = {
      api: require('../../src/models/api'),
      auth: require('../../src/models/authService'),
    };
  });
  return modulos;
}

// fetch que nunca responde, como un backend dormido; se rechaza al cancelarse.
function fetchColgado() {
  global.fetch = jest.fn(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      })
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  fetchColgado();
});

afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});

describe('api: tiempo de espera', () => {
  it('espera hasta 60 s antes de avisar que el servidor tarda en responder', async () => {
    const { api } = cargar();
    expect(api.TIMEOUT_MS).toBe(60000);
    const peticion = api.apiGet('/api/obras');
    const resultado = expect(peticion).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('puede estar despertando'),
    });

    await jest.advanceTimersByTimeAsync(59000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(1000);
    await resultado;
  });

  it('cada petición puede pedir su propio tiempo de espera', async () => {
    const { api } = cargar();
    const peticion = api.apiGet('/api/obras', { timeoutMs: 5000 });
    const resultado = expect(peticion).rejects.toMatchObject({ status: 0 });
    await jest.advanceTimersByTimeAsync(5000);
    await resultado;
  });

  it('sin internet avisa de inmediato, sin esperar', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    const { api } = cargar();
    await expect(api.apiGet('/api/obras')).rejects.toMatchObject({
      status: 0,
      message: 'No pudimos conectar con el servidor. Revisa tu conexión a internet.',
    });
  });

  it('al abrir la app la sesión se revisa con solo 8 s de espera', async () => {
    const { auth } = cargar();
    const peticion = auth.verificarSesion('tkn');
    const resultado = expect(peticion).rejects.toMatchObject({ status: 0 });
    await jest.advanceTimersByTimeAsync(7999);
    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await resultado;
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tkn');
  });
});
