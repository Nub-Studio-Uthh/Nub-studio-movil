import {
  cerrarSesion,
  login,
  reenviarCodigo,
  registrar,
  verificarCorreo,
  verificarSesion,
} from '../../src/models/authService';
import { ApiError, apiGet, apiPost } from '../../src/models/api';

jest.mock('../../src/models/api', () => ({
  ...jest.requireActual('../../src/models/api'),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

const MSG_CARACTERES =
  'Algún dato contiene caracteres no permitidos. Revisa los datos que escribiste.';

describe('authService: login (HU-06)', () => {
  it('envía el correo sin espacios y regresa el token y el usuario', async () => {
    apiPost.mockResolvedValue({ access_token: 'tk', usuario: { id: 1, rol: 'cliente' } });
    const res = await login({ correo: '  ana@mail.com ', contrasena: 'Secreta1!' });
    expect(apiPost).toHaveBeenCalledWith('/api/auth/login', {
      correo: 'ana@mail.com',
      contrasena: 'Secreta1!',
    });
    expect(res).toEqual({ token: 'tk', usuario: { id: 1, rol: 'cliente' } });
  });

  it('una cuenta con verificación en dos pasos (sin token) no se soporta', async () => {
    apiPost.mockResolvedValue({ requires2FA: true });
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: expect.stringContaining('dos pasos'),
    });
  });

  it('404 dice que no existe una cuenta con ese correo', async () => {
    apiPost.mockRejectedValue(new ApiError('No encontrado', 404, { message: 'User not found' }));
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toMatchObject({
      status: 404,
      message: 'No existe una cuenta con ese correo.',
    });
  });

  it('401 usa el mensaje del servidor', async () => {
    apiPost.mockRejectedValue(
      new ApiError('No autorizado', 401, { message: 'Contraseña incorrecta' })
    );
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toMatchObject({
      status: 401,
      message: 'Contraseña incorrecta',
    });
  });

  it('si el filtro del backend rechaza los datos avisa de caracteres no permitidos', async () => {
    apiPost.mockRejectedValue(
      new ApiError('Bad request', 400, { code: 'SQL_INJECTION_DETECTED', message: 'Bloqueado' })
    );
    await expect(login({ correo: "a'--@b.com", contrasena: 'x' })).rejects.toMatchObject({
      status: 400,
      message: MSG_CARACTERES,
    });
  });

  it('un 500 sin traducción pasa tal cual', async () => {
    const error = new ApiError('Error del servidor', 500, { message: 'Falla' });
    apiPost.mockRejectedValue(error);
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toBe(error);
  });

  it('un error con otro código no se muestra como caracteres no permitidos', async () => {
    apiPost.mockRejectedValue(
      new ApiError('No autorizado', 401, { code: 'CUENTA_BLOQUEADA', message: 'Cuenta bloqueada' })
    );
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toMatchObject({
      status: 401,
      message: 'Cuenta bloqueada',
    });
  });

  it.each(['artista', 'admin'])(
    'una cuenta de %s no entra y se cierra la sesión que abrió el backend (#148)',
    async (rol) => {
      apiPost
        .mockResolvedValueOnce({ access_token: 'tk-artista', usuario: { id: 7, rol } })
        .mockResolvedValueOnce({ message: 'Sesion cerrada' });
      await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toMatchObject({
        name: 'ApiError',
        status: 403,
        message: expect.stringContaining('solo para clientes'),
      });
      expect(apiPost).toHaveBeenLastCalledWith('/api/auth/logout', {}, { token: 'tk-artista' });
    }
  );

  it('si no se puede cerrar la sesión en el backend, igual muestra el aviso (#148)', async () => {
    apiPost
      .mockResolvedValueOnce({ access_token: 'tk', usuario: { id: 7, rol: 'artista' } })
      .mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('un error que no es de la API pasa tal cual', async () => {
    const error = new TypeError('fallo inesperado');
    apiPost.mockRejectedValue(error);
    await expect(login({ correo: 'a@b.com', contrasena: 'x' })).rejects.toBe(error);
  });
});

describe('authService: registrar (HU-06)', () => {
  const DATOS = { nombre: ' Ana ', correo: ' ana@mail.com ', contrasena: 'Secreta1!' };

  it('crea la cuenta con los datos sin espacios y acepta los términos', async () => {
    apiPost.mockResolvedValue({ success: true });
    expect(await registrar(DATOS)).toEqual({ correo: 'ana@mail.com' });
    expect(apiPost).toHaveBeenCalledWith('/api/auth/register', {
      nombre: 'Ana',
      correo: 'ana@mail.com',
      contrasena: 'Secreta1!',
      aceptoTerminos: true,
    });
  });

  it('si el correo ya existe responde 409 con un mensaje claro', async () => {
    apiPost.mockRejectedValue(
      new ApiError('Bad request', 400, { message: 'El correo ya está registrado' })
    );
    await expect(registrar(DATOS)).rejects.toMatchObject({
      status: 409,
      message: 'Este correo ya está registrado.',
    });
  });

  it('una contraseña insegura lista los motivos del backend', async () => {
    apiPost.mockRejectedValue(
      new ApiError('Bad request', 400, { errors: ['Mínimo 8 caracteres', 'Falta un número'] })
    );
    await expect(registrar(DATOS)).rejects.toMatchObject({
      status: 400,
      message: 'Contraseña insegura: Mínimo 8 caracteres. Falta un número.',
    });
  });

  it('500 (no se pudo enviar el correo) usa el mensaje del servidor', async () => {
    apiPost.mockRejectedValue(
      new ApiError('Error', 500, { message: 'No pudimos enviar el correo de verificación' })
    );
    await expect(registrar(DATOS)).rejects.toMatchObject({
      status: 500,
      message: 'No pudimos enviar el correo de verificación',
    });
  });

  it('un error que no es de la API pasa tal cual', async () => {
    const error = new Error('red');
    apiPost.mockRejectedValue(error);
    await expect(registrar(DATOS)).rejects.toBe(error);
  });
});

describe('authService: verificar correo y reenviar código', () => {
  it('verifica el correo con el código', async () => {
    apiPost.mockResolvedValue({ success: true });
    await verificarCorreo({ correo: 'ana@mail.com', codigo: '123456' });
    expect(apiPost).toHaveBeenCalledWith('/api/auth/verify-email', {
      correo: 'ana@mail.com',
      codigo: '123456',
    });
  });

  it('un código incorrecto usa el mensaje del servidor', async () => {
    apiPost.mockRejectedValue(new ApiError('Bad request', 400, { message: 'Código incorrecto' }));
    await expect(verificarCorreo({ correo: 'a@b.com', codigo: '000000' })).rejects.toMatchObject({
      message: 'Código incorrecto',
    });
  });

  it('reenvía el código al correo', async () => {
    apiPost.mockResolvedValue({ success: true });
    await reenviarCodigo('ana@mail.com');
    expect(apiPost).toHaveBeenCalledWith('/api/auth/resend-code', { correo: 'ana@mail.com' });
  });

  it('si no se pudo reenviar (500) usa el mensaje del servidor', async () => {
    apiPost.mockRejectedValue(new ApiError('Error', 500, { message: 'Intenta más tarde' }));
    await expect(reenviarCodigo('ana@mail.com')).rejects.toMatchObject({
      status: 500,
      message: 'Intenta más tarde',
    });
  });
});

describe('authService: sesión', () => {
  it('revisa la sesión con el token y una espera corta', async () => {
    apiGet.mockResolvedValue({ success: true });
    await verificarSesion('tk');
    expect(apiGet).toHaveBeenCalledWith('/api/auth/check-session', {
      token: 'tk',
      timeoutMs: 8000,
    });
  });

  it('cierra la sesión con el token', async () => {
    apiPost.mockResolvedValue({ success: true });
    await cerrarSesion('tk');
    expect(apiPost).toHaveBeenCalledWith('/api/auth/logout', {}, { token: 'tk' });
  });
});
