// Funciones puras de "¿Olvidaste tu contraseña?" (HU-06). Siguen las reglas del backend
// (recoveryController): el código son 6 letras o números y la contraseña nueva debe ser segura.

/** Deja el código como lo espera el backend: solo letras y números, en mayúsculas, máximo 6. */
export function normalizarCodigoRecuperacion(valor) {
  return String(valor ?? '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
}

/** El código de recuperación son 6 letras o números (por ejemplo "VM32V8"). */
export function esCodigoRecuperacion(codigo) {
  return /^[A-Z0-9]{6}$/.test(String(codigo ?? ''));
}

const ESPECIALES = /[@$!%*?&#._-]/;

/**
 * Lo primero que le falta a la contraseña nueva según el backend, o null si es segura.
 * @param {string} contrasena
 */
export function faltaEnContrasena(contrasena) {
  const c = String(contrasena ?? '');
  if (c.length < 8) return 'Mínimo 8 caracteres.';
  if (c.length > 128) return 'Máximo 128 caracteres.';
  if (!/[A-Z]/.test(c)) return 'Agrega al menos una mayúscula.';
  if (!/[a-z]/.test(c)) return 'Agrega al menos una minúscula.';
  if (!/\d/.test(c)) return 'Agrega al menos un número.';
  if (!ESPECIALES.test(c)) return 'Agrega un carácter especial (@$!%*?&#._-).';
  if (/(.)\1{3,}/.test(c)) return 'No repitas el mismo carácter más de 3 veces seguidas.';
  if (/(?:012|123|234|345|456|567|678|789|890){2,}/.test(c))
    return 'Evita secuencias de números como 123456.';
  return null;
}

/**
 * Valida la contraseña nueva y su confirmación.
 * @returns {Record<string, string>} errores por campo; vacío si todo está bien
 */
export function validarNuevaContrasena({ nueva, confirmacion }) {
  const errores = {};
  const falta = faltaEnContrasena(nueva);
  if (falta) errores.nueva = falta;
  if (!errores.nueva && nueva !== confirmacion)
    errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}
