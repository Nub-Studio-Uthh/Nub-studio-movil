import {
  pedirCodigoRecuperacion,
  restablecerContrasena,
  validarCodigoRecuperacion,
} from '../../src/models/authService';
import { ApiError, apiPost } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiPost: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe('authService: recuperación de contraseña (HU-06)', () => {
  it('pide el código y regresa el correo oculto', async () => {
    apiPost.mockResolvedValue({ message: 'ok', correo: 'gu***zo@g***.com' });
    await expect(pedirCodigoRecuperacion(' gustavo@correo.com ')).resolves.toEqual({
      correoOculto: 'gu***zo@g***.com',
    });
    expect(apiPost).toHaveBeenCalledWith('/api/recovery/request-code', {
      correo: 'gustavo@correo.com',
    });
  });

  it('muestra cuánto esperar si hubo demasiados intentos', async () => {
    apiPost.mockRejectedValue(
      new ApiError('genérico', 429, {
        message: 'Por favor espera 15 minutos antes de intentar de nuevo.',
      })
    );
    await expect(pedirCodigoRecuperacion('a@b.com')).rejects.toMatchObject({
      status: 429,
      message: 'Por favor espera 15 minutos antes de intentar de nuevo.',
    });
  });

  it('valida el código y explica si ya venció', async () => {
    apiPost.mockResolvedValueOnce({ valid: true });
    await validarCodigoRecuperacion({ correo: 'a@b.com', codigo: 'VM32V8' });
    expect(apiPost).toHaveBeenCalledWith('/api/recovery/validate-code', {
      correo: 'a@b.com',
      codigo: 'VM32V8',
    });

    apiPost.mockRejectedValueOnce(
      new ApiError('x', 401, { message: 'Codigo invalido o expirado' })
    );
    await expect(
      validarCodigoRecuperacion({ correo: 'a@b.com', codigo: 'XXXXXX' })
    ).rejects.toMatchObject({
      message: 'El código no es válido o ya venció. Pide uno nuevo.',
    });
  });

  it('guarda la contraseña nueva con los nombres de campo del backend', async () => {
    apiPost.mockResolvedValue({ success: true });
    await restablecerContrasena({ correo: 'a@b.com', codigo: 'VM32V8', nueva: 'Huapango.26' });
    expect(apiPost).toHaveBeenCalledWith('/api/recovery/reset-password', {
      correo: 'a@b.com',
      codigo: 'VM32V8',
      nuevaContrasena: 'Huapango.26',
    });
  });

  it('junta los motivos cuando la contraseña es insegura o igual a la anterior', async () => {
    apiPost.mockRejectedValueOnce(
      new ApiError('x', 400, {
        message: 'Contrasena insegura',
        errors: ['Debe tener al menos 8 caracteres'],
      })
    );
    await expect(
      restablecerContrasena({ correo: 'a@b.com', codigo: 'VM32V8', nueva: 'x' })
    ).rejects.toMatchObject({ message: 'Contraseña insegura: Debe tener al menos 8 caracteres.' });

    apiPost.mockRejectedValueOnce(
      new ApiError('x', 400, { message: 'La nueva contrasena no puede ser igual a la anterior' })
    );
    await expect(
      restablecerContrasena({ correo: 'a@b.com', codigo: 'VM32V8', nueva: 'Huapango.26' })
    ).rejects.toMatchObject({ message: 'La nueva contrasena no puede ser igual a la anterior' });
  });
});
