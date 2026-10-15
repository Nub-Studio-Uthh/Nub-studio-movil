import { ApiError, apiGet, apiPost, apiPut } from './api';

const ENDPOINTS = {
  login: '/api/auth/login',
  registro: '/api/auth/register',
  verificarCorreo: '/api/auth/verify-email',
  reenviarCodigo: '/api/auth/resend-code',
  logout: '/api/auth/logout',
  checkSession: '/api/auth/check-session',
  // TODO: confirmar con el backend (no aparece en authRoutes)
  cambiarContrasena: '/api/auth/cambiar-contrasena',
};

const MSG_CARACTERES =
  'Algún dato contiene caracteres no permitidos. Revisa el correo y la contraseña.';

const mensajeServidor = (error) =>
  typeof error?.data?.message === 'string' ? error.data.message : null;

// Los middlewares del backend rechazan con un `code` (SQL_INJECTION_DETECTED / XSS_DETECTED)
const esRechazoDeFiltro = (error) => !!error?.data?.code;

/** Usa el mensaje del servidor (ya viene en español) para los errores 4xx esperados. */
function conMensajeDelServidor(error, statuses = [400, 401, 403, 404]) {
  if (!(error instanceof ApiError)) return error;
  if (esRechazoDeFiltro(error)) return new ApiError(MSG_CARACTERES, error.status, error.data);
  const msg = mensajeServidor(error);
  if (msg && statuses.includes(error.status)) return new ApiError(msg, error.status, error.data);
  return error;
}

function traducirLogin(error) {
  if (error instanceof ApiError && error.status === 404) {
    return new ApiError('No existe una cuenta con ese correo.', 404, error.data);
  }
  return conMensajeDelServidor(error);
}

function traducirRegistro(error) {
  if (!(error instanceof ApiError)) return error;
  const msg = mensajeServidor(error);
  if (msg && /registrado/i.test(msg)) {
    return new ApiError('Este correo ya está registrado.', 409, error.data);
  }
  if (Array.isArray(error.data?.errors) && error.data.errors.length) {
    return new ApiError(`Contraseña insegura: ${error.data.errors.join('. ')}.`, 400, error.data);
  }
  // 500 = no se pudo enviar el correo de verificación (el backend ya borró la cuenta)
  return conMensajeDelServidor(error, [400, 500]);
}

export async function login({ correo, contrasena }) {
  let data;
  try {
    data = await apiPost(ENDPOINTS.login, { correo: correo.trim(), contrasena });
  } catch (error) {
    throw traducirLogin(error);
  }
  // Cuentas con 2FA: el backend responde 200 sin token. No se soporta en la app.
  if (!data?.access_token) {
    throw new ApiError(
      'Esta cuenta usa verificación en dos pasos, que aún no está disponible en la app.',
      0,
      data
    );
  }
  return { token: data.access_token, usuario: data.usuario };
}

/** Crea la cuenta. NO inicia sesión: primero hay que verificar el correo con el código. */
export async function registrar({ nombre, correo, contrasena }) {
  try {
    await apiPost(ENDPOINTS.registro, {
      nombre: nombre.trim(),
      correo: correo.trim(),
      contrasena,
      aceptoTerminos: true,
    });
  } catch (error) {
    throw traducirRegistro(error);
  }
  return { correo: correo.trim() };
}

export async function verificarCorreo({ correo, codigo }) {
  try {
    await apiPost(ENDPOINTS.verificarCorreo, { correo, codigo });
  } catch (error) {
    throw conMensajeDelServidor(error);
  }
}

export async function reenviarCodigo(correo) {
  try {
    await apiPost(ENDPOINTS.reenviarCodigo, { correo });
  } catch (error) {
    throw conMensajeDelServidor(error, [400, 404, 500]);
  }
}

/** Lanza ApiError 401 si el token venció o fue revocado. */
export const verificarSesion = (token) => apiGet(ENDPOINTS.checkSession, { token });

export const cerrarSesion = (token) => apiPost(ENDPOINTS.logout, {}, { token });

// TODO: confirmar ruta y campos con el backend
export async function cambiarContrasena(token, { actual, nueva }) {
  try {
    return await apiPut(
      ENDPOINTS.cambiarContrasena,
      { contrasenaActual: actual, contrasenaNueva: nueva },
      { token }
    );
  } catch (error) {
    throw conMensajeDelServidor(error);
  }
}
