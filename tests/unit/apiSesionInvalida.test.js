// Interceptor del 401 (#129): solo los códigos del middleware de sesión avisan que el
// token ya no sirve. Los demás 401 los atiende la pantalla que hizo la petición.

function cargarApi() {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.prueba.test';
  let api;
  jest.isolateModules(() => {
    api = require('../../src/models/api');
  });
  return api;
}

const responder = (status, cuerpo) => {
  global.fetch = jest.fn(async () => ({
    ok: status < 400,
    status,
    json: async () => cuerpo,
  }));
};

describe('api: sesión inválida', () => {
  it.each(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'SESSION_REVOKED', 'VERIFICATION_ERROR'])(
    'con %s avisa el token rechazado y sigue lanzando el error',
    async (code) => {
      const api = cargarApi();
      const manejador = jest.fn();
      api.setManejadorSesionInvalida(manejador);
      responder(401, { message: 'x', code });

      await expect(api.apiGet('/api/carrito', { token: 'tkn' })).rejects.toMatchObject({
        status: 401,
      });
      expect(manejador).toHaveBeenCalledTimes(1);
      expect(manejador).toHaveBeenCalledWith('tkn');
    }
  );

  it('la contraseña incorrecta al eliminar la cuenta no avisa', async () => {
    const api = cargarApi();
    const manejador = jest.fn();
    api.setManejadorSesionInvalida(manejador);
    responder(401, { message: 'La contraseña no es correcta' });

    await expect(
      api.apiDelete('/api/auth/cuenta', { token: 'tkn', body: { contrasena: 'x' } })
    ).rejects.toMatchObject({ status: 401 });
    expect(manejador).not.toHaveBeenCalled();
  });

  it('un 401 sin token, como el login, no avisa', async () => {
    const api = cargarApi();
    const manejador = jest.fn();
    api.setManejadorSesionInvalida(manejador);
    responder(401, { message: 'Credenciales incorrectas', code: 'INVALID_TOKEN' });

    await expect(api.apiPost('/api/auth/login', {})).rejects.toMatchObject({ status: 401 });
    expect(manejador).not.toHaveBeenCalled();
  });

  it.each([
    [403, { code: 'FORBIDDEN' }],
    [500, { code: 'AUTH_ERROR' }],
  ])('un %i no avisa', async (status, cuerpo) => {
    const api = cargarApi();
    const manejador = jest.fn();
    api.setManejadorSesionInvalida(manejador);
    responder(status, cuerpo);

    await expect(api.apiGet('/api/carrito', { token: 'tkn' })).rejects.toMatchObject({ status });
    expect(manejador).not.toHaveBeenCalled();
  });

  it('sin manejador registrado solo lanza el error', async () => {
    const api = cargarApi();
    responder(401, { code: 'TOKEN_EXPIRED' });
    await expect(api.apiGet('/api/carrito', { token: 'tkn' })).rejects.toMatchObject({
      status: 401,
    });
  });
});
