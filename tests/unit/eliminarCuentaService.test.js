import { eliminarCuenta } from '../../src/models/authService';
import { ApiError, apiDelete } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiDelete: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('authService: eliminar la cuenta (ARCO, Cancelación)', () => {
  it('manda la contraseña con el token al endpoint del backend', async () => {
    apiDelete.mockResolvedValue({ message: 'Tu cuenta se eliminó correctamente' });
    await eliminarCuenta({ token: 'tkn', contrasena: 'Huapango.26' });
    expect(apiDelete).toHaveBeenCalledWith('/api/auth/cuenta', {
      token: 'tkn',
      body: { contrasena: 'Huapango.26' },
    });
  });

  it.each([
    [401, 'La contraseña no es correcta'],
    [403, 'Las cuentas de artista y administrador se dan de baja desde soporte.'],
    [409, 'Tienes un pedido en camino. Podrás eliminar tu cuenta cuando se entregue o se cancele.'],
  ])('con %i muestra el mensaje del servidor', async (status, message) => {
    apiDelete.mockRejectedValue(new ApiError('genérico', status, { message }));
    await expect(eliminarCuenta({ token: 't', contrasena: 'x' })).rejects.toMatchObject({
      status,
      message,
    });
  });

  it('no inventa mensajes para errores del servidor (500)', async () => {
    apiDelete.mockRejectedValue(new ApiError('Error del servidor', 500, { message: 'detalle' }));
    await expect(eliminarCuenta({ token: 't', contrasena: 'x' })).rejects.toMatchObject({
      status: 500,
      message: 'Error del servidor',
    });
  });
});
