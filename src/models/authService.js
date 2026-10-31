import { ApiError, apiDelete, apiGet, apiPost } from './api';

const ENDPOINTS = {
  login: '/api/auth/login',
  registro: '/api/auth/register',
  verificarCorreo: '/api/auth/verify-email',
  reenviarCodigo: '/api/auth/resend-code',
  logout: '/api/auth/logout',
  checkSession: '/api/auth/check-session',
  // Derecho ARCO de Cancelación (requisito de Google Play): anonimiza la cuenta del cliente.
  eliminarCuenta: '/api/auth/cuenta',
  // Recuperación de contraseña (públicas): pedir código, validarlo y poner la nueva.
  // El backend no tiene otra ruta para cambiar la contraseña, así que "Cambiar contraseña"
  // de Cuenta también usa este flujo.
  pedirCodigoRecuperacion: '/api/recovery/request-code',
  validarCodigoRecuperacion: '/api/recovery/validate-code',
  restablecerContrasena: '/api/recovery/reset-password',
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

/**
 * Elimina la cuenta del cliente. El backend pide la contraseña para confirmar y responde:
 * 401 contraseña incorrecta, 403 si es artista o admin, 409 si hay un pedido en camino.
 */
export async function eliminarCuenta({ token, contrasena }) {
  try {
    await apiDelete(ENDPOINTS.eliminarCuenta, { token, body: { contrasena } });
  } catch (error) {
    throw conMensajeDelServidor(error, [400, 401, 403, 404, 409]);
  }
}

// ── Recuperación de contraseña ─────────────────────────────────────────────────

/** 401 en recuperación = el código no sirve; 429 = demasiados intentos (el backend dice cuánto esperar). */
function traducirRecuperacion(error) {
  if (!(error instanceof ApiError)) return error;
  if (error.status === 401) {
    return new ApiError('El código no es válido o ya venció. Pide uno nuevo.', 401, error.data);
  }
  if (Array.isArray(error.data?.errors) && error.data.errors.length) {
    return new ApiError(`Contraseña insegura: ${error.data.errors.join('. ')}.`, 400, error.data);
  }
  return conMensajeDelServidor(error, [400, 429]);
}

/**
 * Pide el código de recuperación. Por seguridad el backend responde igual exista o no el
 * correo, así que no revela qué cuentas existen.
 * @returns {Promise<{ correoOculto: string }>}
 */
export async function pedirCodigoRecuperacion(correo) {
  try {
    const data = await apiPost(ENDPOINTS.pedirCodigoRecuperacion, { correo: correo.trim() });
    return { correoOculto: typeof data?.correo === 'string' ? data.correo : correo.trim() };
  } catch (error) {
    throw traducirRecuperacion(error);
  }
}

/** Revisa el código antes de pedir la contraseña nueva. */
export async function validarCodigoRecuperacion({ correo, codigo }) {
  try {
    await apiPost(ENDPOINTS.validarCodigoRecuperacion, { correo: correo.trim(), codigo });
  } catch (error) {
    throw traducirRecuperacion(error);
  }
}

/** Guarda la contraseña nueva; el código se marca como usado. */
export async function restablecerContrasena({ correo, codigo, nueva }) {
  try {
    await apiPost(ENDPOINTS.restablecerContrasena, {
      correo: correo.trim(),
      codigo,
      nuevaContrasena: nueva,
    });
  } catch (error) {
    throw traducirRecuperacion(error);
  }
}
