import { actualizarPerfil, getPerfil } from '../../src/models/perfilService';
import { ApiError, apiGet, apiPut } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
  apiPut: jest.fn(),
}));

const RESPUESTA = {
  success: true,
  data: { nombre: 'Ana', correo: 'ana@correo.mx', telefono: null, acepta_marketing: false },
};

beforeEach(() => jest.clearAllMocks());

describe('perfilService (ARCO)', () => {
  it('consulta el perfil con el token', async () => {
    apiGet.mockResolvedValue(RESPUESTA);
    const signal = new AbortController().signal;
    await expect(getPerfil('tkn', { signal })).resolves.toEqual({
      nombre: 'Ana',
      correo: 'ana@correo.mx',
      telefono: '',
      aceptaMarketing: false,
    });
    expect(apiGet).toHaveBeenCalledWith('/api/auth/perfil', { token: 'tkn', signal });
  });

  it('manda solo los datos que cambiaron', async () => {
    apiPut.mockResolvedValue(RESPUESTA);
    await actualizarPerfil('tkn', { nombre: 'Ana López' });
    expect(apiPut).toHaveBeenCalledWith(
      '/api/auth/perfil',
      { nombre: 'Ana López' },
      { token: 'tkn' }
    );
  });

  it('manda la preferencia con el nombre que espera el backend', async () => {
    apiPut.mockResolvedValue(RESPUESTA);
    await actualizarPerfil('tkn', { aceptaMarketing: false });
    expect(apiPut).toHaveBeenCalledWith(
      '/api/auth/perfil',
      { acepta_marketing: false },
      { token: 'tkn' }
    );
  });

  it('muestra el primer error de validación del servidor', async () => {
    apiPut.mockRejectedValue(
      new ApiError('genérico', 400, {
        errors: [{ campo: 'telefono', mensaje: 'El teléfono debe tener exactamente 10 números' }],
      })
    );
    await expect(actualizarPerfil('t', { telefono: '1' })).rejects.toMatchObject({
      status: 400,
      message: 'El teléfono debe tener exactamente 10 números',
    });
  });

  it('con 404 muestra el mensaje del servidor', async () => {
    apiPut.mockRejectedValue(new ApiError('genérico', 404, { message: 'La cuenta ya no existe' }));
    await expect(actualizarPerfil('t', { nombre: 'Ana' })).rejects.toMatchObject({
      message: 'La cuenta ya no existe',
    });
  });

  it('deja el mensaje general en los demás errores', async () => {
    apiPut.mockRejectedValue(new ApiError('Tu sesión no es válida.', 401, { message: 'x' }));
    await expect(actualizarPerfil('t', { nombre: 'Ana' })).rejects.toMatchObject({
      message: 'Tu sesión no es válida.',
    });
  });
});
